const Subject = require('../models/Subject');
const AcademicTask = require('../models/AcademicTask');
const statusEngine = require('../services/statusEngine');

const subjectController = {
  // GET /subjects or /get_subjects
  getAll: async (req, res) => {
    try {
      const subjects = await Subject.find({ user_id: req.user.id }).sort({ createdAt: -1 });
      // Map _id to id for frontend compatibility
      const mappedSubjects = subjects.map(s => {
        const obj = s.toObject();
        obj.id = obj._id;
        return obj;
      });
      res.json(mappedSubjects);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar disciplinas', error: error.message });
    }
  },

  // GET /subjects/:id or /get_subject?subjects_id=X
  getById: async (req, res) => {
    try {
      const id = req.params.id || req.query.subjects_id;
      if (!id) return res.status(400).json({ message: 'ID da disciplina é requerido.' });

      const subject = await Subject.findOne({ _id: id, user_id: req.user.id });
      if (!subject) return res.status(404).json({ message: 'Disciplina não encontrada' });
      
      const obj = subject.toObject();
      obj.id = obj._id;
      res.json(obj);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar disciplina', error: error.message });
    }
  },

  // POST /subjects or /post_subjects
  create: async (req, res) => {
    try {
      const newSubject = new Subject({
        ...req.body,
        user_id: req.user.id
      });
      await newSubject.save();
      
      const obj = newSubject.toObject();
      obj.id = obj._id;
      res.status(201).json(obj);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao criar disciplina', error: error.message });
    }
  },

  // GET /subjects/analytics
  getAnalytics: async (req, res) => {
    try {
      const subjects = await Subject.find({ user_id: req.user.id }).sort({ createdAt: -1 });
      const allTasks = await AcademicTask.find({ user_id: req.user.id, is_deleted: false })
        .populate('blocked_by', 'titulo status');

      // Computar status efetivo para todas as tarefas
      const plainTasks = allTasks.map(t => t.toObject());
      const tasksWithEffectiveStatus = plainTasks.map(t => ({
        ...t,
        status: statusEngine.computeEffectiveStatus(t, plainTasks),
      }));

      const analytics = subjects.map(subject => {
        const obj = subject.toObject();
        obj.id = obj._id;

        // Filtrar tarefas desta disciplina
        const subjectTasks = tasksWithEffectiveStatus.filter(
          t => String(t.subject_id) === String(obj._id)
        );

        // Progresso ponderado
        const progress = statusEngine.computeWeightedProgress(subjectTasks);

        // Distribuição de status
        const statusDistribution = {
          pendente: 0,
          em_andamento: 0,
          concluida: 0,
          atrasada: 0,
          bloqueada: 0,
        };
        
        let tempoEstimadoTotal = 0;
        let tempoRealTotal = 0;

        subjectTasks.forEach(t => {
          if (statusDistribution[t.status] !== undefined) {
            statusDistribution[t.status]++;
          }
          tempoEstimadoTotal += (t.tempo_estimado || 0);
          tempoRealTotal += (t.tempo_real || 0);
        });

        return {
          ...obj,
          taskCount: subjectTasks.length,
          progress,
          statusDistribution,
          tempo_estimado: tempoEstimadoTotal,
          tempo_real: tempoRealTotal,
        };
      });

      // Global analytics
      const globalProgress = statusEngine.computeWeightedProgress(tasksWithEffectiveStatus);

      res.json({
        subjects: analytics,
        global: globalProgress,
      });
    } catch (error) {
      res.status(500).json({ message: 'Erro ao calcular analytics', error: error.message });
    }
  },
};

module.exports = subjectController;
