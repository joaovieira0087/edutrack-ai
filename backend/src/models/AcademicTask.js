const mongoose = require('mongoose');

const AcademicTaskSchema = new mongoose.Schema({
  subject_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true,
  },
  titulo: {
    type: String,
    required: true,
  },
  descricao: {
    type: String,
  },
  data_prevista: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['pendente', 'em_andamento', 'concluida', 'atrasada', 'bloqueada'],
    default: 'pendente',
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  priority: {
    type: Number,
    enum: [1, 2, 3, 4],
    default: 4,
  },
  tempo_estimado: {
    type: Number,
    default: 0, // em minutos
  },
  tempo_real: {
    type: Number,
    default: 0, // em minutos
  },
  peso: {
    type: Number,
    default: 1,
    min: 1,
    max: 10,
  },
  tags: [{
    type: String,
  }],
  attachments: [{
    file_name: String,
    file_url: String,
    file_type: String
  }],
  blocked_by: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'AcademicTask',
  }],
  completed_at: {
    type: Date,
    default: null,
  },
  history: [{
    action: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    details: { type: String },
  }],
  is_deleted: {
    type: Boolean,
    default: false,
  }
}, {
  timestamps: true,
});

// Compound index for efficient status queries
AcademicTaskSchema.index({ user_id: 1, status: 1, data_prevista: 1 });
AcademicTaskSchema.index({ user_id: 1, is_deleted: 1 });

module.exports = mongoose.model('AcademicTask', AcademicTaskSchema);
