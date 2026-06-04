/**
 * StatusEngine — Motor centralizado de status acadêmico
 *
 * Responsável por:
 * - Determinar status efetivo de tarefas (detecção de atraso atômico)
 * - Calcular progresso ponderado por disciplina
 * - Verificar dependências (bloqueio)
 * - Sincronizar status em lote para um usuário
 */

const AcademicTask = require('../models/AcademicTask');

const statusEngine = {
  /**
   * Determina o status efetivo de uma tarefa com base no tempo e dependências.
   * Regras:
   *  - Se concluída → mantém concluida (imutável)
   *  - Se bloqueada e dependências resolvidas → pendente
   *  - Se pendente/em_andamento e data_prevista < agora → atrasada
   *
   * @param {Object} task - Documento da tarefa (plain object ou Mongoose doc)
   * @param {Object[]} [allTasks] - Todas as tarefas do usuário (necessário para resolver deps)
   * @returns {string} Status efetivo
   */
  computeEffectiveStatus(task, allTasks = []) {
    // Concluída é um estado terminal — nunca muda automaticamente
    if (task.status === 'concluida') return 'concluida';

    let effectiveStatus = task.status || 'pendente';

    // Verificar bloqueio
    if (effectiveStatus === 'bloqueada' || (task.blocked_by && task.blocked_by.length > 0)) {
      const resolved = statusEngine.areDependenciesResolved(task, allTasks);
      if (!resolved) {
        return 'bloqueada';
      } else if (effectiveStatus === 'bloqueada') {
        // Dependências resolvidas — volta para pendente
        effectiveStatus = 'pendente';
      }
    }

    // Verificar atraso atômico
    if (task.data_prevista) {
      const now = new Date();
      const deadline = new Date(task.data_prevista);
      // Considerar atrasada apenas se a data prevista já passou (fim do dia)
      deadline.setHours(23, 59, 59, 999);

      if (deadline < now && effectiveStatus !== 'concluida') {
        return 'atrasada';
      }
    }

    // Manter status atual se não há gatilho de mudança
    if (effectiveStatus === 'atrasada') {
      // Se não atende mais critério de atraso (data futura ou sem data), volta a pendente
      return 'pendente';
    }

    return effectiveStatus;
  },

  /**
   * Calcula o progresso ponderado de um conjunto de tarefas.
   * Peso de cada tarefa é considerado — tarefas com peso maior têm mais impacto.
   *
   * @param {Object[]} tasks - Array de tarefas
   * @returns {{ progress: number, completed: number, total: number, weightedCompleted: number, weightedTotal: number }}
   */
  computeWeightedProgress(tasks) {
    if (!tasks || tasks.length === 0) {
      return { progress: 0, completed: 0, total: 0, weightedCompleted: 0, weightedTotal: 0 };
    }

    let weightedCompleted = 0;
    let weightedTotal = 0;
    let completed = 0;

    tasks.forEach(task => {
      const peso = Number(task.peso) || 1;
      weightedTotal += peso;

      if (task.status === 'concluida') {
        weightedCompleted += peso;
        completed++;
      }
    });

    const progress = weightedTotal === 0 ? 0 : Math.round((weightedCompleted / weightedTotal) * 100);

    return {
      progress,
      completed,
      total: tasks.length,
      weightedCompleted,
      weightedTotal,
    };
  },

  /**
   * Verifica se todas as dependências de bloqueio de uma tarefa estão concluídas.
   *
   * @param {Object} task - Tarefa com campo blocked_by
   * @param {Object[]} allTasks - Todas as tarefas disponíveis para lookup
   * @returns {boolean} true se todas as dependências estão concluídas ou se não há dependências
   */
  areDependenciesResolved(task, allTasks = []) {
    if (!task.blocked_by || task.blocked_by.length === 0) return true;

    return task.blocked_by.every(depId => {
      // Quando populado, depId pode ser objeto. Obter o valor da string.
      const depIdStr = typeof depId === 'object' && depId !== null
        ? String(depId._id || depId.id || depId)
        : String(depId);
      const depTask = allTasks.find(t => String(t._id || t.id) === depIdStr);
      // Se a tarefa dependente não existe, considerar resolvida (evitar bloqueio permanente)
      if (!depTask) return true;
      return depTask.status === 'concluida';
    });
  },

  /**
   * Sincroniza o status de todas as tarefas de um usuário.
   * Executa detecção de atraso e resolução de dependências em lote.
   *
   * @param {string} userId - ID do usuário
   * @returns {Promise<{ updated: number, details: string[] }>}
   */
  async syncAllStatuses(userId) {
    const tasks = await AcademicTask.find({ user_id: userId, is_deleted: false });
    const details = [];
    let updated = 0;

    const plainTasks = tasks.map(t => t.toObject());

    for (const task of tasks) {
      const effectiveStatus = statusEngine.computeEffectiveStatus(task.toObject(), plainTasks);

      if (effectiveStatus !== task.status) {
        const oldStatus = task.status;

        // Se estava em_andamento e mudou, fechar a sessão de foco
        if (oldStatus === 'em_andamento') {
          const User = require('../models/User');
          const user = await User.findById(userId);
          const limitHours = user?.settings?.timer_limit_hours ?? 4;
          task.closeSession(limitHours);
        }

        // Se mudou para em_andamento, iniciar a sessão de foco
        if (effectiveStatus === 'em_andamento') {
          task.startSession();
        }

        task.status = effectiveStatus;

        // Registrar no histórico
        task.history.push({
          action: 'Auto-Status',
          timestamp: new Date(),
          details: `Status alterado automaticamente: "${oldStatus}" → "${effectiveStatus}"`,
        });

        await task.save();
        updated++;
        details.push(`"${task.titulo}": ${oldStatus} → ${effectiveStatus}`);
      }
    }

    return { updated, details };
  },

  /**
   * Valida se uma transição de status é permitida.
   *
   * @param {string} from - Status atual
   * @param {string} to - Status desejado
   * @returns {{ valid: boolean, reason?: string }}
   */
  validateTransition(from, to) {
    // Transições válidas
    const allowed = {
      pendente: ['em_andamento', 'concluida', 'bloqueada', 'atrasada'],
      em_andamento: ['concluida', 'pendente', 'atrasada'],
      atrasada: ['em_andamento', 'concluida', 'pendente'],
      bloqueada: ['pendente'], // Só pode ir para pendente quando deps resolvidas
      concluida: ['pendente'], // Reabrir
    };

    const validTargets = allowed[from] || [];
    if (validTargets.includes(to)) {
      return { valid: true };
    }

    return {
      valid: false,
      reason: `Transição de "${from}" para "${to}" não é permitida.`,
    };
  },
};

module.exports = statusEngine;
