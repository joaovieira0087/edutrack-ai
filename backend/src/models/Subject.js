const mongoose = require('mongoose');

const SubjectSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
  },
  professor: {
    type: String,
  },
  carga_horaria: {
    type: Number,
  },
  descricao: {
    type: String,
  },
  data_inicio: {
    type: String,
  },
  data_fim: {
    type: String,
  },
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('Subject', SubjectSchema);
