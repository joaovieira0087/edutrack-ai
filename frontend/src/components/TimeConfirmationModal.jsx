import React, { useState, useMemo } from 'react';

/**
 * Extrai o timestamp de quando a tarefa entrou em 'em_andamento' pela última vez.
 * Percorre o histórico de trás para frente buscando a transição mais recente.
 */
const getStartTimestamp = (task) => {
  if (!task?.history || task.history.length === 0) return null;

  // Percorrer de trás para frente (mais recente primeiro)
  const reversedHistory = [...task.history].reverse();

  for (const entry of reversedHistory) {
    // Transição explícita de status registrada pelo backend
    if (
      (entry.action === 'Edição' || entry.action === 'Auto-Status') &&
      entry.details &&
      (entry.details.includes('em_andamento') || entry.details.includes('em andamento'))
    ) {
      return new Date(entry.timestamp);
    }
    // Tarefa criada já com status em_andamento
    if (entry.action === 'Criação' && entry.details?.includes('em_andamento')) {
      return new Date(entry.timestamp);
    }
  }

  return null;
};

/**
 * Formata minutos em uma string legível: "2h 30min" ou "45min"
 */
const formatMinutes = (minutes) => {
  if (minutes <= 0) return '0 min';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins} min`;
  if (mins === 0) return `${hours}h`;
  return `${hours}h ${mins}min`;
};

const TimeConfirmationModal = ({ task, onConfirm, onCancel }) => {
  const startTimestamp = useMemo(() => getStartTimestamp(task), [task]);

  const suggestedMinutes = useMemo(() => {
    if (!startTimestamp) return 0;
    return Math.max(1, Math.round((Date.now() - startTimestamp.getTime()) / 60000));
  }, [startTimestamp]);

  const [tempoReal, setTempoReal] = useState(suggestedMinutes > 0 ? String(suggestedMinutes) : '');
  const [isEditing, setIsEditing] = useState(suggestedMinutes === 0);

  const handleConfirm = () => {
    const value = Number(tempoReal);
    if (!value || value <= 0) return;
    onConfirm(value);
  };

  const handleQuickConfirm = () => {
    if (suggestedMinutes > 0) {
      onConfirm(suggestedMinutes);
    }
  };

  if (!task) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/50 backdrop-blur-md"
        onClick={onCancel}
        style={{ animation: 'fadeIn 0.3s ease-out' }}
      ></div>

      {/* Modal */}
      <div
        className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl border border-gray-100 overflow-hidden"
        style={{ animation: 'modalIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}
      >
        {/* Gradient Header */}
        <div className="relative bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 px-8 pt-8 pb-12 text-white overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2"></div>

          {/* Animated clock icon */}
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30 shadow-lg"
                 style={{ animation: 'pulse-soft 2s ease-in-out infinite' }}>
              <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">Concluir Tarefa</h2>
              <p className="text-emerald-100 text-sm font-medium mt-0.5 opacity-90">Confirme o tempo dedicado</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-8 pb-8 -mt-6 relative z-10">
          {/* Task info card */}
          <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 mb-6 shadow-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Tarefa</p>
            <p className="text-sm font-black text-gray-800 leading-snug">{task.titulo}</p>
          </div>

          {/* Time calculation result */}
          {suggestedMinutes > 0 ? (
            <div className="mb-6">
              <div className="flex items-start gap-3 p-4 bg-emerald-50/80 border border-emerald-100 rounded-2xl">
                <div className="w-8 h-8 bg-emerald-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-emerald-800 font-bold leading-relaxed">
                    Identificamos que você dedicou{' '}
                    <span className="text-emerald-700 font-black bg-emerald-100 px-1.5 py-0.5 rounded-lg">
                      {formatMinutes(suggestedMinutes)}
                    </span>{' '}
                    a esta atividade.
                  </p>
                  <p className="text-xs text-emerald-600/70 font-medium mt-1">O tempo está correto?</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <div className="flex items-start gap-3 p-4 bg-amber-50/80 border border-amber-100 rounded-2xl">
                <div className="w-8 h-8 bg-amber-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                  <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-amber-800 font-bold leading-relaxed">
                    Não encontramos registro de início de execução para esta tarefa.
                  </p>
                  <p className="text-xs text-amber-600/70 font-medium mt-1">
                    Informe manualmente o tempo gasto abaixo.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Time input section */}
          <div className="space-y-3 mb-8">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest">
              Tempo Real Gasto (minutos)
            </label>
            <div className="relative">
              <input
                type="number"
                min="1"
                value={tempoReal}
                onChange={(e) => { setTempoReal(e.target.value); setIsEditing(true); }}
                placeholder="Ex: 45"
                className="w-full bg-white border-2 border-gray-200 text-gray-900 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent block px-5 py-4 placeholder-gray-300 transition-all font-bold text-lg text-center"
                autoFocus={suggestedMinutes === 0}
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 font-bold text-sm pointer-events-none">
                min
              </div>
            </div>
            {tempoReal && Number(tempoReal) > 0 && (
              <p className="text-center text-xs font-bold text-gray-400">
                = {formatMinutes(Number(tempoReal))}
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3">
            {/* Quick confirm — only when we have a suggestion and user hasn't edited */}
            {suggestedMinutes > 0 && !isEditing && (
              <button
                onClick={handleQuickConfirm}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 rounded-2xl font-black text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Confirmar {formatMinutes(suggestedMinutes)}
              </button>
            )}

            {/* Standard confirm — when user has edited or no suggestion */}
            {(isEditing || suggestedMinutes === 0) && (
              <button
                onClick={handleConfirm}
                disabled={!tempoReal || Number(tempoReal) <= 0}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white py-4 rounded-2xl font-black text-sm shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:-translate-y-0.5 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:shadow-none"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Concluir Tarefa
              </button>
            )}

            {/* Edit button — only when quick confirm is showing */}
            {suggestedMinutes > 0 && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full text-gray-500 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                Corrigir Tempo Manualmente
              </button>
            )}

            <button
              onClick={onCancel}
              className="w-full text-gray-400 py-3 rounded-xl font-bold text-sm hover:text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
          </div>
        </div>

        {/* Inline keyframe animations */}
        <style>{`
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes modalIn {
            from { opacity: 0; transform: scale(0.95) translateY(10px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
          @keyframes pulse-soft {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
        `}</style>
      </div>
    </div>
  );
};

export default TimeConfirmationModal;
