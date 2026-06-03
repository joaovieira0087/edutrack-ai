const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  nome: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  senha: {
    type: String,
    required: true,
  },
  // Campos de Controle da Verificação de E-mail (Signup OTP)
  is_verified: {
    type: Boolean,
    required: true,
    default: false,
  },
  verification_code: {
    type: String,
    default: null,
  },
  verification_code_expires: {
    type: Date,
    default: null,
  },
  // Campos de Controle da Recuperação de Senha (OTP 4 dígitos)
  reset_code: {
    type: String,
    default: null,
  },
  reset_code_expires: {
    type: Date,
    default: null,
  },
  // Configurações comportamentais do SaaS
  settings: {
    email_deadlines: { type: Boolean, default: true },
    email_weekly_summary: { type: Boolean, default: true },
    timer_limit_hours: { type: Number, default: 4 },
    weekly_study_goal_hours: { type: Number, default: 10 },
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', UserSchema);
