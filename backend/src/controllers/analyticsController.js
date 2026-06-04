const fs = require('fs').promises;
const path = require('path');
const { spawn } = require('child_process');
const Subject = require('../models/Subject');
const AcademicTask = require('../models/AcademicTask');
const statusEngine = require('../services/statusEngine');
const geminiService = require('../services/geminiService');

/**
 * Calcula o desvio percentual entre tempo real e tempo estimado.
 * Retorna null se tempo_estimado for 0 ou inexistente.
 * 
 * Fórmula: ((tempo_real - tempo_estimado) / tempo_estimado) * 100
 */
function calcDeviation(tempoReal, tempoEstimado) {
  if (!tempoEstimado || tempoEstimado === 0) return null;
  return ((tempoReal - tempoEstimado) / tempoEstimado) * 100;
}

const analyticsController = {

  // GET /api/analytics
  // Calcula métricas analíticas inline (sem dependência de batch Python)
  getAdvancedAnalytics: async (req, res) => {
    try {
      const userId = req.user.id;

      // 1. Buscar dados com tenant isolation
      const subjects = await Subject.find({ user_id: userId }).sort({ createdAt: -1 });
      const allTasks = await AcademicTask.find({ user_id: userId, is_deleted: false });

      // 2. Computar status efetivo
      const plainTasks = allTasks.map(t => t.toObject());
      const tasksWithStatus = plainTasks.map(t => ({
        ...t,
        status: statusEngine.computeEffectiveStatus(t, plainTasks),
      }));

      const report = {
        generated_at: new Date().toISOString(),
        user_id: userId,
        subjects: [],
        global_metrics: {},
        deviations: [],
      };

      let totalWeight = 0;
      let totalWeightCompleted = 0;
      let totalRealTime = 0;
      let totalEstimatedTime = 0;

      // 3. Métricas por disciplina
      for (const sub of subjects) {
        const subObj = sub.toObject();
        const subTasks = tasksWithStatus.filter(
          t => String(t.subject_id) === String(subObj._id)
        );

        const subWeight = subTasks.reduce((s, t) => s + (t.peso || 1), 0);
        const subWeightCompleted = subTasks
          .filter(t => t.status === 'concluida')
          .reduce((s, t) => s + (t.peso || 1), 0);

        const subTimeReal = subTasks
          .filter(t => t.status === 'concluida')
          .reduce((s, t) => s + (t.tempo_real || 0), 0);
        const subTimeEstimated = subTasks.reduce((s, t) => s + (t.tempo_estimado || 0), 0);

        const progress = subWeight > 0 ? (subWeightCompleted / subWeight) * 100 : 0;
        const efficiency = subTimeEstimated > 0 ? subTimeReal / subTimeEstimated : 0;
        const deviation = calcDeviation(subTimeReal, subTimeEstimated);

        report.subjects.push({
          id: String(subObj._id),
          nome: subObj.nome,
          subject_name: subObj.nome,
          progress_weighted: Math.round(progress * 100) / 100,
          total_weight: subWeight,
          completed_weight: subWeightCompleted,
          time_real_min: subTimeReal,
          total_hours: Math.round((subTimeReal / 60) * 100) / 100,
          time_estimated_min: subTimeEstimated,
          efficiency_ratio: Math.round(efficiency * 100) / 100,
          deviation_percent: deviation !== null ? Math.round(deviation * 100) / 100 : null,
          task_count: subTasks.length,
          completed_count: subTasks.filter(t => t.status === 'concluida').length,
        });

        report.deviations.push({
          subject: subObj.nome,
          deviation_percent: deviation !== null ? Math.round(deviation * 100) / 100 : null,
          status: deviation === null ? 'sem_dados' :
                  deviation > 20 ? 'acima' :
                  deviation < -10 ? 'abaixo' : 'no_prazo',
        });

        totalWeight += subWeight;
        totalWeightCompleted += subWeightCompleted;
        totalRealTime += subTimeReal;
        totalEstimatedTime += subTimeEstimated;
      }

      // 4. Métricas globais
      const globalProgress = totalWeight > 0 ? (totalWeightCompleted / totalWeight) * 100 : 0;
      const velocity = totalRealTime > 0 ? totalWeightCompleted / totalRealTime : 0;
      const remainingWeight = totalWeight - totalWeightCompleted;

      let etaDate = null;
      if (velocity > 0) {
        const minutesToFinish = remainingWeight / velocity;
        etaDate = new Date(Date.now() + minutesToFinish * 60000).toISOString();
      }

      const globalDeviation = calcDeviation(totalRealTime, totalEstimatedTime);

      report.global_metrics = {
        overall_progress: Math.round(globalProgress * 100) / 100,
        total_points: totalWeight,
        completed_points: totalWeightCompleted,
        velocity_points_per_min: Math.round(velocity * 10000) / 10000,
        total_time_spent_min: totalRealTime,
        total_time_estimated_min: totalEstimatedTime,
        forecasted_completion_date: etaDate,
        global_deviation_percent: globalDeviation !== null ? Math.round(globalDeviation * 100) / 100 : null,
      };

      return res.json(report);
    } catch (error) {
      console.error('Erro ao calcular analytics avançados:', error);
      res.status(500).json({ message: 'Erro interno ao processar inteligência de métricas.', error: error.message });
    }
  },

  // GET /api/analytics/insights
  // Endpoint real-time que calcula desvios e chama Gemini para recomendações
  getAIInsights: async (req, res) => {
    try {
      const userId = req.user.id;

      // 1. Busca disciplinas e tarefas do PRÓPRIO usuário (tenant isolation)
      const subjects = await Subject.find({ user_id: userId }).sort({ createdAt: -1 });
      const allTasks = await AcademicTask.find({ user_id: userId, is_deleted: false });

      // 2. Computar status efetivo para todas as tarefas
      const plainTasks = allTasks.map(t => t.toObject());
      const tasksWithStatus = plainTasks.map(t => ({
        ...t,
        status: statusEngine.computeEffectiveStatus(t, plainTasks),
      }));

      // 3. Calcular métricas por disciplina com desvio percentual
      const subjectMetrics = subjects.map(subject => {
        const obj = subject.toObject();
        const subjectTasks = tasksWithStatus.filter(
          t => String(t.subject_id) === String(obj._id)
        );

        const completedTasks = subjectTasks.filter(t => t.status === 'concluida');
        const tempoEstimado = subjectTasks.reduce((sum, t) => sum + (t.tempo_estimado || 0), 0);
        const tempoReal = subjectTasks.reduce((sum, t) => sum + (t.tempo_real || 0), 0);
        const deviation = calcDeviation(tempoReal, tempoEstimado);
        const progress = statusEngine.computeWeightedProgress(subjectTasks);

        return {
          id: String(obj._id),
          nome: obj.nome,
          cargaHoraria: obj.carga_horaria || 0,
          taskCount: subjectTasks.length,
          completedCount: completedTasks.length,
          tempoEstimado,
          tempoReal,
          deviation,
          progress: typeof progress === 'object' ? progress.progress : progress,
        };
      });

      // 4. Métricas globais
      const totalEstimado = subjectMetrics.reduce((s, m) => s + m.tempoEstimado, 0);
      const totalReal = subjectMetrics.reduce((s, m) => s + m.tempoReal, 0);
      const totalTasks = tasksWithStatus.length;
      const completedAll = tasksWithStatus.filter(t => t.status === 'concluida').length;
      const globalProgress = totalTasks === 0 ? 0 : Math.round((completedAll / totalTasks) * 100);

      const studentData = {
        subjects: subjectMetrics,
        globalMetrics: {
          progress: globalProgress,
          totalTimeSpent: totalReal,
          totalEstimated: totalEstimado,
          globalDeviation: calcDeviation(totalReal, totalEstimado),
        },
      };

      // 5. Chamar Gemini para insights
      const aiResult = await geminiService.generateStudyInsights(studentData);

      // 6. Resposta final
      return res.json({
        generated_at: new Date().toISOString(),
        deviations: subjectMetrics.map(s => ({
          subject: s.nome,
          deviation_percent: s.deviation !== null ? Math.round(s.deviation * 100) / 100 : null,
          tempo_estimado_min: s.tempoEstimado,
          tempo_real_min: s.tempoReal,
          status: s.deviation === null ? 'sem_dados' :
                  s.deviation > 20 ? 'acima' :
                  s.deviation < -10 ? 'abaixo' : 'no_prazo',
        })),
        recommendations: aiResult.recommendations,
        summary: aiResult.summary,
        metrics: studentData.globalMetrics,
      });

    } catch (error) {
      console.error('Erro ao gerar insights AI:', error);
      res.status(500).json({
        message: 'Erro ao gerar insights inteligentes.',
        error: error.message,
      });
    }
  },

  // GET /api/analytics/report/pdf
  // Dispara o script Python que gera o PDF e retorna o arquivo
  generatePDFReport: async (req, res) => {
    try {
      const userId = req.user.id;

      // 1. Busca dados do usuário para passar ao Python
      const subjects = await Subject.find({ user_id: userId }).sort({ createdAt: -1 });
      const allTasks = await AcademicTask.find({ user_id: userId, is_deleted: false });

      const plainTasks = allTasks.map(t => t.toObject());
      const tasksWithStatus = plainTasks.map(t => ({
        ...t,
        status: statusEngine.computeEffectiveStatus(t, plainTasks),
      }));

      // 2. Formatar dados para o Python
      const subjectData = subjects.map(subject => {
        const obj = subject.toObject();
        const subjectTasks = tasksWithStatus.filter(
          t => String(t.subject_id) === String(obj._id)
        );
        const completedTasks = subjectTasks.filter(t => t.status === 'concluida');
        const tempoEstimado = subjectTasks.reduce((s, t) => s + (t.tempo_estimado || 0), 0);
        const tempoReal = subjectTasks.reduce((s, t) => s + (t.tempo_real || 0), 0);

        return {
          nome: obj.nome,
          carga_horaria: obj.carga_horaria || 0,
          task_count: subjectTasks.length,
          completed_count: completedTasks.length,
          tempo_estimado: tempoEstimado,
          tempo_real: tempoReal,
          progress: subjectTasks.length === 0 ? 0 :
            Math.round((completedTasks.length / subjectTasks.length) * 100),
        };
      });

      // 3. Tentar obter insights do Gemini para incluir no PDF
      let aiRecommendations = [];
      let aiSummary = 'Sem insights disponíveis.';
      try {
        const subjectMetrics = subjectData.map(s => ({
          ...s,
          deviation: calcDeviation(s.tempo_real, s.tempo_estimado),
        }));
        const totalReal = subjectData.reduce((sum, s) => sum + s.tempo_real, 0);
        const totalEstimado = subjectData.reduce((sum, s) => sum + s.tempo_estimado, 0);

        const aiResult = await geminiService.generateStudyInsights({
          subjects: subjectMetrics,
          globalMetrics: {
            progress: subjectData.length === 0 ? 0 :
              Math.round(subjectData.reduce((s, d) => s + d.progress, 0) / subjectData.length),
            totalTimeSpent: totalReal,
            totalEstimated: totalEstimado,
            globalDeviation: calcDeviation(totalReal, totalEstimado),
          },
        });
        aiRecommendations = aiResult.recommendations;
        aiSummary = aiResult.summary;
      } catch (aiErr) {
        console.warn('Gemini indisponível para PDF, usando fallback:', aiErr.message);
      }

      // 4. Preparar payload JSON para o Python
      const payload = JSON.stringify({
        user_id: userId,
        generated_at: new Date().toISOString(),
        subjects: subjectData,
        ai_recommendations: aiRecommendations,
        ai_summary: aiSummary,
      });

      // 5. Spawnar processo Python para gerar PDF
      const scriptPath = path.resolve(__dirname, '../../../scripts/analytics_engine.py');
      const outputDir = path.resolve(__dirname, '../../../data');

      const pdfFileName = `report_${userId}_${Date.now()}.pdf`;
      const pdfPath = path.join(outputDir, pdfFileName);

      await new Promise((resolve, reject) => {
        const proc = spawn('py', ['-3', scriptPath, '--generate-pdf', '--output', pdfPath], {
          cwd: path.resolve(__dirname, '../../../'),
          env: { ...process.env },
        });

        // Enviar dados via stdin
        proc.stdin.write(payload);
        proc.stdin.end();

        let stderr = '';
        proc.stderr.on('data', (data) => { stderr += data.toString(); });

        proc.on('close', (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Python exit code ${code}: ${stderr}`));
          }
        });

        // Timeout de 30 segundos
        setTimeout(() => {
          proc.kill();
          reject(new Error('Timeout: geração de PDF excedeu 30 segundos.'));
        }, 30000);
      });

      // 6. Stream do PDF de volta
      const pdfBuffer = await fs.readFile(pdfPath);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="EduTrack_Report_${new Date().toISOString().slice(0, 10)}.pdf"`);
      res.send(pdfBuffer);

      // 7. Limpeza assíncrona (remover PDF temporário após envio)
      fs.unlink(pdfPath).catch(() => {});

    } catch (error) {
      console.error('Erro ao gerar relatório PDF:', error);
      res.status(500).json({
        message: 'Erro ao gerar relatório PDF.',
        error: error.message,
      });
    }
  },

  // GET /api/analytics/tasks/:id/insights
  getTaskAIInsights: async (req, res) => {
    try {
      const taskId = req.params.id;
      const userId = req.user.id;

      // 1. Buscar a tarefa no MongoDB pelo ID fornecido, com tenant isolation
      const task = await AcademicTask.findOne({ _id: taskId, user_id: userId })
        .populate('subject_id', 'nome');

      if (!task) {
        return res.status(404).json({ message: 'Tarefa não encontrada' });
      }

      // 2. Garantir que a tarefa esteja com o status concluida
      if (task.status !== 'concluida') {
        return res.status(400).json({ message: 'Apenas tarefas concluídas possuem insights de desempenho.' });
      }

      // 3. Executar o cálculo do Desvio Percentual no próprio Node.js
      const tempoReal = task.tempo_real || 0;
      const tempoEstimado = task.tempo_estimado || 0;
      const deviation = calcDeviation(tempoReal, tempoEstimado);
      
      const classification = deviation === null ? 'no_prazo' :
                             deviation > 20 ? 'acima' :
                             deviation < -10 ? 'abaixo' : 'no_prazo';

      // 4. Obter o nome da disciplina
      const subjectName = task.subject_id?.nome || 'Disciplina Geral';

      // 5. Chamar o serviço Gemini para obter dica de produtividade baseada na tarefa
      const insightText = await geminiService.generateTaskInsight({
        titulo: task.titulo,
        subjectName,
        tempoEstimado,
        tempoReal,
        deviation,
        classification,
      });

      return res.json({
        task: {
          id: task._id,
          titulo: task.titulo,
          descricao: task.descricao,
          tempo_estimado: tempoEstimado,
          tempo_real: tempoReal,
          subject_name: subjectName,
          status: task.status,
          completed_at: task.completed_at,
        },
        deviation: deviation !== null ? Math.round(deviation * 100) / 100 : null,
        classification,
        insight: insightText,
      });

    } catch (error) {
      console.error('Erro ao gerar insight da tarefa:', error);
      res.status(500).json({ message: 'Erro ao gerar insight da tarefa.', error: error.message });
    }
  },

  // GET /api/analytics/tasks/completed
  getCompletedTasks: async (req, res) => {
    try {
      const userId = req.user.id;

      // Buscar tarefas com status: 'concluida' e is_deleted: false do usuário autenticado
      const tasks = await AcademicTask.find({
        user_id: userId,
        status: 'concluida',
        is_deleted: false
      })
      .populate('subject_id', 'nome')
      .sort({ completed_at: -1, updatedAt: -1 });

      const mappedTasks = tasks.map(t => {
        const obj = typeof t.toObject === 'function' ? t.toObject() : { ...t };
        return {
          id: obj._id,
          titulo: obj.titulo,
          tempo_estimado: obj.tempo_estimado || 0,
          tempo_real: obj.tempo_real || 0,
          priority: obj.priority || 4,
          subject_name: obj.subject_id?.nome || 'Disciplina Geral',
          completed_at: obj.completed_at
        };
      });

      return res.json(mappedTasks);
    } catch (error) {
      console.error('Erro ao buscar tarefas concluídas para insights:', error);
      res.status(500).json({ message: 'Erro ao buscar tarefas concluídas para insights.', error: error.message });
    }
  },

  // POST /api/analytics/copiloto
  generateCopilotDescription: async (req, res) => {
    try {
      const { titulo, materia } = req.body;
      if (!titulo || !materia) {
        return res.status(400).json({ message: 'Título e Matéria são obrigatórios.' });
      }

      const description = await geminiService.generateCopilotDescription(titulo, materia);
      return res.json({ description });
    } catch (error) {
      console.error('Erro ao gerar descrição do copiloto:', error);
      res.status(500).json({ message: 'Erro ao gerar descrição da atividade.', error: error.message });
    }
  },
};

module.exports = analyticsController;
