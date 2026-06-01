const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

// Métricas avançadas (Python batch report)
router.get('/', analyticsController.getAdvancedAnalytics);

// Insights com IA (Gemini - real-time)
router.get('/insights', analyticsController.getAIInsights);

// Geração de relatório PDF (Python)
router.get('/report/pdf', analyticsController.generatePDFReport);

// Listagem de tarefas concluídas para insights
router.get('/tasks/completed', analyticsController.getCompletedTasks);

// Insights por tarefa atômica
router.get('/tasks/:id/insights', analyticsController.getTaskAIInsights);

module.exports = router;
