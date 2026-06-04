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
  tempo_real_acumulado: {
    type: Number,
    default: 0,
  },
  session_started_at: {
    type: Date,
    default: null,
  },
  focus_sessions: [{
    started_at: { type: Date, required: true },
    ended_at: { type: Date, required: true },
    duration_min: { type: Number, required: true }
  }],
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

AcademicTaskSchema.methods.startSession = function() {
  this.session_started_at = new Date();
};

AcademicTaskSchema.methods.closeSession = function(limitHours) {
  if (!this.session_started_at) return;

  const hrs = typeof limitHours === 'number' && !isNaN(limitHours) ? limitHours : 4;
  const limitMinutes = Math.round(hrs * 60);
  const elapsedMs = Date.now() - this.session_started_at.getTime();
  const elapsedMinutes = Math.max(0, Math.round(elapsedMs / 60000));
  const cappedMinutes = Math.min(elapsedMinutes, limitMinutes);

  this.focus_sessions.push({
    started_at: this.session_started_at,
    ended_at: new Date(),
    duration_min: cappedMinutes
  });

  this.tempo_real_acumulado = (this.tempo_real_acumulado || 0) + cappedMinutes;
  this.tempo_real = this.tempo_real_acumulado;

  if (elapsedMinutes > limitMinutes) {
    this.history.push({
      action: 'Auto-Pause',
      timestamp: new Date(),
      details: `Sessão de foco pausada automaticamente após exceder o limite configurado de ${hrs} hora(s) (${elapsedMinutes} minutos medidos, limitados a ${limitMinutes} minutos).`
    });
  }

  this.session_started_at = null;
};

// Compound index for efficient status queries
AcademicTaskSchema.index({ user_id: 1, status: 1, data_prevista: 1 });
AcademicTaskSchema.index({ user_id: 1, is_deleted: 1 });

module.exports = mongoose.model('AcademicTask', AcademicTaskSchema);
