const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', (req, res) => {
  if (req.query.academic_tasks_id) return taskController.getById(req, res);
  return taskController.getAll(req, res);
});
router.get('/trash', taskController.getTrash);
router.get('/:id', taskController.getById);
router.post('/', taskController.create);
router.put('/:id', taskController.update);
router.patch('/:id', taskController.update);

// Trash Actions
router.patch('/trash/restore-all', taskController.restoreAll);
router.patch('/:id/soft-delete', taskController.softDelete);
router.patch('/:id/restore', taskController.restore);
router.delete('/trash/empty', taskController.emptyTrash);
router.delete('/:id/permanent', taskController.permanentlyDelete);

module.exports = router;
