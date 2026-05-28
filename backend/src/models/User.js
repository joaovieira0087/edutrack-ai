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
  // Campos de Controle da Recuperação de Senha (OTP 4 dígitos)
  reset_code: {
    type: String,
    default: null,
  },
  reset_code_expires: {
    type: Date,
    default: null,
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('User', UserSchema);
