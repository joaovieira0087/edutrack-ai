const AcademicTask = require('../models/AcademicTask');
const statusEngine = require('../services/statusEngine');

/**
 * Converte data_prevista de string YYYY-MM-DD para Date se necessário.
 * Compatibilidade com frontend que envia strings.
 */
const parseDateField = (value) => {
  if (!value) return value;
  if (value instanceof Date) return value;
  // String YYYY-MM-DD → Date no fim do dia (deadline)
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(value + 'T23:59:59.999Z');
  }
  return new Date(value);
};

/**
 * Normaliza o status para o novo formato (underscore).
 * Compatibilidade com dados antigos que usam "em andamento".
 */
const normalizeStatus = (status) => {
  if (status === 'em andamento') return 'em_andamento';
  return status;
};

/**
 * Mapeia um documento Mongoose para o formato de resposta da API.
 * Inclui campo `id` e formata `data_prevista` como YYYY-MM-DD para compatibilidade frontend.
 */
const mapTaskToResponse = (task) => {
  const obj = typeof task.toObject === 'function' ? task.toObject() : { ...task };
  obj.id = obj._id;
  // Formatar data_prevista como YYYY-MM-DD para o frontend
  if (obj.data_prevista instanceof Date) {
    obj.data_prevista = obj.data_prevista.toISOString().split('T')[0];
  }
  
  // Garantir que a população não quebre as referências a IDs no Frontend (que espera String)
  if (obj.subject_id && typeof obj.subject_id === 'object' && obj.subject_id._id) {
    obj.subject = obj.subject_id; // Entrega o objeto preenchido no Node
    obj.subject_id = obj.subject_id._id.toString(); // Deixa string raiz para lookup
  }
  
  return obj;
};

const taskController = {
  // GET /tasks
  getAll: async (req, res) => {
    try {
      const tasks = await AcademicTask.find({ user_id: req.user.id, is_deleted: false })
        .populate('blocked_by', 'titulo status')
        .populate('subject_id', 'nome')
        .sort({ data_prevista: 1 });

      // Aplicar status efetivo em tempo de leitura (detecção de atraso)
      const plainTasks = tasks.map(t => t.toObject());
      const mappedTasks = tasks.map(t => {
        const obj = mapTaskToResponse(t);
        obj.status = statusEngine.computeEffectiveStatus(t.toObject(), plainTasks);
        return obj;
      });

      res.json(mappedTasks);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar tarefas', error: error.message });
    }
  },

  // GET /tasks/trash
  getTrash: async (req, res) => {
    try {
      const tasks = await AcademicTask.find({ user_id: req.user.id, is_deleted: true })
        .populate('blocked_by', 'titulo status')
        .populate('subject_id', 'nome')
        .sort({ updatedAt: -1 });
      const mappedTasks = tasks.map(t => mapTaskToResponse(t));
      res.json(mappedTasks);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar lixeira', error: error.message });
    }
  },

  // GET /tasks/:id
  getById: async (req, res) => {
    try {
      const id = req.params.id || req.query.academic_tasks_id;
      if (!id) return res.status(400).json({ message: 'ID da tarefa é requerido.' });

      const task = await AcademicTask.findOne({ _id: id, user_id: req.user.id })
        .populate('blocked_by', 'titulo status')
        .populate('subject_id', 'nome');
      if (!task) return res.status(404).json({ message: 'Tarefa não encontrada' });

      // Resolver dependências para status efetivo
      const allTasks = await AcademicTask.find({ user_id: req.user.id, is_deleted: false });
      const plainTasks = allTasks.map(t => t.toObject());

      const obj = mapTaskToResponse(task);
      obj.status = statusEngine.computeEffectiveStatus(task.toObject(), plainTasks);
      res.json(obj);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar tarefa', error: error.message });
    }
  },

  // POST /tasks
  create: async (req, res) => {
    try {
      const body = { ...req.body };

      // Normalizar status
      if (body.status) body.status = normalizeStatus(body.status);

      // Parsear data_prevista
      if (body.data_prevista) body.data_prevista = parseDateField(body.data_prevista);

      // Validação real de dependências (blocked_by)
      if (body.blocked_by && body.blocked_by.length > 0) {
        // Filtrar IDs válidos e buscar tarefas no banco
        const depTasks = await AcademicTask.find({
          _id: { $in: body.blocked_by },
          user_id: req.user.id,
          is_deleted: false,
        });
        // Manter apenas IDs que existem
        body.blocked_by = depTasks.map(t => t._id);
        // Verificar se alguma dependência não está concluída
        const hasUnresolvedDeps = depTasks.some(t => t.status !== 'concluida');
        if (hasUnresolvedDeps) {
          body.status = 'bloqueada';
        }
      }

      // Detecção de atraso na criação: se data_prevista é passada e não está bloqueada/concluída
      if (
        body.status !== 'bloqueada' &&
        body.status !== 'concluida' &&
        body.data_prevista
      ) {
        const now = new Date();
        if (body.data_prevista < now) {
          body.status = 'atrasada';
        }
      }

      const statusLabel = body.status || 'pendente';
      const newTask = new AcademicTask({
        ...body,
        user_id: req.user.id,
        history: [{
          action: 'Criação',
          timestamp: new Date(),
          details: `Tarefa "${body.titulo}" criada com status "${statusLabel}".`,
        }],
      });
      await newTask.save();

      const obj = mapTaskToResponse(newTask);
      res.status(201).json(obj);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao criar tarefa', error: error.message });
    }
  },

  // PUT/PATCH /tasks/:id
  update: async (req, res) => {
    try {
      const id = req.params.id;
      if (!id) return res.status(400).json({ message: 'ID da tarefa é requerido.' });

      const body = { ...req.body };

      // Normalizar status
      if (body.status) body.status = normalizeStatus(body.status);

      // Parsear data_prevista
      if (body.data_prevista) body.data_prevista = parseDateField(body.data_prevista);

      // Buscar tarefa atual para validações
      const currentTask = await AcademicTask.findOne({ _id: id, user_id: req.user.id });
      if (!currentTask) return res.status(404).json({ message: 'Tarefa não encontrada' });

      // Verificar transição de status se mudou
      if (body.status && currentTask.status !== body.status) {
        const transition = statusEngine.validateTransition(currentTask.status, body.status);
        if (!transition.valid) {
          return res.status(400).json({ message: transition.reason });
        }

        // Registrar timestamps de conclusão
        if (body.status === 'concluida') {
          body.completed_at = new Date();
        } else if (currentTask.status === 'concluida' && body.status !== 'concluida') {
          body.completed_at = null;
        }
      }

      // Verificação de atraso retrospectiva: se data_prevista foi editada para o passado
      // e a tarefa não está concluída/bloqueada, transicionar para atrasada
      if (body.data_prevista) {
        const effectiveStatus = body.status || currentTask.status;
        if (effectiveStatus !== 'concluida' && effectiveStatus !== 'bloqueada') {
          const now = new Date();
          if (body.data_prevista < now) {
            body.status = 'atrasada';
          }
        }
      }

      // Build a human-readable details string from changed fields
      const fieldLabels = {
        titulo: 'Título',
        descricao: 'Descrição',
        priority: 'Prioridade',
        data_prevista: 'Data Prevista',
        subject_id: 'Disciplina',
        status: 'Status',
        tags: 'Etiquetas',
        peso: 'Peso',
        blocked_by: 'Dependências',
      };
      const changedFields = Object.keys(body)
        .filter(k => fieldLabels[k])
        .map(k => fieldLabels[k]);
      const details = changedFields.length > 0
        ? `Campos alterados: ${changedFields.join(', ')}.`
        : 'Atualização realizada.';

      const updatedTask = await AcademicTask.findOneAndUpdate(
        { _id: id, user_id: req.user.id },
        {
          $set: body,
          $push: {
            history: {
              action: 'Edição',
              timestamp: new Date(),
              details,
            },
          },
        },
        { new: true }
      );

      if (!updatedTask) return res.status(404).json({ message: 'Tarefa não encontrada' });

      // ═══ Efeito Cascata de Desbloqueio ═══
      // Ao concluir uma tarefa, verificar se outras tarefas dependem dela
      let unblockedTasks = [];
      const finalStatus = body.status || currentTask.status;
      if (finalStatus === 'concluida') {
        const dependents = await AcademicTask.find({
          user_id: req.user.id,
          blocked_by: id,
          status: 'bloqueada',
          is_deleted: false,
        });

        // Para cada dependente, verificar se TODAS as deps estão resolvidas
        const allUserTasks = await AcademicTask.find({
          user_id: req.user.id,
          is_deleted: false,
        });
        const plainTasks = allUserTasks.map(t => {
          const obj = t.toObject();
          // Incluir a tarefa recém-atualizada com seu novo status
          if (String(obj._id) === String(id)) obj.status = 'concluida';
          return obj;
        });

        for (const dep of dependents) {
          const resolved = statusEngine.areDependenciesResolved(dep.toObject(), plainTasks);
          if (resolved) {
            dep.status = 'pendente';
            dep.history.push({
              action: 'Auto-Desbloqueio',
              timestamp: new Date(),
              details: `Desbloqueada automaticamente após conclusão de "${currentTask.titulo}".`,
            });
            await dep.save();
            unblockedTasks.push({ id: dep._id, titulo: dep.titulo });
          }
        }

        // Regenerate analytics_report.json synchronously to ensure frontend gets updated data
        try {
          const { execSync } = require('child_process');
          const path = require('path');
          const scriptPath = path.resolve(__dirname, '../../../scripts/analytics_engine.py');
          execSync(`py -3 "${scriptPath}" --user-id ${req.user.id}`, { cwd: path.resolve(__dirname, '../../../') });
        } catch (execErr) {
          console.error('Falha ao rodar script Python após conclusão da tarefa:', execErr.message);
        }
      }

      const obj = mapTaskToResponse(updatedTask);
      obj.unblockedTasks = unblockedTasks;
      res.json(obj);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao atualizar tarefa', error: error.message });
    }
  },

  // POST /tasks/sync-statuses
  syncStatuses: async (req, res) => {
    try {
      const result = await statusEngine.syncAllStatuses(req.user.id);
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao sincronizar status', error: error.message });
    }
  },

  // PATCH /tasks/:id/soft-delete
  softDelete: async (req, res) => {
    try {
      const task = await AcademicTask.findOneAndUpdate(
        { _id: req.params.id, user_id: req.user.id },
        {
          $set: { is_deleted: true },
          $push: {
            history: {
              action: 'Exclusão',
              timestamp: new Date(),
              details: 'Tarefa movida para a lixeira.',
            },
          },
        },
        { new: true }
      );
      if (!task) return res.status(404).json({ message: 'Tarefa não encontrada' });

      // Remover a tarefa deletada dos arrays blocked_by de outras tarefas ativas
      await AcademicTask.updateMany(
        { user_id: req.user.id, blocked_by: task._id },
        { $pull: { blocked_by: task._id } }
      );

      // Sincronizar status para destrancar possíveis dependentes aguardando esta exclusão
      await statusEngine.syncAllStatuses(req.user.id);

      res.json({ message: 'Tarefa movida para a lixeira', id: task._id });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao deletar tarefa', error: error.message });
    }
  },

  // PATCH /tasks/:id/restore
  restore: async (req, res) => {
    try {
      const task = await AcademicTask.findOneAndUpdate(
        { _id: req.params.id, user_id: req.user.id },
        {
          $set: { is_deleted: false },
          $push: {
            history: {
              action: 'Recuperação',
              timestamp: new Date(),
              details: 'Tarefa recuperada da lixeira.',
            },
          },
        },
        { new: true }
      );
      if (!task) return res.status(404).json({ message: 'Tarefa não encontrada' });
      res.json({ message: 'Tarefa restaurada', id: task._id });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao restaurar tarefa', error: error.message });
    }
  },

  // DELETE /tasks/:id/permanent
  permanentlyDelete: async (req, res) => {
    try {
      const result = await AcademicTask.findOneAndDelete({ _id: req.params.id, user_id: req.user.id });
      if (!result) return res.status(404).json({ message: 'Tarefa não encontrada' });
      res.json({ message: 'Tarefa removida permanentemente' });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao remover tarefa', error: error.message });
    }
  },

  // PATCH /tasks/trash/restore-all
  restoreAll: async (req, res) => {
    try {
      const result = await AcademicTask.updateMany(
        { user_id: req.user.id, is_deleted: true },
        {
          $set: { is_deleted: false },
          $push: {
            history: {
              action: 'Recuperação',
              timestamp: new Date(),
              details: 'Tarefa recuperada via "Recuperar Tudo".',
            },
          },
        }
      );
      res.json({ message: 'Todas as tarefas restauradas', count: result.modifiedCount });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao restaurar tarefas', error: error.message });
    }
  },

  // DELETE /tasks/trash/empty
  emptyTrash: async (req, res) => {
    try {
      await AcademicTask.deleteMany({ user_id: req.user.id, is_deleted: true });
      res.json({ message: 'Lixeira esvaziada com sucesso' });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao esvaziar lixeira', error: error.message });
    }
  }
};

module.exports = taskController;
