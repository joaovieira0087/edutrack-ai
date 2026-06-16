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
- Consultar e pesquisar tarefas acadêmicas.
- Criar tarefas acadêmicas com todos os campos.
- Atualizar qualquer campo de uma tarefa existente (título, descrição, prazo, peso, status, tags, prioridade, tempo estimado).
- Excluir tarefas do sistema (movendo para a lixeira/soft delete ou exclusão física permanente se solicitado).
- Consultar disciplinas cadastradas.
- Criar novas disciplinas diretamente ou inline.
- Atualizar dados de disciplinas existentes.
- Excluir disciplinas e todas as suas tarefas associadas.
- Consultar e atualizar configurações de perfil (limite do timer, meta de estudos, e-mails).
- Analisar de forma aprofundada o histórico de produtividade (taxas de conclusão, desvios estimados/reais, gargalos).

## Regras Fundamentais
1. SEMPRE responda em português brasileiro (PT-BR).
2. Use SEMPRE as ferramentas disponíveis para consultar dados reais. NUNCA invente dados, IDs ou nomes de tarefas/disciplinas.
3. Seja conciso, organizado e motivacional no tom.
4. Ao listar informações, use formatação clara com markdown (listas, negrito, emojis de status).
5. Se o estudante usar referências ambíguas ("ela", "essa tarefa", "aquela matéria", "esta tarefa"), resolva usando o contexto das mensagens anteriores da conversa (Memória de Curto Prazo). Sempre procure identificar qual é a última tarefa citada.
6. Ao alterar status ou propriedades de uma tarefa mencionada por nome, primeiro use buscar_tarefa_por_nome para encontrar o ID correto se necessário.
7. Quando o estudante perguntar algo genérico de estudos ou que não envolva dados do sistema, responda normalmente como um tutor educacional amigável.
8. Quando o estudante fizer upload de um arquivo, você receberá uma mensagem automática no formato \`[Upload de Arquivo: {"file_name": "...", "file_url": "...", "file_type": "..."}]\`. Confirme o recebimento e armazene este arquivo em memória para incluí-lo na chamada de criar_tarefa no fim da entrevista.

## Regra de Criação Inline de Disciplinas (Muito Importante!)
Se o estudante iniciar o fluxo de criação de uma tarefa e você detectar que não há nenhuma disciplina cadastrada, ou se ele informar/digitar o nome de uma disciplina que não existe no perfil dele, você deve:
- Criar a disciplina de forma inline e silenciosa no backend usando a ferramenta \`criar_disciplina\`.
- Continuar normalmente com o fluxo de entrevista e coleta de dados da tarefa, informando o estudante de forma amigável que a matéria foi criada automaticamente no perfil dele.

## Roteiro de Entrevista Obrigatório de Ponta a Ponta (Slot Filling)
Fica expressamente determinado que você NÃO pode criar ou salvar uma tarefa de forma precoce ou utilizar valores padrões automatizados sem antes coletar ativamente todos os dados com o usuário através de um fluxo de entrevista dinâmico passo a passo. A próxima pergunta só é disparada após a validação e captura do dado anterior.
Siga rigorosamente a ordem sequencial abaixo para a criação de atividades:

1. **Título da Atividade:** Capture o nome ou título da tarefa (se o usuário já iniciou informando, avance para o passo 2).
2. **Disciplina Relacionada:** Chame imediatamente a ferramenta \`listar_disciplinas\` de forma silenciosa para obter as matérias cadastradas pelo usuário. Em seguida, oriente o usuário a escolher/clicar em uma das disciplinas listadas (o frontend exibirá as opções em formato de botões/chips interativos). Aguarde a resposta. Se a disciplina digitada pelo usuário não existir nas cadastradas, chame a ferramenta \`criar_disciplina\` para criá-la na hora e use o ID dela.
3. **Data Inicial e Data Final (Prazo/Deadline):** Solicite explicitamente as datas de planejamento (data inicial) e de entrega final (data de vencimento/deadline). O usuário pode informar em texto livre (ex: "hoje", "amanhã", "próxima segunda") ou data formal. Traduza internamente para o formato YYYY-MM-DD usando a data/hora local atual do estudante. (Salve a data de entrega final em data_prevista. E registre a data de planejamento na descrição).
4. **Descrição da Atividade (Roteiro em Markdown):** Com base no título e disciplina coletados, utilize sua capacidade gerativa para redigir uma proposta de descrição rica, detalhada e formatada em Markdown (um roteiro de estudos sugerido). Pergunte formalmente: *"Gostaria de aprovar este roteiro descritivo que montei para você ou deseja complementar com algo mais?"*. Aguarde e capture o feedback ou aprovação.
5. **Peso/Ponderação:** Pergunte ao estudante o valor da nota da atividade na escala de 1 a 10 para o motor de cálculo do progresso.
6. **Tempo Estimado de Foco (Com Inteligência Preditiva):**
   - Antes de sugerir ou perguntar o tempo estimado para a atividade, chame silenciosamente a ferramenta \`analisar_historico_produtividade\`.
   - Analise se a disciplina selecionada para esta tarefa possui um histórico de desvio no tempo de execução (\`desvio\` positivo maior que 20% nas métricas por disciplina).
   - Se houver desvio histórico relevante (o estudante costuma demorar mais do que o planejado nessa matéria), faça uma sugestão calibrada amigavelmente. Por exemplo: "Notei que nas atividades de [Nome da Disciplina] você costuma levar cerca de 30% a mais do que o estimado. O que acha de planejarmos 80 minutos em vez de 60 para termos uma margem mais realista?".
   - Caso não haja desvio relevante, pergunte normalmente quantos minutos o estudante planeja passar executando ativamente aquela atividade (ex: 30, 60, 90 minutos) para calibrar o cronômetro.
7. **Etiquetas (Tags):** Peça as palavras-chave de contexto para categorização taxonômica da atividade.
8. **Arquivos e Anexos:** Pergunte se o usuário possui documentos de suporte para carregar via chat (PDFs, imagens, documentos acadêmicos). Se o usuário fizer upload (você receberá a mensagem \`[Upload de Arquivo: ...]\`), adicione-o.

*SOMENTE após a coleta, validação e confirmação de todos esses 8 slots de dados, chame a ferramenta \`criar_tarefa\` para fazer a gravação definitiva no banco.*

## Referência de Valores do Sistema
- **Status válidos**: pendente, em_andamento, concluida, atrasada, bloqueada
- **Prioridade**: 1 (🔴 Urgente), 2 (🟠 Alta), 3 (🟡 Média), 4 (🔵 Baixa) — padrão: 4
- **Peso**: 1 a 10 (relevância da nota)
- **Tempo estimado**: em minutos

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
          attachments: {
            type: SchemaType.ARRAY,
            description: 'Lista de arquivos anexados à tarefa pelo estudante durante o chat',
            items: {
              type: SchemaType.OBJECT,
              properties: {
                file_name: {
                  type: SchemaType.STRING,
                  description: 'Nome original do arquivo',
                },
                file_url: {
                  type: SchemaType.STRING,
                  description: 'URL de acesso ao arquivo',
                },
                file_type: {
                  type: SchemaType.STRING,
                  description: 'Tipo MIME do arquivo (ex: application/pdf)',
                },
              },
              required: ['file_name', 'file_url'],
            },
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
    {
      name: 'excluir_tarefa',
      description: 'Exclui uma tarefa do sistema. Por padrão faz soft delete, mas pode fazer exclusão física se permanente for true.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          task_id: {
            type: SchemaType.STRING,
            description: 'ID da tarefa a ser excluída',
          },
          task_nome: {
            type: SchemaType.STRING,
            description: 'Nome da tarefa a ser excluída (alternativa ao task_id)',
          },
          permanente: {
            type: SchemaType.BOOLEAN,
            description: 'Se true, realiza a exclusão física e permanente no banco de dados',
          },
        },
      },
    },
    {
      name: 'criar_disciplina',
      description: 'Cria uma nova disciplina no perfil do estudante.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          nome: {
            type: SchemaType.STRING,
            description: 'Nome da disciplina/matéria (ex: Álgebra Linear)',
          },
          professor: {
            type: SchemaType.STRING,
            description: 'Nome do professor ministrando a disciplina',
          },
          carga_horaria: {
            type: SchemaType.NUMBER,
            description: 'Carga horária total da disciplina em horas',
          },
          descricao: {
            type: SchemaType.STRING,
            description: 'Breve descrição da disciplina',
          },
          data_inicio: {
            type: SchemaType.STRING,
            description: 'Data de início no formato YYYY-MM-DD',
          },
          data_fim: {
            type: SchemaType.STRING,
            description: 'Data de término no formato YYYY-MM-DD',
          },
        },
        required: ['nome'],
      },
    },
    {
      name: 'atualizar_disciplina',
      description: 'Atualiza os dados de uma disciplina existente.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          disciplina_id: {
            type: SchemaType.STRING,
            description: 'ID da disciplina a ser atualizada',
          },
          disciplina_nome: {
            type: SchemaType.STRING,
            description: 'Nome da disciplina a ser atualizada (alternativa ao disciplina_id)',
          },
          nome: {
            type: SchemaType.STRING,
            description: 'Novo nome para a disciplina',
          },
          professor: {
            type: SchemaType.STRING,
            description: 'Novo nome do professor',
          },
          carga_horaria: {
            type: SchemaType.NUMBER,
            description: 'Nova carga horária total em horas',
          },
          descricao: {
            type: SchemaType.STRING,
            description: 'Nova descrição para a disciplina',
          },
          data_inicio: {
            type: SchemaType.STRING,
            description: 'Nova data de início no formato YYYY-MM-DD',
          },
          data_fim: {
            type: SchemaType.STRING,
            description: 'Nova data de término no formato YYYY-MM-DD',
          },
        },
      },
    },
    {
      name: 'excluir_disciplina',
      description: 'Exclui permanentemente uma disciplina e todas as tarefas associadas a ela.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          disciplina_id: {
            type: SchemaType.STRING,
            description: 'ID da disciplina a ser excluída',
          },
          disciplina_nome: {
            type: SchemaType.STRING,
            description: 'Nome da disciplina a ser excluída (alternativa ao disciplina_id)',
          },
        },
      },
    },
    {
      name: 'atualizar_tarefa',
      description: 'Atualiza qualquer campo de uma tarefa existente.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          task_id: {
            type: SchemaType.STRING,
            description: 'ID da tarefa a ser atualizada',
          },
          task_nome: {
            type: SchemaType.STRING,
            description: 'Nome da tarefa a ser atualizada (alternativa ao task_id)',
          },
          titulo: {
            type: SchemaType.STRING,
            description: 'Novo título para a tarefa',
          },
          descricao: {
            type: SchemaType.STRING,
            description: 'Nova descrição para a tarefa',
          },
          data_prevista: {
            type: SchemaType.STRING,
            description: 'Nova data limite no formato YYYY-MM-DD',
          },
          status: {
            type: SchemaType.STRING,
            description: 'Novo status da tarefa',
            enum: ['pendente', 'em_andamento', 'concluida', 'atrasada', 'bloqueada'],
          },
          priority: {
            type: SchemaType.NUMBER,
            description: 'Prioridade: 1 (urgente), 2 (alta), 3 (média), 4 (baixa)',
          },
          peso: {
            type: SchemaType.NUMBER,
            description: 'Novo peso de 1 a 10',
          },
          tempo_estimado: {
            type: SchemaType.NUMBER,
            description: 'Novo tempo estimado de foco em minutos',
          },
          tempo_real: {
            type: SchemaType.NUMBER,
            description: 'Novo tempo real de foco em minutos',
          },
          tags: {
            type: SchemaType.ARRAY,
            description: 'Nova lista de tags/etiquetas de contexto',
            items: { type: SchemaType.STRING },
          },
        },
      },
    },
    {
      name: 'obter_configuracoes_perfil',
      description: 'Obtém as configurações de perfil do estudante (timer, meta de estudos, e-mails).',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {},
      },
    },
    {
      name: 'atualizar_configuracoes_perfil',
      description: 'Atualiza as configurações de perfil do estudante.',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {
          timer_limit_hours: {
            type: SchemaType.NUMBER,
            description: 'Limite do timer de foco em horas',
          },
          weekly_study_goal_hours: {
            type: SchemaType.NUMBER,
            description: 'Meta de estudos semanal em horas',
          },
          email_deadlines: {
            type: SchemaType.BOOLEAN,
            description: 'Habilitar/desabilitar notificações de prazos por e-mail',
          },
          email_weekly_summary: {
            type: SchemaType.BOOLEAN,
            description: 'Habilitar/desabilitar resumo de estudos semanal por e-mail',
          },
        },
      },
    },
    {
      name: 'analisar_historico_produtividade',
      description: 'Gera uma análise completa de produtividade acadêmica do aluno (taxas, desvios e gargalos).',
      parameters: {
        type: SchemaType.OBJECT,
        properties: {},
      },
    },
  ],
}];

// ─── Singleton do Modelo Agente ─────────────────────────────────────────────────

function getAgentModel(userDateTimeStr, modelName = 'gemini-2.5-flash') {
  const apiKey = process.env.GOOGLE_AI_STUDIO_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_AI_STUDIO_KEY não configurada no .env');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  
  let instruction = SYSTEM_INSTRUCTION;
  if (userDateTimeStr) {
    try {
      const userDate = new Date(userDateTimeStr);
      const formattedDate = userDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      instruction = `${SYSTEM_INSTRUCTION}\n\n[CONVENÇÃO DE CONTEXTO ATUAL]\nData e hora local do estudante: ${formattedDate} (use esta data como referência para prazos relativos como "amanhã", "segunda-feira", etc.)`;
    } catch (err) {
      console.error('[AgentService] Erro ao parsear userDateTime:', err);
    }
  }

  return genAI.getGenerativeModel({
    model: modelName,
    tools: agentTools,
    systemInstruction: instruction,
  }, {
    timeout: 30000
  });
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
    attachments,
  } = args || {};

  if (!titulo) {
    return { error: 'O título da tarefa é obrigatório.' };
  }

  // Resolver disciplina: por ID ou por nome com criação inline automática
  let resolvedSubjectId = subject_id;
  if (!resolvedSubjectId && subject_nome) {
    const escapedName = subject_nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    let subject = await Subject.findOne({
      user_id: userId,
      nome: { $regex: new RegExp(`^${escapedName}$`, 'i') },
    });
    
    // Se não encontrou, criar inline!
    if (!subject) {
      subject = new Subject({
        nome: subject_nome,
        user_id: userId,
        descricao: 'Criada de forma inline pelo Copiloto IA durante o cadastro de tarefa.',
      });
      await subject.save();
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
    attachments: attachments || [],
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

// ─── excluir_tarefa ─────────────────────────────────────────────────────────────
async function handleExcluirTarefa(userId, args) {
  const { task_id, task_nome, permanente } = args || {};

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
    return { error: `Tarefa "${identifier}" não encontrada. Use buscar_tarefa_por_nome ou listar_tarefas para localizar antes de excluir.` };
  }

  let unblockedTasks = [];

  if (permanente) {
    // Para exclusão física permanente, primeiro limpe dependências
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
        if (String(obj._id) === String(task._id)) obj.is_deleted = true;
        return obj;
      });

      for (const dep of dependents) {
        const resolved = statusEngine.areDependenciesResolved(dep.toObject(), plainTasks);
        if (resolved) {
          dep.status = 'pendente';
          dep.history.push({
            action: 'Auto-Desbloqueio',
            timestamp: new Date(),
            details: `Desbloqueada automaticamente após exclusão permanente de "${task.titulo}" (via Copiloto IA).`,
          });
          await dep.save();
          unblockedTasks.push({ id: dep._id.toString(), titulo: dep.titulo });
        }
      }
    }

    await AcademicTask.deleteOne({ _id: task._id });

    return {
      sucesso: true,
      tarefa: {
        id: task._id.toString(),
        titulo: task.titulo,
        status: 'excluida_permanentemente',
      },
      tarefas_desbloqueadas: unblockedTasks,
    };
  }

  // Soft delete padrão
  task.is_deleted = true;
  task.history.push({
    action: 'Exclusão',
    timestamp: new Date(),
    details: 'Tarefa movida para a lixeira pelo Copiloto IA.',
  });
  
  // Limpar dependências
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
      if (String(obj._id) === String(task._id)) obj.is_deleted = true;
      return obj;
    });

    for (const dep of dependents) {
      const resolved = statusEngine.areDependenciesResolved(dep.toObject(), plainTasks);
      if (resolved) {
        dep.status = 'pendente';
        dep.history.push({
          action: 'Auto-Desbloqueio',
          timestamp: new Date(),
          details: `Desbloqueada automaticamente após exclusão de "${task.titulo}" (via Copiloto IA).`,
        });
        await dep.save();
        unblockedTasks.push({ id: dep._id.toString(), titulo: dep.titulo });
      }
    }
  }

  await task.save();

  return {
    sucesso: true,
    tarefa: {
      id: task._id.toString(),
      titulo: task.titulo,
      status: 'excluida',
    },
    tarefas_desbloqueadas: unblockedTasks,
  };
}

// ─── criar_disciplina ───────────────────────────────────────────────────────────
async function handleCriarDisciplina(userId, args) {
  const { nome, professor, carga_horaria, descricao, data_inicio, data_fim } = args || {};

  if (!nome) {
    return { error: 'O nome da disciplina é obrigatório.' };
  }

  const newSubject = new Subject({
    nome,
    professor: professor || '',
    carga_horaria: carga_horaria || 0,
    descricao: descricao || '',
    data_inicio: data_inicio || '',
    data_fim: data_fim || '',
    user_id: userId,
  });

  await newSubject.save();

  return {
    sucesso: true,
    disciplina: {
      id: newSubject._id.toString(),
      nome: newSubject.nome,
      professor: newSubject.professor,
      carga_horaria: newSubject.carga_horaria,
      descricao: newSubject.descricao,
      data_inicio: newSubject.data_inicio,
      data_fim: newSubject.data_fim,
    },
  };
}

// ─── atualizar_disciplina ───────────────────────────────────────────────────────
async function handleAtualizarDisciplina(userId, args) {
  const {
    disciplina_id,
    disciplina_nome,
    nome,
    professor,
    carga_horaria,
    descricao,
    data_inicio,
    data_fim,
  } = args || {};

  let subject;
  if (disciplina_id) {
    try {
      subject = await Subject.findOne({ _id: disciplina_id, user_id: userId });
    } catch {
      return { error: `ID de disciplina inválido: "${disciplina_id}".` };
    }
  } else if (disciplina_nome) {
    const escapedName = disciplina_nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    subject = await Subject.findOne({
      user_id: userId,
      nome: { $regex: new RegExp(escapedName, 'i') },
    });
  }

  if (!subject) {
    const identifier = disciplina_id || disciplina_nome || '(não informado)';
    return { error: `Disciplina "${identifier}" não encontrada.` };
  }

  if (nome !== undefined) subject.nome = nome;
  if (professor !== undefined) subject.professor = professor;
  if (carga_horaria !== undefined) subject.carga_horaria = carga_horaria;
  if (descricao !== undefined) subject.descricao = descricao;
  if (data_inicio !== undefined) subject.data_inicio = data_inicio;
  if (data_fim !== undefined) subject.data_fim = data_fim;

  await subject.save();

  return {
    sucesso: true,
    disciplina: {
      id: subject._id.toString(),
      nome: subject.nome,
      professor: subject.professor,
      carga_horaria: subject.carga_horaria,
      descricao: subject.descricao,
      data_inicio: subject.data_inicio,
      data_fim: subject.data_fim,
    },
  };
}

// ─── excluir_disciplina ─────────────────────────────────────────────────────────
async function handleExcluirDisciplina(userId, args) {
  const { disciplina_id, disciplina_nome } = args || {};

  let subject;
  if (disciplina_id) {
    try {
      subject = await Subject.findOne({ _id: disciplina_id, user_id: userId });
    } catch {
      return { error: `ID de disciplina inválido: "${disciplina_id}".` };
    }
  } else if (disciplina_nome) {
    const escapedName = disciplina_nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    subject = await Subject.findOne({
      user_id: userId,
      nome: { $regex: new RegExp(escapedName, 'i') },
    });
  }

  if (!subject) {
    const identifier = disciplina_id || disciplina_nome || '(não informado)';
    return { error: `Disciplina "${identifier}" não encontrada.` };
  }

  // Remoção física em cascata de todas as tarefas da disciplina
  const deletedTasks = await AcademicTask.deleteMany({ subject_id: subject._id, user_id: userId });
  await Subject.deleteOne({ _id: subject._id });

  return {
    sucesso: true,
    mensagem: `Disciplina "${subject.nome}" e suas ${deletedTasks.deletedCount || 0} tarefas associadas foram excluídas permanentemente com sucesso.`,
  };
}

// ─── atualizar_tarefa ───────────────────────────────────────────────────────────
async function handleAtualizarTarefa(userId, args) {
  const {
    task_id,
    task_nome,
    titulo,
    descricao,
    data_prevista,
    status,
    priority,
    peso,
    tempo_estimado,
    tempo_real,
    tags,
  } = args || {};

  let task;
  if (task_id) {
    try {
      task = await AcademicTask.findOne({ _id: task_id, user_id: userId, is_deleted: false });
    } catch {
      return { error: `ID de tarefa inválido: "${task_id}".` };
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
    return { error: `Tarefa "${identifier}" não encontrada.` };
  }

  let oldStatus = task.status;
  let statusChanged = status !== undefined && status !== oldStatus;
  let unblockedTasks = [];

  // Se o status estiver sendo alterado, validar a transição
  if (statusChanged) {
    const transition = statusEngine.validateTransition(task.status, status);
    if (!transition.valid) {
      return {
        error: `Transição inválida: "${task.status}" → "${status}". ${transition.reason}`,
        status_atual: task.status,
      };
    }

    // Gerenciar sessão de foco
    if (task.status === 'em_andamento') {
      const user = await User.findById(userId);
      const limitHours = user?.settings?.timer_limit_hours ?? 4;
      task.closeSession(limitHours);
    }

    if (status === 'em_andamento') {
      task.startSession();
    }

    // Registrar timestamps de conclusão
    if (status === 'concluida') {
      task.completed_at = new Date();
    } else if (task.status === 'concluida') {
      task.completed_at = null;
    }

    task.status = status;
    task.history.push({
      action: status === 'concluida' ? 'Conclusão' : 'Alteração de Status',
      timestamp: new Date(),
      details: `Status alterado de "${oldStatus}" para "${status}" pelo Copiloto IA (atualizar_tarefa).`,
    });
  }

  // Atualizar outros campos se fornecidos
  if (titulo !== undefined) task.titulo = titulo;
  if (descricao !== undefined) task.descricao = descricao;
  if (data_prevista !== undefined) task.data_prevista = parseDateField(data_prevista);
  if (priority !== undefined) task.priority = priority;
  if (peso !== undefined) task.peso = peso;
  if (tempo_estimado !== undefined) task.tempo_estimado = tempo_estimado;
  if (tempo_real !== undefined) task.tempo_real = tempo_real;
  if (tags !== undefined) task.tags = tags;

  task.history.push({
    action: 'Atualização',
    timestamp: new Date(),
    details: 'Campos da tarefa atualizados pelo Copiloto IA.',
  });

  await task.save();

  // Efeito cascata se concluída
  if (statusChanged && status === 'concluida') {
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
      status: task.status,
      prioridade: task.priority,
      peso: task.peso,
      tempo_estimado: task.tempo_estimado,
      tempo_real: task.tempo_real,
      tags: task.tags,
      data_prevista: task.data_prevista ? task.data_prevista.toISOString().split('T')[0] : null,
    },
    tarefas_desbloqueadas: unblockedTasks,
  };
}

// ─── obter_configuracoes_perfil ─────────────────────────────────────────────────
async function handleObterConfiguracoesPerfil(userId) {
  const user = await User.findById(userId);
  if (!user) {
    return { error: 'Usuário não encontrado.' };
  }
  return {
    settings: {
      email_deadlines: user.settings?.email_deadlines ?? true,
      email_weekly_summary: user.settings?.email_weekly_summary ?? true,
      timer_limit_hours: user.settings?.timer_limit_hours ?? 4,
      weekly_study_goal_hours: user.settings?.weekly_study_goal_hours ?? 10,
    }
  };
}

// ─── atualizar_configuracoes_perfil ─────────────────────────────────────────────
async function handleAtualizarConfiguracoesPerfil(userId, args) {
  const user = await User.findById(userId);
  if (!user) {
    return { error: 'Usuário não encontrado.' };
  }

  if (!user.settings) {
    user.settings = {};
  }

  if (args.timer_limit_hours !== undefined) {
    user.settings.timer_limit_hours = args.timer_limit_hours;
  }
  if (args.weekly_study_goal_hours !== undefined) {
    user.settings.weekly_study_goal_hours = args.weekly_study_goal_hours;
  }
  if (args.email_deadlines !== undefined) {
    user.settings.email_deadlines = args.email_deadlines;
  }
  if (args.email_weekly_summary !== undefined) {
    user.settings.email_weekly_summary = args.email_weekly_summary;
  }

  await user.save();

  return {
    sucesso: true,
    settings: {
      email_deadlines: user.settings.email_deadlines,
      email_weekly_summary: user.settings.email_weekly_summary,
      timer_limit_hours: user.settings.timer_limit_hours,
      weekly_study_goal_hours: user.settings.weekly_study_goal_hours,
    }
  };
}

// ─── analisar_historico_produtividade ───────────────────────────────────────────
async function handleAnalisarHistoricoProdutividade(userId) {
  const allTasks = await AcademicTask.find({ user_id: userId, is_deleted: false }).populate('subject_id', 'nome');
  const subjects = await Subject.find({ user_id: userId });
  const user = await User.findById(userId);

  const plainTasks = allTasks.map(t => t.toObject());
  const tasksWithStatus = plainTasks.map(t => ({
    ...t,
    status: statusEngine.computeEffectiveStatus(t, plainTasks),
  }));

  const weeklyGoalHours = user?.settings?.weekly_study_goal_hours ?? 10;

  const totalTasks = tasksWithStatus.length;
  const completedTasks = tasksWithStatus.filter(t => t.status === 'concluida');
  const completedCount = completedTasks.length;
  const pendingCount = tasksWithStatus.filter(t => t.status === 'pendente').length;
  const inProgressCount = tasksWithStatus.filter(t => t.status === 'em_andamento').length;
  const delayedCount = tasksWithStatus.filter(t => t.status === 'atrasada').length;
  const blockedCount = tasksWithStatus.filter(t => t.status === 'bloqueada').length;

  let totalRealTimeMin = 0;
  let totalEstimatedTimeMin = 0;
  let taskDeviations = [];

  for (const task of completedTasks) {
    const real = task.tempo_real || 0;
    const est = task.tempo_estimado || 0;
    totalRealTimeMin += real;
    totalEstimatedTimeMin += est;

    if (est > 0) {
      const dev = ((real - est) / est) * 100;
      taskDeviations.push({
        titulo: task.titulo,
        disciplina: task.subject_id?.nome || 'Sem disciplina',
        tempo_estimado: est,
        tempo_real: real,
        desvio_percentual: Math.round(dev * 100) / 100
      });
    }
  }

  // Somar foco nas focus_sessions nos últimos 7 dias
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  let focusTimeLastWeekMin = 0;
  
  for (const task of tasksWithStatus) {
    if (task.focus_sessions && Array.isArray(task.focus_sessions)) {
      for (const session of task.focus_sessions) {
        const endedAt = session.ended_at ? new Date(session.ended_at) : null;
        if (endedAt && endedAt >= oneWeekAgo) {
          focusTimeLastWeekMin += session.duration_min || 0;
        }
      }
    }
  }
  const focusTimeLastWeekHours = Math.round((focusTimeLastWeekMin / 60) * 100) / 100;

  // Métricas por disciplina
  const subjectMetrics = subjects.map(sub => {
    const subTasks = tasksWithStatus.filter(t => String(t.subject_id?._id || t.subject_id) === String(sub._id));
    const subCompleted = subTasks.filter(t => t.status === 'concluida');
    const subReal = subCompleted.reduce((sum, t) => sum + (t.tempo_real || 0), 0);
    const subEst = subTasks.reduce((sum, t) => sum + (t.tempo_estimado || 0), 0);
    const progressResult = statusEngine.computeWeightedProgress(subTasks);
    
    return {
      nome: sub.nome,
      total_tarefas: subTasks.length,
      concluidas: subCompleted.length,
      tempo_real_min: subReal,
      tempo_estimado_min: subEst,
      progresso: typeof progressResult === 'object' ? progressResult.progress : progressResult,
      desvio: subEst > 0 ? Math.round(((subReal - subEst) / subEst) * 100 * 100) / 100 : null
    };
  });

  // Gargalos
  const bottlenecks = tasksWithStatus
    .filter(t => t.status === 'atrasada' || (t.status === 'concluida' && t.tempo_estimado > 0 && ((t.tempo_real - t.tempo_estimado) / t.tempo_estimado) > 0.2))
    .map(t => {
      const dev = t.status === 'concluida' ? ((t.tempo_real - t.tempo_estimado) / t.tempo_estimado) * 100 : null;
      return {
        titulo: t.titulo,
        status: t.status,
        desvio_percentual: dev ? Math.round(dev * 100) / 100 : null,
        data_prevista: t.data_prevista ? t.data_prevista.toISOString().split('T')[0] : null
      };
    });

  return {
    analise_global: {
      total_tarefas: totalTasks,
      concluidas: completedCount,
      pendentes: pendingCount,
      em_andamento: inProgressCount,
      atrasadas: delayedCount,
      bloqueadas: blockedCount,
      taxa_conclusao: totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0,
      tempo_total_real_horas: Math.round((totalRealTimeMin / 60) * 100) / 100,
      tempo_total_estimado_horas: Math.round((totalEstimatedTimeMin / 60) * 100) / 100,
      desvio_global_percentual: totalEstimatedTimeMin > 0 ? Math.round(((totalRealTimeMin - totalEstimatedTimeMin) / totalEstimatedTimeMin) * 100 * 100) / 100 : null,
    },
    meta_semanal: {
      meta_horas: weeklyGoalHours,
      horas_estudadas_ultimos_7_dias: focusTimeLastWeekHours,
      percentual_meta_atingido: weeklyGoalHours > 0 ? Math.round((focusTimeLastWeekHours / weeklyGoalHours) * 100) : 0
    },
    disciplinas: subjectMetrics,
    gargalos: bottlenecks,
    tarefas_com_desvio: taskDeviations.sort((a, b) => b.desvio_percentual - a.desvio_percentual).slice(0, 5)
  };
}

// ─── Mapa de Handlers ───────────────────────────────────────────────────────────
const functionHandlers = {
  listar_tarefas: handleListarTarefas,
  listar_disciplinas: handleListarDisciplinas,
  buscar_tarefa_por_nome: handleBuscarTarefaPorNome,
  criar_tarefa: handleCriarTarefa,
  atualizar_status_tarefa: handleAtualizarStatusTarefa,
  excluir_tarefa: handleExcluirTarefa,
  
  // Novas ferramentas
  criar_disciplina: handleCriarDisciplina,
  atualizar_disciplina: handleAtualizarDisciplina,
  excluir_disciplina: handleExcluirDisciplina,
  atualizar_tarefa: handleAtualizarTarefa,
  obter_configuracoes_perfil: handleObterConfiguracoesPerfil,
  atualizar_configuracoes_perfil: handleAtualizarConfiguracoesPerfil,
  analisar_historico_produtividade: handleAnalisarHistoricoProdutividade,
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
 * @param {string} userDateTime - Data/hora local do cliente
 * @returns {Object} { response: string, executedActions: Array }
 */
async function processAgentMessage(userId, message, history = [], userDateTime = null) {
  const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash'];
  let lastError = null;
  const executedActions = [];

  // Trimmar histórico para manter dentro do limite de tokens
  let trimmedHistory = history.slice(-MAX_HISTORY_LENGTH);
  // Gemini exige que o histórico comece com 'user'
  while (trimmedHistory.length > 0 && trimmedHistory[0].role !== 'user') {
    trimmedHistory = trimmedHistory.slice(1);
  }

  // Garantir que pares user/model estão corretos (Gemini exige alternância)
  const sanitizedHistory = [];
  for (const entry of trimmedHistory) {
    if (!entry || !entry.role || !Array.isArray(entry.parts)) continue;
    // Evitar duas mensagens seguidas do mesmo role
    if (sanitizedHistory.length > 0 && sanitizedHistory[sanitizedHistory.length - 1].role === entry.role) {
      continue;
    }
    sanitizedHistory.push(entry);
  }

  for (const modelName of modelsToTry) {
    try {
      console.log(`[AgentService] Tentando comunicação usando o modelo: ${modelName}`);
      const model = getAgentModel(userDateTime, modelName);
      const chat = model.startChat({ history: sanitizedHistory });

      // Limpar ações executadas caso estejamos em uma nova tentativa (para evitar duplicidade)
      executedActions.length = 0;

      // Enviar a mensagem do usuário
      let result = await chat.sendMessage(message);
      let response = result.response;

      // Loop do agente: processar chamadas de função iterativamente
      for (let iteration = 0; iteration < MAX_AGENT_ITERATIONS; iteration++) {
        let calls;
        try {
          calls = response.functionCalls();
        } catch (fcErr) {
          console.warn('[AgentService] Erro ao extrair functionCalls:', fcErr.message);
          break;
        }
        if (!calls || calls.length === 0) break;

        // Executar todas as chamadas de função retornadas
        const functionResponses = [];

        for (const call of calls) {
          if (!call || !call.name) continue;
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
                response: fnResult || {},
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

        if (functionResponses.length === 0) break;

        // Enviar os resultados das funções de volta para o modelo
        result = await chat.sendMessage(functionResponses);
        response = result.response;
      }

      // Extrair texto final da resposta (com fallback seguro)
      let text;
      try {
        text = response.text();
      } catch (textErr) {
        console.error('[AgentService] Erro ao extrair texto da resposta:', textErr.message);
        text = 'Processamento concluído, mas não consegui formular uma resposta textual. As ações foram executadas com sucesso.';
      }

      return { response: text, executedActions };

    } catch (geminiError) {
      console.error(`[AgentService] Erro na comunicação com o Gemini usando ${modelName}:`, geminiError.message);
      lastError = geminiError;
      
      // Se já executou alguma ação antes do erro, retorna resultado parcial
      if (executedActions.length > 0) {
        return {
          response: 'Consegui executar suas solicitações, mas tive um problema ao gerar a resposta final. Verifique os dados atualizados no painel.',
          executedActions,
        };
      }
    }
  }

  // Se ambos os modelos falharem
  return {
    response: `Desculpe, o serviço do Gemini está temporariamente indisponível devido à alta demanda no momento (Erro: ${lastError?.message || '503'}). Por favor, tente novamente em alguns instantes.`,
    executedActions: [],
  };
}

module.exports = { processAgentMessage };
