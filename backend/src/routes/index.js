const express = require('express');
const authRoutes = require('./authRoutes');
const subjectRoutes = require('./subjectRoutes');
const taskRoutes = require('./taskRoutes');
const uploadRoutes = require('./uploadRoutes');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/subjects', subjectRoutes);
router.use('/tasks', taskRoutes);
router.use('/upload', uploadRoutes);

// Retrocompatibilidade rotas antigas
router.use('/post_subjects', subjectRoutes);
router.use('/get_subjects', subjectRoutes);
router.use('/get_subject', subjectRoutes);
router.use('/post_academic_tasks', taskRoutes);
router.use('/get_academic_tasks', taskRoutes);
router.use('/get_academic_task', taskRoutes);

module.exports = router;
