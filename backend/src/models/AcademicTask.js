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
    type: String,
  },
  status: {
    type: String,
    enum: ['pendente', 'em andamento', 'concluida'],
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
  tags: [{
    type: String,
  }],
  attachments: [{
    file_name: String,
    file_url: String,
    file_type: String
  }],
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

module.exports = mongoose.model('AcademicTask', AcademicTaskSchema);
