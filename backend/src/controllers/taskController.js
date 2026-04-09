const AcademicTask = require('../models/AcademicTask');

const taskController = {
  // GET /tasks
  getAll: async (req, res) => {
    try {
      const tasks = await AcademicTask.find({ user_id: req.user.id, is_deleted: false }).sort({ data_prevista: 1 });
      const mappedTasks = tasks.map(t => {
        const obj = t.toObject();
        obj.id = obj._id;
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
      const tasks = await AcademicTask.find({ user_id: req.user.id, is_deleted: true }).sort({ updatedAt: -1 });
      const mappedTasks = tasks.map(t => {
        const obj = t.toObject();
        obj.id = obj._id;
        return obj;
      });
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

      const task = await AcademicTask.findOne({ _id: id, user_id: req.user.id });
      if (!task) return res.status(404).json({ message: 'Tarefa não encontrada' });
      
      const obj = task.toObject();
      obj.id = obj._id;
      res.json(obj);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao buscar tarefa', error: error.message });
    }
  },

  // POST /tasks
  create: async (req, res) => {
    try {
      const newTask = new AcademicTask({
        ...req.body,
        user_id: req.user.id,
        history: [{
          action: 'Criação',
          timestamp: new Date(),
          details: `Tarefa "${req.body.titulo}" criada.`,
        }],
      });
      await newTask.save();
      
      const obj = newTask.toObject();
      obj.id = obj._id;
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

      // Build a human-readable details string from changed fields
      const fieldLabels = {
        titulo: 'Título',
        descricao: 'Descrição',
        priority: 'Prioridade',
        data_prevista: 'Data Prevista',
        subject_id: 'Disciplina',
        status: 'Status',
        tags: 'Etiquetas',
      };
      const changedFields = Object.keys(req.body)
        .filter(k => fieldLabels[k])
        .map(k => fieldLabels[k]);
      const details = changedFields.length > 0
        ? `Campos alterados: ${changedFields.join(', ')}.`
        : 'Atualização realizada.';

      const updatedTask = await AcademicTask.findOneAndUpdate(
        { _id: id, user_id: req.user.id },
        {
          $set: req.body,
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
      
      const obj = updatedTask.toObject();
      obj.id = obj._id;
      res.json(obj);
    } catch (error) {
      res.status(500).json({ message: 'Erro ao atualizar tarefa', error: error.message });
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
