const Subject = require('../models/Subject');

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
  }
};

module.exports = subjectController;
