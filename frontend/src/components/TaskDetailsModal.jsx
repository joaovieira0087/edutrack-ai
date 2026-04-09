import React from 'react';

const priorityConfig = {
  1: { label: 'P1 — Crítica', color: '#de4c4a', fill: 'currentColor', strokeW: '0' },
  2: { label: 'P2 — Alta', color: '#f49c18', fill: 'currentColor', strokeW: '0' },
  3: { label: 'P3 — Média', color: '#4073ff', fill: 'currentColor', strokeW: '0' },
  4: { label: 'P4 — Baixa', color: '#808080', fill: 'none', strokeW: '2.5' },
};

const statusLabels = {
  pendente: { text: 'Pendente', bg: 'bg-amber-50', color: 'text-amber-700', border: 'border-amber-200' },
  'em andamento': { text: 'Em Andamento', bg: 'bg-blue-50', color: 'text-blue-700', border: 'border-blue-200' },
  concluida: { text: 'Concluída', bg: 'bg-emerald-50', color: 'text-emerald-700', border: 'border-emerald-200' },
};

const actionIcons = {
  'Criação': { color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  'Edição': { color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
  'Exclusão': { color: 'text-red-500', bg: 'bg-red-50', border: 'border-red-200' },
  'Recuperação': { color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-200' },
};

const formatTimestamp = (ts) => {
  const date = new Date(ts);
  if (isNaN(date.getTime())) return ts;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const formatDateDisplay = (dateString) => {
  if (!dateString) return 'Sem data definida';
  const dateObj = new Date(dateString + 'T00:00:00');
  if (isNaN(dateObj.getTime())) return dateString;
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(dateObj);
};

const getTagIcon = (tagStr) => {
  const lower = tagStr.toLowerCase();
  if (lower.includes('prova')) return <svg className="w-3 h-3 mr-1 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
  if (lower.includes('leitura') || lower.includes('livro')) return <svg className="w-3 h-3 mr-1 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5 5.754 5 4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
  if (lower.includes('grupo') || lower.includes('peso')) return <svg className="w-3 h-3 mr-1 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
  return <svg className="w-3 h-3 mr-1 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>;
};

const TaskDetailsModal = ({ task, subject, onClose }) => {
  if (!task) return null;

  const p = Number(task.priority) || 4;
  const pConfig = priorityConfig[p];
  const sConfig = statusLabels[task.status] || statusLabels.pendente;
  const history = Array.isArray(task.history) ? [...task.history].reverse() : [];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 fade-in duration-300 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-50 flex items-start justify-between bg-gradient-to-r from-gray-50 to-white shrink-0">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-3 mb-2">
              <svg
                className="w-5 h-5 shrink-0"
                viewBox="0 0 24 24"
                style={{ color: pConfig.color }}
                fill={pConfig.fill}
                stroke="currentColor"
                strokeWidth={pConfig.strokeW}
              >
                <path d="M4 2v20M4 4l16 5-16 5V4z" />
              </svg>
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: pConfig.color }}>
                {pConfig.label}
              </span>
            </div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight leading-tight">
              {task.titulo}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors shrink-0 mt-1"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {/* Info Grid */}
          <div className="px-8 py-6 grid grid-cols-2 gap-5">
            {/* Status */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</span>
              <div className={`inline-flex items-center px-3 py-1.5 rounded-xl text-xs font-bold ${sConfig.bg} ${sConfig.color} border ${sConfig.border}`}>
                {sConfig.text}
              </div>
            </div>

            {/* Disciplina */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Disciplina</span>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
                <span className="text-sm font-bold text-gray-700">{subject ? subject.nome : 'Sem vínculo'}</span>
              </div>
            </div>

            {/* Data Prevista */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Data Prevista</span>
              <div className="flex items-center gap-2">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-bold text-gray-700">{formatDateDisplay(task.data_prevista)}</span>
              </div>
            </div>

            {/* Criado em */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Criado em</span>
              <span className="text-sm font-bold text-gray-700 block">{formatTimestamp(task.createdAt)}</span>
            </div>
          </div>

          {/* Descrição e Anexos/Tags */}
          <div className="px-8 pb-6 space-y-8">
            {task.descricao && (
              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Descrição</span>
                <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                  <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{task.descricao}</p>
                </div>
              </div>
            )}

            {task.tags && task.tags.length > 0 && (
              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Etiquetas</span>
                <div className="flex flex-wrap gap-2">
                  {task.tags.map((tag, idx) => (
                    <span key={idx} className="inline-flex items-center text-xs font-bold text-gray-600 bg-gray-50 px-2.5 py-1.5 rounded-lg border border-gray-200">
                      {getTagIcon(tag)}
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {task.attachments && task.attachments.length > 0 && (
              <div>
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Anexos ({task.attachments.length})</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {task.attachments.map((file, idx) => (
                    <a key={idx} href={file.file_url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-white border border-gray-200 hover:border-blue-300 hover:shadow-sm rounded-xl transition-all group">
                      <div className="w-10 h-10 bg-blue-50 text-blue-500 rounded-lg flex items-center justify-center shrink-0 border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-gray-700 truncate group-hover:text-blue-600 transition-colors">{file.file_name}</p>
                        <p className="text-[10px] text-gray-400 font-medium">Baixar arquivo ou Visualizar</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="px-8 pb-8">
            <div className="flex items-center gap-3 mb-5">
              <span className="text-gray-500 p-1.5 bg-gray-100 rounded-lg border border-gray-200">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </span>
              <h3 className="text-base font-black text-gray-800 tracking-tight uppercase">
                Histórico de Atividades
              </h3>
              <span className="text-[10px] font-black text-gray-400 bg-white border border-gray-100 px-2 py-0.5 rounded-full">
                {history.length}
              </span>
            </div>

            {history.length === 0 ? (
              <div className="py-8 text-center border-2 border-dashed border-gray-100 rounded-2xl">
                <p className="text-xs font-bold text-gray-300 uppercase tracking-widest">Nenhum evento registrado</p>
                <p className="text-[10px] text-gray-300 mt-1">Eventos futuros aparecerão aqui.</p>
              </div>
            ) : (
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-[15px] top-3 bottom-3 w-[2px] bg-gradient-to-b from-gray-200 via-gray-100 to-transparent rounded-full"></div>

                <div className="space-y-0">
                  {history.map((entry, idx) => {
                    const actionStyle = actionIcons[entry.action] || { color: 'text-gray-500', bg: 'bg-gray-50', border: 'border-gray-200' };
                    const isFirst = idx === 0;

                    return (
                      <div key={idx} className={`relative flex items-start gap-4 py-3 ${isFirst ? '' : ''}`}>
                        {/* Dot */}
                        <div className={`relative z-10 w-[32px] h-[32px] rounded-full ${actionStyle.bg} border-2 ${actionStyle.border} flex items-center justify-center shrink-0 ${isFirst ? 'shadow-sm' : ''}`}>
                          {entry.action === 'Criação' && (
                            <svg className={`w-3.5 h-3.5 ${actionStyle.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" /></svg>
                          )}
                          {entry.action === 'Edição' && (
                            <svg className={`w-3.5 h-3.5 ${actionStyle.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                          )}
                          {entry.action === 'Exclusão' && (
                            <svg className={`w-3.5 h-3.5 ${actionStyle.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                          )}
                          {entry.action === 'Recuperação' && (
                            <svg className={`w-3.5 h-3.5 ${actionStyle.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 pt-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`text-xs font-black ${actionStyle.color} uppercase tracking-wider`}>
                              {entry.action}
                            </span>
                            <span className="text-[10px] text-gray-300 font-bold">•</span>
                            <span className="text-[10px] font-bold text-gray-400">
                              {formatTimestamp(entry.timestamp)}
                            </span>
                          </div>
                          {entry.details && (
                            <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{entry.details}</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsModal;
