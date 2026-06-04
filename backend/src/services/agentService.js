const { GoogleGenerativeAI, SchemaType } = require('@google/generative-ai');
const AcademicTask = require('../models/AcademicTask');
const Subject = require('../models/Subject');
const User = require('../models/User');
const statusEngine = require('./statusEngine');

// ─── Constantes ─────────────────────────────────────────────────────────────────
const MAX_AGENT_ITERATIONS = 5;
const MAX_HISTORY_LENGTH = 40; // ~20 turnos de conversa (user + model)

// ─── System Instruction ─────────────────────────────────────────────────────────
const SYSTEM_INSTRUCTION = `
Você é o Copiloto IA do EduTrack AI — um agente autônomo inteligente integrado à plataforma de gestão acadêmica.

## Suas Capacidades
Você tem acesso direto ao banco de dados do estudante através das suas ferramentas. Você pode:
- Consultar tarefas (pendentes, concluídas, atrasadas, etc.)
- Consultar disciplinas cadastradas
- Buscar tarefas específicas por nome
- Criar novas tarefas acadêmicas com todos os campos
- Alterar o status de tarefas existentes

## Regras Fundamentais
1. SEMPRE responda em português brasileiro (PT-BR).
2. Use SEMPRE as ferramentas disponíveis para consultar dados reais. NUNCA invente dados, IDs ou nomes de tarefas/disciplinas.
3. Seja conciso, organizado e motivacional no tom.
4. Ao listar informações, use formatação clara com markdown (listas, negrito, emojis de status).
5. Ao interpretar pedidos de criação de tarefas, extraia todos os parâmetros mencionados pelo estudante no texto.
6. Se faltar informação essencial (título ou disciplina) para criar uma tarefa, pergunte ao estudante antes de prosseguir.
7. Para campos opcionais não informados (peso, tempo_estimado, prioridade, tags, descrição), use valores padrão razoáveis sem perguntar.
8. Ao alterar status de uma tarefa mencionada por nome, primeiro use buscar_tarefa_por_nome para encontrar o ID correto.
9. Se o estudante usar referências ambíguas ("ela", "essa tarefa", "aquela matéria"), resolva usando o contexto das mensagens anteriores da conversa.
10. Após executar qualquer ação (criar/alterar), confirme com um resumo detalhado do que foi feito.
11. Quando o estudante perguntar algo genérico de estudos ou que não envolva dados do sistema, responda normalmente como um tutor educacional amigável.

## Referência de Valores do Sistema
- **Status válidos**: pendente, em_andamento, concluida, atrasada, bloqueada
- **Prioridade**: 1 (🔴 Urgente), 2 (🟠 Alta), 3 (🟡 Média), 4 (🔵 Baixa) — padrão: 4
- **Peso**: 1 a 10 (relevância da nota) — padrão: 1
- **Tempo estimado**: em minutos — padrão: 0

## Emojis de Status para Formatação
- pendente → ⏳
- em_andamento → 🔄
- concluida → ✅
- atrasada → 🔴
- bloqueada → 🔒
`.trim();

// ─── Function Declarations (Tool Definitions para o Gemini) ─────────────────────

const agentTools = [{
  functionDeclarations: [
    {
      name: 'listar_tarefas',
      description: 'Busca e lista as tarefas acadêmicas do estudante. Pode filtrar por status, período temporal, texto de busca, ou buscar tarefas concluídas na última semana. Se nenhum filtro for passado, retorna todas as tarefas ativas.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          status: {
            type: SchemaType.STRING,
            description: 'Filtrar por status específico da tarefa',
            enum: ['pendente', 'em_andamento', 'concluida', 'atrasada', 'bloqueada'],
          },
          busca_texto: {
            type: SchemaType.STRING,
            description: 'Texto para buscar no título das tarefas (busca parcial)',
          },
          periodo: {
            type: SchemaType.STRING,
            description: 'Filtrar tarefas por período temporal da data de entrega',
            enum: ['hoje', 'semana', 'mes'],
          },
          concluidas_na_semana: {
            type: SchemaType.BOOLEAN,
            description: 'Se true, busca especificamente tarefas concluídas nos últimos 7 dias (ignora outros filtros de status)',
          },
        },
      },
    },
    {
      name: 'listar_disciplinas',
      description: 'Lista todas as disciplinas/matérias cadastradas pelo estudante, retornando ID, nome, professor e carga horária.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {},
      },
    },
    {
      name: 'buscar_tarefa_por_nome',
      description: 'Busca tarefas pelo nome/título (busca parcial, case-insensitive). Útil para encontrar o ID de uma tarefa antes de alterar seu status.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          nome: {
            type: SchemaType.STRING,
            description: 'Nome ou parte do nome/título da tarefa a buscar',
          },
        },
        required: ['nome'],
      },
    },
    {
      name: 'criar_tarefa',
      description: 'Cria uma nova tarefa acadêmica completa no sistema. Requer ao mínimo o título e a disciplina (por ID ou por nome). Todos os outros campos são opcionais e possuem valores padrão.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          titulo: {
            type: SchemaType.STRING,
            description: 'Título/nome da atividade acadêmica',
          },
          subject_id: {
            type: SchemaType.STRING,
            description: 'ID da disciplina (obtido via listar_disciplinas). Use este OU subject_nome.',
          },
          subject_nome: {
            type: SchemaType.STRING,
            description: 'Nome da disciplina (alternativa ao subject_id — será resolvido automaticamente)',
          },
          descricao: {
            type: SchemaType.STRING,
            description: 'Descrição detalhada da tarefa',
          },
          data_prevista: {
            type: SchemaType.STRING,
            description: 'Data limite de entrega no formato YYYY-MM-DD',
          },
          peso: {
            type: SchemaType.NUMBER,
            description: 'Peso/ponderação da tarefa de 1 a 10 (relevância na nota). Padrão: 1',
          },
          tempo_estimado: {
            type: SchemaType.NUMBER,
            description: 'Tempo estimado de foco em minutos. Padrão: 0',
          },
          tags: {
            type: SchemaType.ARRAY,
            description: 'Etiquetas/tags de contexto para a tarefa',
            items: { type: SchemaType.STRING },
          },
          priority: {
            type: SchemaType.NUMBER,
            description: 'Prioridade: 1 (urgente), 2 (alta), 3 (média), 4 (baixa). Padrão: 4',
          },
        },
        required: ['titulo'],
      },
    },
    {
      name: 'atualizar_status_tarefa',
      description: 'Altera o status de uma tarefa existente. Pode identificar a tarefa por ID (task_id) ou por nome (task_nome). O novo status deve ser um dos valores válidos do sistema.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          task_id: {
            type: SchemaType.STRING,
            description: 'ID da tarefa (obtido via listar_tarefas ou buscar_tarefa_por_nome)',
          },
          task_nome: {
            type: SchemaType.STRING,
            description: 'Nome da tarefa para busca (alternativa ao task_id)',
          },
          novo_status: {
            type: SchemaType.STRING,
            description: 'Novo status desejado para a tarefa',
            enum: ['pendente', 'em_andamento', 'concluida', 'atrasada', 'bloqueada'],
          },
        },
        required: ['novo_status'],
      },
    },
  ],
}];

// ─── Singleton do Modelo Agente ─────────────────────────────────────────────────

let agentModel = null;

function getAgentModel() {
  if (agentModel) return agentModel;

  const apiKey = process.env.GOOGLE_AI_STUDIO_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_AI_STUDIO_KEY não configurada no .env');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  agentModel = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    tools: agentTools,
    systemInstruction: SYSTEM_INSTRUCTION,
  });

  return agentModel;
}

// ═══════════════════════════════════════════════════════════════════════════════
//  FUNCTION HANDLERS — Executores das ferramentas do agente
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Converte data_prevista de string YYYY-MM-DD para Date.
 * (Reutiliza a mesma lógica do taskController)
 */
function parseDateField(value) {
  if (!value) return value;
  if (value instanceof Date) return value;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(value + 'T23:59:59.999Z');
  }
  return new Date(value);
}

// ─── listar_tarefas ─────────────────────────────────────────────────────────────
async function handleListarTarefas(userId, args) {
  const { status, busca_texto, periodo, concluidas_na_semana } = args || {};

  const query = { user_id: userId, is_deleted: false };

  // Filtro: concluídas na última semana (tem precedência)
  if (concluidas_na_semana) {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    query.status = 'concluida';
    query.completed_at = { $gte: weekAgo };
  } else {
    // Filtro por status
    if (status) {
      query.status = status;
    }

    // Filtro por período temporal
    if (periodo) {
      const now = new Date();
      if (periodo === 'hoje') {
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
        query.data_prevista = { $gte: startOfDay, $lt: endOfDay };
      } else if (periodo === 'semana') {
        const endOfWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        query.data_prevista = { $lte: endOfWeek };
      } else if (periodo === 'mes') {
        const endOfMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        query.data_prevista = { $lte: endOfMonth };
      }
    }
  }

  // Filtro por texto no título
  if (busca_texto) {
    query.titulo = { $regex: busca_texto, $options: 'i' };
  }

  const tasks = await AcademicTask.find(query)
    .populate('subject_id', 'nome')
    .sort({ data_prevista: 1 })
    .limit(50);

  // Computar status efetivo (detecção de atraso em tempo de leitura)
  const allUserTasks = await AcademicTask.find({ user_id: userId, is_deleted: false });
  const plainAll = allUserTasks.map(t => t.toObject());

  const tarefas = tasks.map(t => {
    const obj = t.toObject();
    const effectiveStatus = statusEngine.computeEffectiveStatus(obj, plainAll);
    return {
      id: obj._id.toString(),
      titulo: obj.titulo,
      status: effectiveStatus,
      prioridade: obj.priority,
      data_prevista: obj.data_prevista ? obj.data_prevista.toISOString().split('T')[0] : null,
      disciplina: obj.subject_id?.nome || 'Sem disciplina',
      peso: obj.peso,
      tempo_estimado: obj.tempo_estimado,
      tempo_real: obj.tempo_real,
      tags: obj.tags || [],
      completed_at: obj.completed_at ? obj.completed_at.toISOString().split('T')[0] : null,
    };
  });

  return { total: tarefas.length, tarefas };
}

// ─── listar_disciplinas ─────────────────────────────────────────────────────────
async function handleListarDisciplinas(userId) {
  const subjects = await Subject.find({ user_id: userId }).sort({ createdAt: -1 });

  return {
    total: subjects.length,
    disciplinas: subjects.map(s => ({
      id: s._id.toString(),
      nome: s.nome,
      professor: s.professor || 'Não informado',
      carga_horaria: s.carga_horaria || 0,
      descricao: s.descricao || '',
    })),
  };
}

// ─── buscar_tarefa_por_nome ─────────────────────────────────────────────────────
async function handleBuscarTarefaPorNome(userId, args) {
  const { nome } = args || {};
  if (!nome) return { error: 'O parâmetro "nome" é obrigatório.' };

  // Escapar caracteres especiais de regex para busca segura
  const escapedNome = nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const tasks = await AcademicTask.find({
    user_id: userId,
    is_deleted: false,
    titulo: { $regex: escapedNome, $options: 'i' },
  })
    .populate('subject_id', 'nome')
    .limit(10);

  if (tasks.length === 0) {
    return { total: 0, tarefas: [], mensagem: `Nenhuma tarefa encontrada com o nome "${nome}".` };
  }

  return {
    total: tasks.length,
    tarefas: tasks.map(t => ({
      id: t._id.toString(),
      titulo: t.titulo,
      status: t.status,
      prioridade: t.priority,
      data_prevista: t.data_prevista ? t.data_prevista.toISOString().split('T')[0] : null,
      disciplina: t.subject_id?.nome || 'Sem disciplina',
      peso: t.peso,
      tempo_estimado: t.tempo_estimado,
    })),
  };
}

// ─── criar_tarefa ───────────────────────────────────────────────────────────────
async function handleCriarTarefa(userId, args) {
  const {
    titulo,
    subject_id,
    subject_nome,
    descricao,
    data_prevista,
    peso,
    tempo_estimado,
    tags,
    priority,
  } = args || {};

  if (!titulo) {
    return { error: 'O título da tarefa é obrigatório.' };
  }

  // Resolver disciplina: por ID ou por nome
  let resolvedSubjectId = subject_id;
  if (!resolvedSubjectId && subject_nome) {
    const escapedName = subject_nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const subject = await Subject.findOne({
      user_id: userId,
      nome: { $regex: new RegExp(escapedName, 'i') },
    });
    if (!subject) {
      return {
        error: `Disciplina "${subject_nome}" não encontrada no perfil do estudante. Use a ferramenta listar_disciplinas para ver as disciplinas disponíveis.`,
      };
    }
    resolvedSubjectId = subject._id.toString();
  }

  if (!resolvedSubjectId) {
    return {
      error: 'É necessário informar a disciplina (subject_id ou subject_nome) para criar uma tarefa. Use listar_disciplinas para obter as opções.',
    };
  }

  // Parse data_prevista
  const parsedDate = parseDateField(data_prevista);

  // Determinar status inicial
  let initialStatus = 'pendente';
  if (parsedDate && parsedDate < new Date()) {
    initialStatus = 'atrasada';
  }

  // Criar documento
  const newTask = new AcademicTask({
    titulo,
    subject_id: resolvedSubjectId,
    user_id: userId,
    descricao: descricao || '',
    data_prevista: parsedDate || null,
    status: initialStatus,
    priority: priority || 4,
    peso: peso || 1,
    tempo_estimado: tempo_estimado || 0,
    tempo_real: 0,
    tags: tags || [],
    history: [{
      action: 'Criação',
      timestamp: new Date(),
      details: `Tarefa "${titulo}" criada pelo Copiloto IA com status "${initialStatus}".`,
    }],
  });

  await newTask.save();

  // Popolar nome da disciplina para a resposta
  const populated = await AcademicTask.findById(newTask._id).populate('subject_id', 'nome');

  return {
    sucesso: true,
    tarefa: {
      id: newTask._id.toString(),
      titulo: newTask.titulo,
      status: newTask.status,
      disciplina: populated?.subject_id?.nome || 'N/A',
      data_prevista: parsedDate ? parsedDate.toISOString().split('T')[0] : null,
      peso: newTask.peso,
      tempo_estimado: newTask.tempo_estimado,
      prioridade: newTask.priority,
      tags: newTask.tags,
      descricao: newTask.descricao ? 'Sim' : 'Não',
    },
  };
}

// ─── atualizar_status_tarefa ────────────────────────────────────────────────────
async function handleAtualizarStatusTarefa(userId, args) {
  const { task_id, task_nome, novo_status } = args || {};

  if (!novo_status) {
    return { error: 'O parâmetro "novo_status" é obrigatório.' };
  }

  // Encontrar a tarefa por ID ou por nome
  let task;
  if (task_id) {
    try {
      task = await AcademicTask.findOne({ _id: task_id, user_id: userId, is_deleted: false });
    } catch {
      return { error: `ID inválido: "${task_id}".` };
    }
  } else if (task_nome) {
    const escapedName = task_nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    task = await AcademicTask.findOne({
      user_id: userId,
      is_deleted: false,
      titulo: { $regex: new RegExp(escapedName, 'i') },
    });
  }

  if (!task) {
    const identifier = task_id || task_nome || '(não informado)';
    return { error: `Tarefa "${identifier}" não encontrada. Use buscar_tarefa_por_nome ou listar_tarefas para localizar.` };
  }

  // Validar transição de status
  const transition = statusEngine.validateTransition(task.status, novo_status);
  if (!transition.valid) {
    return {
      error: `Transição inválida: "${task.status}" → "${novo_status}". ${transition.reason}`,
      status_atual: task.status,
    };
  }

  const oldStatus = task.status;

  // Gerenciar sessão de foco
  if (task.status === 'em_andamento') {
    const user = await User.findById(userId);
    const limitHours = user?.settings?.timer_limit_hours ?? 4;
    task.closeSession(limitHours);
  }

  if (novo_status === 'em_andamento') {
    task.startSession();
  }

  // Registrar timestamps de conclusão
  if (novo_status === 'concluida') {
    task.completed_at = new Date();
  } else if (task.status === 'concluida') {
    task.completed_at = null;
  }

  task.status = novo_status;

  // Adicionar entrada ao histórico
  const actionLabel = novo_status === 'concluida' ? 'Conclusão' : 'Alteração de Status';
  task.history.push({
    action: actionLabel,
    timestamp: new Date(),
    details: `Status alterado de "${oldStatus}" para "${novo_status}" pelo Copiloto IA.`,
  });

  await task.save();

  // ═══ Efeito Cascata de Desbloqueio (se concluída) ═══
  let unblockedTasks = [];
  if (novo_status === 'concluida') {
    const dependents = await AcademicTask.find({
      user_id: userId,
      blocked_by: task._id,
      status: 'bloqueada',
      is_deleted: false,
    });

    if (dependents.length > 0) {
      const allTasks = await AcademicTask.find({ user_id: userId, is_deleted: false });
      const plainTasks = allTasks.map(t => {
        const obj = t.toObject();
        if (String(obj._id) === String(task._id)) obj.status = 'concluida';
        return obj;
      });

      for (const dep of dependents) {
        const resolved = statusEngine.areDependenciesResolved(dep.toObject(), plainTasks);
        if (resolved) {
          dep.status = 'pendente';
          dep.history.push({
            action: 'Auto-Desbloqueio',
            timestamp: new Date(),
            details: `Desbloqueada automaticamente após conclusão de "${task.titulo}" (via Copiloto IA).`,
          });
          await dep.save();
          unblockedTasks.push({ id: dep._id.toString(), titulo: dep.titulo });
        }
      }
    }
  }

  return {
    sucesso: true,
    tarefa: {
      id: task._id.toString(),
      titulo: task.titulo,
      status_anterior: oldStatus,
      status_novo: novo_status,
    },
    tarefas_desbloqueadas: unblockedTasks,
  };
}

// ─── Mapa de Handlers ───────────────────────────────────────────────────────────
const functionHandlers = {
  listar_tarefas: handleListarTarefas,
  listar_disciplinas: handleListarDisciplinas,
  buscar_tarefa_por_nome: handleBuscarTarefaPorNome,
  criar_tarefa: handleCriarTarefa,
  atualizar_status_tarefa: handleAtualizarStatusTarefa,
};

// ═══════════════════════════════════════════════════════════════════════════════
//  AGENT LOOP — Processa mensagem do usuário com ciclo de Function Calling
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Processa uma mensagem do estudante no contexto do agente autônomo.
 *
 * @param {string} userId - ID do usuário autenticado (do JWT)
 * @param {string} message - Mensagem livre do estudante
 * @param {Array}  history - Histórico de conversa no formato Gemini [{role, parts}]
 * @returns {Object} { response: string, executedActions: Array }
 */
async function processAgentMessage(userId, message, history = []) {
  const model = getAgentModel();

  // Trimmar histórico para manter dentro do limite de tokens
  let trimmedHistory = history.slice(-MAX_HISTORY_LENGTH);
  // Gemini exige que o histórico comece com 'user'
  while (trimmedHistory.length > 0 && trimmedHistory[0].role !== 'user') {
    trimmedHistory = trimmedHistory.slice(1);
  }

  // Iniciar chat com histórico
  const chat = model.startChat({ history: trimmedHistory });

  // Enviar a mensagem do usuário
  let result = await chat.sendMessage(message);
  let response = result.response;

  const executedActions = [];

  // Loop do agente: processar chamadas de função iterativamente
  for (let iteration = 0; iteration < MAX_AGENT_ITERATIONS; iteration++) {
    const calls = response.functionCalls();
    if (!calls || calls.length === 0) break;

    // Executar todas as chamadas de função retornadas
    const functionResponses = [];

    for (const call of calls) {
      const handler = functionHandlers[call.name];

      if (!handler) {
        console.warn(`[AgentService] Função desconhecida: ${call.name}`);
        functionResponses.push({
          functionResponse: {
            name: call.name,
            response: { error: `Função "${call.name}" não está disponível.` },
          },
        });
        continue;
      }

      try {
        console.log(`[AgentService] Executando: ${call.name}(${JSON.stringify(call.args)})`);
        const fnResult = await handler(userId, call.args || {});
        executedActions.push({ type: call.name, data: fnResult });
        functionResponses.push({
          functionResponse: {
            name: call.name,
            response: fnResult,
          },
        });
      } catch (err) {
        console.error(`[AgentService] Erro em ${call.name}:`, err.message);
        functionResponses.push({
          functionResponse: {
            name: call.name,
            response: { error: `Erro ao executar ${call.name}: ${err.message}` },
          },
        });
      }
    }

    // Enviar os resultados das funções de volta para o modelo
    result = await chat.sendMessage(functionResponses);
    response = result.response;
  }

  // Extrair texto final da resposta
  const text = response.text();

  return { response: text, executedActions };
}

module.exports = { processAgentMessage };
