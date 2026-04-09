const express = require('express');
const router = express.Router();
const subjectController = require('../controllers/subjectController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/', (req, res) => {
  if (req.query.subjects_id) return subjectController.getById(req, res);
  return subjectController.getAll(req, res);
});
router.get('/:id', subjectController.getById);
router.post('/', subjectController.create);

module.exports = router;
