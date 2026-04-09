import React from 'react';

// Helper for date parsing and overdue check
const isOverdue = (dateString, status) => {
  if (status === 'concluida') return false;
  if (!dateString) return false;
  
  // Create a proper date from string. Expects YYYY-MM-DD or valid parseable Date.
  const taskDate = new Date(dateString);
  if (isNaN(taskDate.getTime())) return false;
  
  // Set time to end of task day to compare against current time.
  taskDate.setHours(23, 59, 59, 999);
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

const getStatusLabelText = (status) => {
  switch(status) {
    case 'pendente': return 'A Iniciar';
    case 'em andamento': return 'Fazendo';
    case 'concluida': return 'Feito';
    default: return 'A Iniciar';
  }
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
  const colors = { dueDate: overdue ? 'border-red-100 text-red-600 bg-red-50' : task.status === 'concluida' ? 'border-gray-100 text-gray-400 bg-gray-50' : 'border-emerald-100 text-emerald-600 bg-emerald-50' };

  return (
    <div 
      onClick={() => onViewDetails && onViewDetails(task)}
      className={`flex flex-col sm:flex-row items-start gap-4 py-4 px-4 bg-white border border-gray-100/50 hover:bg-white hover:shadow-[0_4px_24px_rgba(0,0,0,0.04)] hover:border-gray-200 transition-all group cursor-pointer rounded-2xl relative ${task.status === 'concluida' ? 'opacity-60' : ''}`}>
      {/* Primary Action & Priority Section */}
      <div className="flex items-start gap-3 w-full sm:w-auto">
        <div className="pt-0.5 relative z-10 shrink-0">
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleStatus(task); }}
            className={`w-5 h-5 rounded-full border-[1.5px] border-gray-300 flex items-center justify-center transition-all duration-300 group-hover:border-gray-500 hover:bg-gray-100 ${
              task.status === 'concluida' 
                ? 'bg-emerald-500 border-emerald-500 text-white' 
                : 'bg-transparent text-transparent hover:text-gray-400 pb-[1px]'
            }`}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="4"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
          </button>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center flex-wrap gap-2 mb-1">
            <div className="shrink-0 flex items-center">
              {(() => {
                const p = Number(task.priority) || 4;
                const config = {
                  1: { color: '#de4c4a', fill: 'currentColor', stroke: '0' },
                  2: { color: '#f49c18', fill: 'currentColor', stroke: '0' },
                  3: { color: '#4073ff', fill: 'currentColor', stroke: '0' },
                  4: { color: '#808080', fill: 'none', stroke: '2.5' }
                }[p];
                
                return (
                  <svg 
                    className="w-3 h-3" 
                    viewBox="0 0 24 24" 
                    style={{ color: config.color }}
                    fill={config.fill}
                    stroke="currentColor" 
                    strokeWidth={config.stroke}
                  >
                    <path d="M4 2v20M4 4l16 5-16 5V4z"/>
                  </svg>
                );
              })()}
            </div>
            <h4 className={`text-sm font-bold truncate ${task.status === 'concluida' ? 'text-gray-400 line-through' : 'text-gray-800'}`}>
              {task.titulo}
            </h4>
          </div>

          {task.descricao && (
            <p className={`text-[11px] leading-relaxed line-clamp-2 mb-2 ${task.status === 'concluida' ? 'text-gray-300' : 'text-gray-500'}`}>
              {task.descricao}
            </p>
          )}

          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 flex-wrap flex-1 px-1 min-w-0">
              {task.data_prevista && (
                <span className={`inline-flex items-center text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border bg-white ${colors.dueDate} whitespace-nowrap`}>
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  {new Date(task.data_prevista + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '')}
                </span>
              )}
              
              {task.attachments && task.attachments.length > 0 && (
                <span className="inline-flex items-center text-[10px] text-gray-400 opacity-80" title={`${task.attachments.length} anexo(s)`}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                </span>
              )}
            </div>
            
            {subject && (
              <span className="inline-flex items-center text-[9px] font-black text-gray-400 uppercase tracking-tighter bg-gray-50 px-2 py-0.5 rounded-md border border-gray-100">
                <span className="w-1 h-1 rounded-full bg-indigo-300 mr-1.5"></span>
                {subject.nome}
              </span>
            )}
            
            {task.tags && task.tags.length > 0 && (
              <div className="flex flex-wrap gap-1 ml-1">
                {task.tags.map((tag, idx) => (
                  <span key={idx} className="inline-flex items-center text-[9px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-md border border-gray-200">
                    {getTagIcon(tag)}
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hover Action Menu */}
      <div className="hidden group-hover:flex absolute top-3 right-3 items-center gap-1 bg-white/90 backdrop-blur-sm p-1 rounded-lg border border-gray-100 shadow-sm animate-in fade-in zoom-in duration-200">
        <button 
          onClick={(e) => { e.stopPropagation(); onEdit && onEdit(task); }}
          className="p-1 px-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all font-bold text-[10px] flex items-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
          EDIT
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onDelete && onDelete(task); }}
          className="p-1 px-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all font-bold text-[10px] flex items-center gap-1"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          DEL
        </button>
      </div>
    </div>
  );
};

export default TaskCardTodoist;
