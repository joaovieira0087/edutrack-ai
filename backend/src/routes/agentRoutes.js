const express = require('express');
const router = express.Router();
const agentController = require('../controllers/agentController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.post('/chat', agentController.chat);

module.exports = router;
