const { GoogleGenerativeAI } = require('@google/generative-ai');

let genAI = null;
let model = null;

/**
 * Inicializa o cliente Gemini (lazy singleton).
 * Falha graciosamente se a chave não estiver configurada.
 */
function getModel() {
  if (model) return model;
  const apiKey = process.env.GOOGLE_AI_STUDIO_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_AI_STUDIO_KEY não configurada no .env');
  }
  genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
  return model;
}

/**
 * Gera insights educacionais personalizados baseados nos dados de tempo do aluno.
 *
 * @param {Object} studentData - Dados analíticos do aluno
 * @param {Array}  studentData.subjects - Lista de disciplinas com métricas
 * @param {Object} studentData.globalMetrics - Métricas globais agregadas
 * @returns {Object} { recommendations: string[], summary: string }
 */
async function generateStudyInsights(studentData) {
  const gemini = getModel();

  const subjectLines = studentData.subjects.map(s => {
    const deviation = s.deviation !== null
      ? `${s.deviation > 0 ? '+' : ''}${s.deviation.toFixed(1)}%`
      : 'sem dados de tempo';

    return `- ${s.nome}: Progresso ${s.progress}%, Desvio de tempo: ${deviation}, ` +
           `Estimado: ${s.tempoEstimado}min, Real: ${s.tempoReal}min, ` +
           `Tarefas: ${s.taskCount} (${s.completedCount} concluídas)`;
  }).join('\n');

  const prompt = `
Você é um tutor educacional especializado em gestão de tempo acadêmico.

Analise os seguintes dados de um estudante e gere recomendações personalizadas e práticas.

## Dados do Estudante

### Métricas Globais
- Progresso geral: ${studentData.globalMetrics.progress}%
- Total de disciplinas: ${studentData.subjects.length}
- Tempo total de estudo registrado: ${studentData.globalMetrics.totalTimeSpent} minutos

### Disciplinas
${subjectLines}

## Regras de Geração
1. Gere exatamente 3 a 5 recomendações curtas e acionáveis (máximo 2 frases cada).
2. Se uma disciplina tem desvio positivo (aluno leva MAIS tempo que o estimado), recomende reorganização.
3. Se uma disciplina tem desvio negativo (aluno leva MENOS tempo), elogie e sugira aprofundamento.
4. Se não há dados de tempo, recomende que o aluno comece a registrar seus tempos.
5. Use tom amigável e motivacional.
6. Responda SOMENTE em português brasileiro.

## Formato de Resposta
Responda EXCLUSIVAMENTE em JSON válido (sem markdown, sem backticks), com esta estrutura:
{
  "recommendations": ["recomendação 1", "recomendação 2", ...],
  "summary": "Resumo geral de uma frase sobre o desempenho do aluno"
}
`.trim();

  try {
    const result = await gemini.generateContent(prompt);
    const responseText = result.response.text().trim();

    // Limpar possíveis backticks de markdown que o modelo pode adicionar
    const cleanedText = responseText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const parsed = JSON.parse(cleanedText);

    return {
      recommendations: parsed.recommendations || [],
      summary: parsed.summary || 'Análise concluída.',
    };
  } catch (error) {
    console.error('Erro na API Gemini:', error.message);

    // Fallback local se a API falhar
    return generateFallbackInsights(studentData);
  }
}

/**
 * Fallback local quando a API Gemini não está disponível.
 * Gera insights baseados em regras simples de desvio.
 */
function generateFallbackInsights(studentData) {
  const recommendations = [];
  const subjectsWithDeviation = studentData.subjects.filter(s => s.deviation !== null);
  const totalSubjects = studentData.subjects.length;

  if (subjectsWithDeviation.length === 0 && totalSubjects > 0) {
    // Há disciplinas mas sem dados de tempo — gerar insights baseados em progresso
    const lowProgress = studentData.subjects.filter(s => (s.progress || 0) < 50);
    const highProgress = studentData.subjects.filter(s => (s.progress || 0) >= 80);

    if (lowProgress.length > 0) {
      recommendations.push(
        `As disciplinas ${lowProgress.map(s => `"${s.nome}"`).join(', ')} estão abaixo de 50% de progresso. Priorize as tarefas pendentes dessas matérias.`
      );
    }
    if (highProgress.length > 0) {
      recommendations.push(
        `Parabéns! ${highProgress.map(s => `"${s.nome}"`).join(', ')} ${highProgress.length === 1 ? 'está' : 'estão'} com excelente progresso (${highProgress.length === 1 ? highProgress[0].progress : '80+'}%). Continue assim!`
      );
    }
    recommendations.push(
      'Registre o tempo estimado e real nas suas tarefas para obter análises de eficiência mais detalhadas.',
      'Defina metas de tempo para cada sessão de estudo — isso ajuda a identificar gargalos e otimizar sua rotina.'
    );
  } else if (subjectsWithDeviation.length === 0) {
    recommendations.push(
      'Comece criando disciplinas e tarefas para que a IA possa gerar recomendações personalizadas.',
      'Defina metas de tempo para cada sessão de estudo — isso ajuda a identificar gargalos.',
      'Mantenha seu progresso atualizado concluindo as tarefas conforme finaliza.'
    );
  } else {
    const overTime = subjectsWithDeviation.filter(s => s.deviation > 20);
    const underTime = subjectsWithDeviation.filter(s => s.deviation < -10);
    const onTrack = subjectsWithDeviation.filter(s => Math.abs(s.deviation) <= 20);

    overTime.forEach(s => {
      recommendations.push(
        `Você está levando ${Math.abs(s.deviation).toFixed(0)}% a mais de tempo em "${s.nome}" do que o planejado. Considere dividir suas sessões de estudo em blocos menores.`
      );
    });

    underTime.forEach(s => {
      recommendations.push(
        `Excelente eficiência em "${s.nome}"! Você está ${Math.abs(s.deviation).toFixed(0)}% abaixo do tempo estimado. Considere aprofundar com exercícios extras.`
      );
    });

    if (onTrack.length > 0) {
      recommendations.push(
        `${onTrack.length} disciplina(s) estão dentro do cronograma planejado. Continue mantendo esse ritmo!`
      );
    }
  }

  const progressStr = studentData.globalMetrics?.progress
    ? `Progresso geral: ${studentData.globalMetrics.progress}%.`
    : '';

  return {
    recommendations: recommendations.slice(0, 5),
    summary: subjectsWithDeviation.length === 0
      ? (totalSubjects > 0
          ? `Análise baseada no progresso de ${totalSubjects} disciplina(s). ${progressStr} Registre tempos para obter análises de eficiência.`
          : 'Crie disciplinas e tarefas para obter insights personalizados.')
      : `Análise baseada em ${subjectsWithDeviation.length} disciplina(s) com dados de tempo registrados.`,
  };
}

/**
 * Gera dica atômica para uma tarefa concluída.
 */
async function generateTaskInsight(taskData) {
  try {
    const gemini = getModel();
    const deviationStr = taskData.deviation !== null ? `${taskData.deviation.toFixed(1)}%` : '0%';
    const prompt = `
Você é o assistente de IA do EduTrack AI, especializado em produtividade acadêmica.
O estudante João acabou de concluir a tarefa "${taskData.titulo}" da disciplina "${taskData.subjectName}".
Ele estimou que levaria ${taskData.tempoEstimado} minutos, mas executou em ${taskData.tempoReal} minutos (Desvio de ${deviationStr}).
Com base nesses dados e na classificação "${taskData.classification}" de desempenho (onde "acima" significa que levou muito mais tempo, "abaixo" significa alta eficiência terminando antes, e "no_prazo" significa que terminou muito próximo do planejado), forneça uma dica de produtividade extremamente curta, direta e motivacional em português (PT-BR) para ajudar o aluno a calibrar seus próximos planejamentos.
Sua dica deve ter no máximo 3 linhas e ser muito focada no desvio apresentado.
`.trim();

    const result = await gemini.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error('Erro na API Gemini para dica de tarefa:', error.message);
    return generateFallbackTaskInsight(taskData);
  }
}

function generateFallbackTaskInsight(taskData) {
  const { titulo, deviation, classification } = taskData;
  if (classification === 'acima') {
    return `Você levou ${Math.abs(deviation).toFixed(0)}% a mais de tempo do que o planejado para concluir "${titulo}". Para as próximas tarefas desta matéria, experimente a Técnica Pomodoro e divida o escopo em partes menores para calibrar melhor o tempo estimado.`;
  } else if (classification === 'abaixo') {
    return `Incrível! Você concluiu "${titulo}" super rápido, economizando tempo (${Math.abs(deviation).toFixed(0)}% abaixo do estimado). Use essa alta eficiência para adiantar outras leituras ou desfrutar de um merecido descanso!`;
  } else {
    return `Excelente precisão! Seu planejamento para "${titulo}" foi muito certeiro, concluindo dentro do prazo esperado. Continue com essa consistência para manter seus estudos organizados e sem estresse.`;
  }
}

module.exports = {
  generateStudyInsights,
  generateFallbackInsights,
  generateTaskInsight,
};
