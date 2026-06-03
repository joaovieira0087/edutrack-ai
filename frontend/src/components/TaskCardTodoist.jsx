import React from 'react';

// Helper for date parsing and overdue check
const isOverdue = (dateString, status) => {
  if (status === 'concluida') return false;
  if (status === 'atrasada') return true; // Backend already determined
  if (!dateString) return false;
  
  // Create a proper date from string. Expects YYYY-MM-DD or valid parseable Date.
  const taskDate = new Date(dateString + 'T23:59:59');
  if (isNaN(taskDate.getTime())) return false;
  
  const now = new Date();
  return taskDate < now;
};

const formatDate = (dateString) => {
  if (!dateString) return null;
  const dateObj = new Date(dateString + 'T00:00:00'); // Add arbitrary time to avoid timezone shift on local parsing
  if (isNaN(dateObj.getTime())) return dateString;

  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (dateObj.toDateString() === today.toDateString()) return 'Hoje';
  if (dateObj.toDateString() === tomorrow.toDateString()) return 'Amanhã';
  if (dateObj.toDateString() === yesterday.toDateString()) return 'Ontem';

  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(dateObj);
};

const statusConfig = {
  pendente: { label: 'A Iniciar', color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', icon: null },
  em_andamento: { label: 'Fazendo', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', icon: null },
  concluida: { label: 'Feito', color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', icon: null },
  atrasada: { label: 'Atrasada', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', icon: '⚠' },
  bloqueada: { label: 'Bloqueada', color: 'text-gray-500', bg: 'bg-gray-100', border: 'border-gray-300', icon: '🔒' },
};

const getStatusLabelText = (status) => {
  return statusConfig[status]?.label || statusConfig.pendente.label;
};

const getTagIcon = (tagStr) => {
  const lower = tagStr.toLowerCase();
  if (lower.includes('prova')) return <svg className="w-2.5 h-2.5 mr-0.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
  if (lower.includes('leitura') || lower.includes('livro')) return <svg className="w-2.5 h-2.5 mr-0.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5 5.754 5 4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
  if (lower.includes('grupo') || lower.includes('peso')) return <svg className="w-2.5 h-2.5 mr-0.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>;
  return <svg className="w-2.5 h-2.5 mr-0.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>;
};

const TaskCardTodoist = ({ task, subject, onToggleStatus, onEdit, onDelete, onViewDetails }) => {
  const overdue = isOverdue(task.data_prevista, task.status);
  const formattedDate = formatDate(task.data_prevista);
  const sConfig = statusConfig[task.status] || statusConfig.pendente;
  const isBlocked = task.status === 'bloqueada';
  const isDone = task.status === 'concluida';
  const peso = Number(task.peso) || 1;

  const colors = { 
    dueDate: overdue || task.status === 'atrasada'
      ? 'border-red-100 text-red-600 bg-red-50' 
      : isDone 
        ? 'border-gray-100 text-gray-400 bg-gray-50' 
        : 'border-emerald-100 text-emerald-600 bg-emerald-50' 
  };

  return (
    <div 
      onClick={() => onViewDetails && onViewDetails(task)}
      className={`flex flex-col sm:flex-row items-start gap-4 py-4 px-4 bg-white dark:bg-[#1e2a3a] border border-gray-100/50 dark:border-slate-600/40 hover:bg-white dark:hover:bg-[#223145] hover:shadow-[0_4px_24px_rgba(0,0,0,0.04)] dark:hover:shadow-lg dark:hover:shadow-black/20 hover:border-gray-200 dark:hover:border-slate-500/50 transition-all group cursor-pointer rounded-2xl relative ${isDone ? 'opacity-60' : ''} ${isBlocked ? 'opacity-70 border-dashed' : ''} h-auto`}
    >
      {/* Primary Action Button (Checkbox/Locked padlock) */}
      <div className="pt-0.5 relative z-10 shrink-0">
        {isBlocked ? (
          <div className="w-5 h-5 rounded-full border-[1.5px] border-gray-300 dark:border-slate-600 flex items-center justify-center bg-gray-100 dark:bg-slate-700 text-gray-400 dark:text-slate-500 cursor-not-allowed" title="Tarefa bloqueada por dependência">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
          </div>
        ) : (
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleStatus(task); }}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className={`w-5 h-5 rounded-full border-[1.5px] border-gray-300 dark:border-slate-650 flex items-center justify-center transition-all duration-350 group-hover:border-gray-500 dark:group-hover:border-slate-400 hover:bg-gray-100 dark:hover:bg-slate-700 ${
              isDone 
                ? 'bg-emerald-500 border-emerald-500 text-white' 
                : 'bg-transparent text-transparent hover:text-gray-400 dark:hover:text-slate-400 pb-[1px]'
            }`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
          </button>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col gap-1.5 h-auto">
        {/* Disciplina no Topo */}
        {subject && (
          <div className="flex items-center h-auto">
            <span className="inline-flex items-center text-[9px] font-black uppercase tracking-tighter bg-blue-50 text-blue-700 border border-blue-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20 px-2 py-0.5 rounded-md">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 dark:bg-indigo-400 mr-1.5"></span>
              {subject.nome}
            </span>
          </div>
        )}

        {/* Título da Tarefa e Badges de Status (Atrasada/Bloqueada) no Meio */}
        <div className="flex flex-col gap-1 h-auto">
          <div className="flex items-center flex-wrap gap-2 h-auto">
            <h4 className={`text-sm font-bold truncate ${isDone ? 'text-gray-400 dark:text-slate-500 line-through' : 'text-gray-800 dark:text-slate-200'}`}>
              {task.titulo}
            </h4>
            {(task.status === 'atrasada' || task.status === 'bloqueada') && (
              <span className={`inline-flex items-center text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md border ${sConfig.bg} ${sConfig.color} ${sConfig.border} dark:bg-slate-700/80 dark:text-slate-300 dark:border-slate-650/50`}>
                {sConfig.icon && <span className="mr-0.5 text-[8px]">{sConfig.icon}</span>}
                {sConfig.label}
              </span>
            )}
          </div>

          {task.descricao && (
            <p className={`text-[11px] leading-relaxed line-clamp-2 ${isDone ? 'text-gray-300 dark:text-slate-500' : 'text-gray-500 dark:text-slate-400'}`}>
              {task.descricao}
            </p>
          )}

          {task.blocked_by && task.blocked_by.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {task.blocked_by.map((dep, idx) => {
                const title = typeof dep === 'object' && dep.titulo ? dep.titulo : String(dep).slice(-6);
                return (
                  <span key={idx} className="inline-flex items-center text-[9px] font-bold text-red-600 dark:text-red-400 bg-red-50/80 dark:bg-red-950/20 px-1.5 py-0.5 rounded-md border border-red-100 dark:border-red-950/40" title="Dependência">
                    <svg className="w-2.5 h-2.5 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    {title}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Base Row: Datas, Peso, Bandeira de Prioridade e Ícone de Anexo alinhados horizontalmente */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-1.5 pt-1.5 border-t border-gray-50 dark:border-slate-700/50 h-auto">
          <div className="flex items-center gap-1.5 flex-wrap h-auto">
            {task.data_prevista && (
              <span className={`inline-flex items-center text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border bg-white dark:bg-slate-700/40 ${colors.dueDate} dark:text-slate-300 dark:border-slate-600/30 whitespace-nowrap`}>
                <svg className="w-2.5 h-2.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                {new Date(task.data_prevista + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')}
              </span>
            )}
            
            {/* Peso indicator */}
            {peso > 1 && (
              <span className="inline-flex items-center text-[9px] font-black text-indigo-500 dark:text-slate-300 bg-indigo-50 dark:bg-slate-700/40 px-1.5 py-0.5 rounded-md border border-indigo-100 dark:border-slate-600/30" title={`Peso: ${peso}`}>
                <svg className="w-2.5 h-2.5 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path></svg>
                {peso}x
              </span>
            )}

            {/* Bandeira de Prioridade */}
            {(() => {
              const p = Number(task.priority) || 4;
              const config = {
                1: { colorClass: 'text-red-500 dark:text-red-400', label: 'Urgente' },
                2: { colorClass: 'text-amber-500 dark:text-amber-400', label: 'Alta' },
                3: { colorClass: 'text-blue-500 dark:text-blue-400', label: 'Média' },
                4: { colorClass: 'text-slate-400 dark:text-slate-500', label: 'Baixa' }
              }[p];
              return (
                <span className={`inline-flex items-center ${config.colorClass}`} title={`Prioridade: ${config.label}`}>
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4 2v20M4 4l16 5-16 5V4z"/>
                  </svg>
                </span>
              );
            })()}

            {/* Indicador de Presença de Anexos */}
            {task.attachments && task.attachments.length > 0 && (
              <span 
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="inline-flex items-center text-slate-400 dark:text-slate-400 hover:text-slate-650 dark:hover:text-slate-300" 
                title={`${task.attachments.length} anexo(s)`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
              </span>
            )}
          </div>
          
          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 ml-auto">
              {task.tags.map((tag, idx) => (
                <span key={idx} className="inline-flex items-center text-[9px] font-bold text-gray-500 dark:text-slate-400 bg-gray-100 dark:bg-slate-700/40 px-1.5 py-0.5 rounded-md border border-gray-200 dark:border-slate-600/30">
                  {getTagIcon(tag)}
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Hover Action Menu */}
      <div 
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onTouchStart={(e) => e.stopPropagation()}
        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute top-3 right-3 flex items-center gap-1 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm p-1 rounded-lg border border-slate-100 dark:border-slate-700 shadow-sm z-20"
      >
        {onEdit && (
          <button 
            onClick={(e) => { e.stopPropagation(); onEdit(task); }}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="p-1 text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400 rounded-md transition-colors cursor-pointer"
            title="Editar Tarefa"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </button>
        )}
        {onDelete && (
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(task); }}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="p-1 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 rounded-md transition-colors cursor-pointer"
            title="Excluir Tarefa"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default TaskCardTodoist;
