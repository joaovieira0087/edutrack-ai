import React, { useState } from 'react';
import { 
  DndContext, 
  closestCorners,
  MouseSensor,
  TouchSensor,
  useSensor, 
  useSensors, 
  DragOverlay
} from '@dnd-kit/core';
import { useDroppable, useDraggable } from '@dnd-kit/core';

const columnTopStrips = {
  pendente: 'bg-gradient-to-r from-amber-400 to-orange-500',
  bloqueada: 'bg-gradient-to-r from-slate-400 to-slate-500',
  em_andamento: 'bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600',
  atrasada: 'bg-gradient-to-r from-red-500 to-rose-600',
  concluida: 'bg-gradient-to-r from-emerald-400 to-teal-500',
};

const getTagIcon = (tagStr) => {
  const lower = tagStr.toLowerCase();
  if (lower.includes('prova')) return <svg className="w-2.5 h-2.5 mr-0.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>;
  if (lower.includes('leitura') || lower.includes('livro')) return <svg className="w-2.5 h-2.5 mr-0.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5 5.754 5 4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg>;
  return <svg className="w-2.5 h-2.5 mr-0.5 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>;
};

// ----------------------------------------------------
// KanbanColumn Component
// ----------------------------------------------------
const KanbanColumn = ({ id, title, tasks, subjects, icon, bgGradient, headerBg, onEdit, onDelete, activeTask }) => {
  const { isOver, setNodeRef } = useDroppable({
    id: id,
  });

  const showSilhouette = isOver && activeTask && activeTask.status !== id;

  return (
    <div className={`flex flex-col w-80 shrink-0 rounded-[24px] overflow-hidden ${bgGradient} dark:bg-[#0c101b]/60 dark:backdrop-blur-lg border border-slate-100/80 dark:border-[#1e293b]/30 shadow-sm dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] transition-all duration-300 h-auto`}>
      {/* Top Neon Status Strip */}
      <div className={`h-1.5 w-full ${columnTopStrips[id] || 'bg-slate-300'}`} />

      {/* Col Header */}
      <div className={`px-6 py-4.5 ${headerBg} dark:bg-[#111726]/90 border-b border-slate-100/80 dark:border-[#1e293b]/20 flex flex-col gap-1 items-start justify-center h-auto`}> 
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-bold text-slate-800 dark:text-slate-100 tracking-tight text-[15px]">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-white/[0.03] border border-slate-100/50 dark:border-white/[0.02] px-2 py-0.5 rounded-full shadow-inner">{tasks.length} {tasks.length === 1 ? 'Tarefa' : 'Tarefas'}</span>
        </div>
      </div>

      {/* Col Body */}
      <div ref={setNodeRef} className="flex-1 p-4 flex flex-col gap-3.5 min-h-[400px] overflow-y-auto custom-scrollbar h-auto">
        {tasks.map(task => (
          <KanbanCard 
            key={task.id} 
            task={task} 
            subject={subjects.find(s => String(s.id) === String(task.subject_id))} 
            onEdit={onEdit} 
            onDelete={onDelete} 
          />
        ))}
        {tasks.length === 0 && !showSilhouette && (
          <div className="m-auto flex flex-col items-center justify-center p-6 text-center opacity-50 select-none h-auto">
            <div className="w-12 h-12 bg-white/50 dark:bg-slate-800/40 rounded-full flex items-center justify-center mb-3 shadow-inner">
               <svg className="w-5 h-5 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4M8 16l-4-4 4-4" /></svg>
            </div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-350">Solte as tarefas aqui</p>
          </div>
        )}
        {showSilhouette && (
          <div className="border-2 border-dashed border-blue-400/40 dark:border-white/[0.06] rounded-[20px] p-5 bg-blue-50/5 dark:bg-white/[0.01] min-h-[110px] flex items-center justify-center text-xs font-bold text-blue-500/70 dark:text-slate-400 select-none animate-pulse">
            Soltar tarefa aqui
          </div>
        )}
      </div>
    </div>
  );
};

// ----------------------------------------------------
// KanbanCard Component
// ----------------------------------------------------
const KanbanCard = ({ task, subject, onEdit, onDelete, isOverlay = false }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const isBlocked = task.status === 'bloqueada';
  const isOverdue = task.status === 'atrasada';
  const isEmAndamento = task.status === 'em_andamento';

  // Live Timer states & calculations
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [localStartTime] = useState(() => {
    if (task.session_started_at) {
      return new Date(task.session_started_at).getTime();
    }
    return Date.now();
  });

  React.useEffect(() => {
    if (!isEmAndamento) return;

    // Set initial diff immediately
    const start = task.session_started_at ? new Date(task.session_started_at).getTime() : localStartTime;
    setElapsedSeconds(Math.max(0, Math.floor((Date.now() - start) / 1000)));

    const interval = setInterval(() => {
      const diffSecs = Math.max(0, Math.floor((Date.now() - start) / 1000));
      setElapsedSeconds(diffSecs);
    }, 1000);

    return () => clearInterval(interval);
  }, [isEmAndamento, task.session_started_at, localStartTime]);

  const totalMinutes = Math.floor((task.tempo_real || 0) + elapsedSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const timerText = hours > 0 ? `${hours}h ${mins}min` : `${totalMinutes}min`;

  // Format Date safely
  let dateText = '';
  if (task.data_prevista) {
     const d = new Date(task.data_prevista + 'T00:00:00');
     dateText = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
  }

  // Weight representation
  const peso = Number(task.peso) || 1;

  // Estimated focus time
  const estimated = Number(task.tempo_estimado) || 0;

  // Tags list parsing
  const tagsList = Array.isArray(task.tags) 
    ? task.tags 
    : typeof task.tags === 'string' 
      ? task.tags.split(',').map(t => t.trim()).filter(Boolean)
      : [];

  // Render blocked by titles
  const blockedByTitles = isBlocked && task.blocked_by ? task.blocked_by.map(dep => {
      return typeof dep === 'object' && dep.titulo ? dep.titulo : String(dep).slice(-6);
  }).join(', ') : '';

  const showAsDragging = isDragging && !isOverlay;

  if (showAsDragging) {
    return (
      <div
        ref={setNodeRef}
        style={style}
        {...listeners}
        {...attributes}
        className="border-2 border-dashed border-blue-400/40 dark:border-white/[0.06] rounded-[20px] h-[120px] bg-slate-50/20 dark:bg-[#121214]/20 transition-all"
      />
    );
  }

  const statusBorders = {
    pendente: 'border-l-4 border-l-amber-500/80 dark:border-l-amber-500/80',
    bloqueada: 'border-l-4 border-l-slate-400 dark:border-l-slate-600',
    em_andamento: 'border-l-4 border-l-blue-500 dark:border-l-cyan-400',
    atrasada: 'border-l-4 border-l-red-500 dark:border-l-red-500',
    concluida: 'border-l-4 border-l-emerald-500 dark:border-l-emerald-500',
  };

  const hoverGlows = {
    pendente: 'hover:shadow-[0_8px_24px_rgba(245,158,11,0.06)] hover:border-amber-200/60 dark:hover:border-amber-500/30',
    bloqueada: 'hover:shadow-[0_8px_24px_rgba(148,163,184,0.06)] hover:border-slate-200/60 dark:hover:border-slate-500/30',
    em_andamento: 'hover:shadow-[0_8px_24px_rgba(59,130,246,0.1)] dark:hover:shadow-[0_8px_32px_rgba(34,211,238,0.15)] hover:border-blue-200 dark:hover:border-cyan-500/30',
    atrasada: 'hover:shadow-[0_8px_24px_rgba(239,68,68,0.1)] hover:border-red-200/60 dark:hover:border-red-500/30',
    concluida: 'hover:shadow-[0_8px_24px_rgba(16,185,129,0.06)] hover:border-emerald-200/60 dark:hover:border-emerald-500/30',
  };

  const activeBorder = statusBorders[task.status] || statusBorders.pendente;
  const activeGlow = hoverGlows[task.status] || hoverGlows.pendente;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`group relative p-5 rounded-[20px] transition-all duration-300 ease-out cursor-grab active:cursor-grabbing focus:outline-none h-auto ${
        isOverdue 
          ? `bg-white dark:bg-[#111726]/85 backdrop-blur-md border border-red-300 dark:border-red-500/30 shadow-[0_4px_16px_rgba(239,68,68,0.04)] dark:shadow-[0_6px_20px_rgba(239,68,68,0.15)] ${activeBorder} ${activeGlow} hover:-translate-y-1 hover:scale-[1.015]` 
          : `bg-white dark:bg-[#111726]/85 backdrop-blur-md border border-slate-100 dark:border-[#1e293b]/40 shadow-[0_4px_16px_rgba(0,0,0,0.02)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.3)] ${activeBorder} ${activeGlow} hover:-translate-y-1 hover:scale-[1.015]`
      }`}
    >
      <div className="flex flex-col gap-3 relative z-10 h-auto">
        
        {/* Header Tags */}
        <div className="flex items-start justify-between gap-2 h-auto">
            <div className="flex-1 flex flex-wrap gap-1.5 items-center h-auto">
                {subject && (
                    <span className="inline-flex items-center text-[9px] font-black uppercase tracking-tighter bg-blue-50 text-blue-700 border border-blue-100 dark:bg-indigo-500/10 dark:text-indigo-300 dark:border-indigo-500/20 px-1.5 py-0.5 rounded-md">
                        <span className="w-1 h-1 rounded-full bg-blue-400 dark:bg-indigo-400 mr-1.5"></span>
                        {subject.nome}
                    </span>
                )}
            </div>

            {/* Blocked Padlock & Action Buttons */}
            <div className="shrink-0 flex items-center gap-1 h-auto">
                {isBlocked && (
                    <div className="shrink-0 p-1 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md border border-slate-100 dark:border-white/[0.04] shadow-inner mr-1" title={`Bloqueada por: ${blockedByTitles}`}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    </div>
                )}
                
                {/* Botão Editar (Lápis) */}
                {onEdit && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    className="p-1 text-slate-400 hover:text-blue-600 dark:text-slate-500 dark:hover:text-blue-400 opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Editar Tarefa"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                )}

                {/* Botão Apagar (Lixeira) */}
                {onDelete && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(task); }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    className="p-1 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all duration-300 cursor-pointer rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Excluir Tarefa"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
            </div>
        </div>

        {/* Title */}
        <h4 className={`text-sm font-semibold leading-snug ${task.status === 'concluida' ? 'text-slate-400 dark:text-slate-500 line-through opacity-75' : 'text-slate-700 dark:text-slate-200'}`}>
            {task.titulo}
        </h4>

        {/* Academic Tags */}
        {tagsList.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-0.5">
            {tagsList.map((tag, idx) => {
              const customIcon = getTagIcon(tag);
              const tagIcon = customIcon || (
                <svg className="w-2.5 h-2.5 mr-1 text-slate-400 dark:text-slate-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a1.5 1.5 0 0 0 2.122 0l4.318-4.318a1.5 1.5 0 0 0 0-2.122L11.16 3.659A2.25 2.25 0 0 0 9.568 3Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 7.5h.008v.008H6V7.5Z" />
                </svg>
              );
              return (
                <span 
                  key={idx} 
                  className="inline-flex items-center text-[10px] font-medium px-2.5 py-0.5 rounded-full bg-slate-50 dark:bg-white/[0.03] text-slate-600 dark:text-slate-300 border border-slate-200/50 dark:border-white/[0.04] transition-all hover:bg-slate-100/50 dark:hover:bg-white/[0.06] shadow-sm select-none"
                >
                  {tagIcon}
                  <span className="leading-none">{tag}</span>
                </span>
              );
            })}
          </div>
        )}

        {/* Base Row: Datas, Peso, Bandeira de Prioridade e Ícone de Anexo alinhados horizontalmente */}
        <div className="flex items-center justify-between gap-1.5 mt-0.5 pt-2 border-t border-slate-100/80 dark:border-white/[0.04] h-auto flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap h-auto">
            {/* Due Date */}
            {dateText && (
              <span className={`inline-flex items-center text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border ${isOverdue ? 'border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20' : task.status === 'concluida' ? 'border-slate-100 dark:border-slate-700/30 text-slate-400 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/20' : 'border-emerald-100 dark:border-emerald-900/30 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20'}`}>
                  <svg className="w-2.5 h-2.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  {dateText}
              </span>
            )}

            {/* Weight indicator */}
            {peso > 1 && (
              <span className="inline-flex items-center text-[9px] font-black text-slate-500 dark:text-slate-350 bg-slate-50 dark:bg-slate-800/40 px-1.5 py-0.5 rounded-md border border-slate-100/60 dark:border-white/[0.03]" title={`Peso: ${peso}`}>
                   {peso}x
              </span>
            )}

            {/* Priority Flag */}
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

            {/* Attachment Icon */}
            {task.attachments && task.attachments.length > 0 && (
              <span 
                onClick={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onTouchStart={(e) => e.stopPropagation()}
                className="inline-flex items-center text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-355" 
                title={`${task.attachments.length} anexo(s)`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
              </span>
            )}
          </div>
        </div>

        {/* Dynamic active timer for Em Progresso status */}
        {isEmAndamento && (
          <div className="flex flex-col gap-1.5 mt-0.5 pt-2.5 border-t border-slate-100/80 dark:border-white/[0.04] animate-fade-in">
            {/* Duplo Tempo Row */}
            <div className="flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
              <div className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 opacity-80 animate-pulse" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                <span>
                  Ativo: <span className="font-extrabold">{timerText}</span>
                </span>
                <span className="text-slate-300 dark:text-slate-700 mx-1">|</span>
                <span className="text-slate-500 dark:text-slate-400">
                  Meta: <span className="font-semibold">{estimated}min</span>
                </span>
              </div>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
            </div>

            {/* Feedback Reverso / Motivational message */}
            {estimated > 0 && (
              <div className="text-[11px] leading-snug">
                {estimated - totalMinutes > 0 ? (
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    Você tem <span className="font-bold text-blue-600/90 dark:text-blue-400/90">{estimated - totalMinutes}</span> minutos ainda até atingir o tempo que você estimou
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 font-bold">
                    Você passou <span className="font-extrabold text-amber-600 dark:text-amber-400">{totalMinutes - estimated}</span> minutos do tempo que você estimou
                  </span>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

// ----------------------------------------------------
// KanbanView Main Component
// ----------------------------------------------------
const KanbanView = ({ tasks, subjects, onTaskMove, onEdit, onDelete }) => {
  const [activeTask, setActiveTask] = useState(null);
  const [showGuide, setShowGuide] = useState(() => {
    return sessionStorage.getItem('edutrack-dismissed-timer-guide') !== 'true';
  });

  const columnsDef = [
    { id: 'pendente', title: 'A Fazer', icon: <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/30"></span>, bgGradient: 'bg-amber-50/30 dark:bg-amber-900/5', headerBg: 'bg-amber-100/50 dark:bg-amber-900/10' },
    { id: 'bloqueada', title: 'Bloqueadas', icon: <span className="w-2.5 h-2.5 rounded-full bg-gray-400 shadow-sm shadow-gray-400/30"></span>, bgGradient: 'bg-gray-50/50 dark:bg-gray-800/10', headerBg: 'bg-gray-200/50 dark:bg-gray-700/20' },
    { id: 'em_andamento', title: 'Em Progresso', icon: <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/30"></span>, bgGradient: 'bg-blue-50/30 dark:bg-blue-900/5', headerBg: 'bg-blue-100/50 dark:bg-blue-900/10' },
    { id: 'atrasada', title: 'Atrasadas', icon: <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm shadow-red-500/30 animate-pulse"></span>, bgGradient: 'bg-red-50/30 dark:bg-red-900/5', headerBg: 'bg-red-100/50 dark:bg-red-900/10' },
    { id: 'concluida', title: 'Concluídas', icon: <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/30"></span>, bgGradient: 'bg-emerald-50/30 dark:bg-emerald-900/5', headerBg: 'bg-emerald-100/50 dark:bg-emerald-900/10' },
  ];

  // Config DnD Sensors
  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: {
      distance: 5, // Requires 5px movement before dragging starts (prevents accidental clicks)
    },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 250,
      tolerance: 5,
    },
  });
  const sensors = useSensors(mouseSensor, touchSensor);

  const handleDragStart = (event) => {
    const { active } = event;
    const task = tasks.find(t => t.id === active.id);
    setActiveTask(task);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveTask(null);

    // If dropped outside any column
    if (!over) return;

    const taskId = active.id;
    const currentColumnId = active.data.current?.task?.status || tasks.find(t => t.id === taskId)?.status;
    const newColumnId = over.id;

    if (currentColumnId === newColumnId) return; // Unchanged

    const taskToMove = tasks.find(t => t.id === taskId);
    
    // Protection: Blocked tasks cannot be arbitrarily moved to Em Andamento/Concluida
    if (taskToMove.status === 'bloqueada' && (newColumnId === 'em_andamento' || newColumnId === 'concluida')) {
        // We simulate a shake effect purely visual by omitting the save and returning
        // In the parent wrapper, the toast will handle it
        onTaskMove(taskToMove, newColumnId); // Pass it up, the parent will reject and toast
        return;
    }

    onTaskMove(taskToMove, newColumnId);
  };

  return (
    <div className="space-y-6">
      {showGuide && (
        <div className="bg-indigo-50/90 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-[20px] p-5 flex items-start justify-between gap-4 transition-all duration-300 relative shadow-sm">
          <div className="flex gap-3">
            {/* Bulb/Timer Icon */}
            <div className="p-2.5 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0 mt-0.5">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-indigo-950 dark:text-indigo-200">Dica de Produtividade do EduTrack</h4>
              <p className="text-xs text-indigo-800/90 dark:text-indigo-300/80 leading-relaxed font-medium">
                💡 Para manter os insights da IA 100% precisos, lembre-se da regra de ouro: deu uma pausa nos estudos? Mova o card de volta para 'Pendente'. Voltou a focar? Dê o Play movendo-o para 'Em Progresso'. Faça isso repetidas vezes até concluir totalmente a atividade!
              </p>
            </div>
          </div>
          <button 
            onClick={() => {
              setShowGuide(false);
              sessionStorage.setItem('edutrack-dismissed-timer-guide', 'true');
            }}
            className="text-indigo-400 hover:text-indigo-600 dark:text-indigo-500 dark:hover:text-indigo-300 p-1 hover:bg-indigo-100/50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors shrink-0"
            title="Entendi a Regra"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCorners} 
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-6 overflow-x-auto pb-8 custom-scrollbar pt-2 snap-x snap-mandatory">
        {columnsDef.map(col => {
          // Exclude tasks not matching status
          const colTasks = tasks.filter(t => t.status === col.id);
          
          return (
            <div key={col.id} className="snap-start snap-always">
               <KanbanColumn 
                 id={col.id} 
                 title={col.title} 
                 tasks={colTasks} 
                 subjects={subjects}
                 icon={col.icon}
                 bgGradient={col.bgGradient}
                 headerBg={col.headerBg}
                 onEdit={onEdit}
                 onDelete={onDelete}
                 activeTask={activeTask}
               />
            </div>
          );
        })}
      </div>

      {/* Floating Drag Overlay */}
      <DragOverlay dropAnimation={{
          duration: 250,
          easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
      }}>
        {activeTask ? (
          <div className="scale-105 shadow-2xl rotate-3 opacity-90 transition-transform pointer-events-none">
            <KanbanCard 
              task={activeTask} 
              subject={subjects.find(s => String(s.id) === String(activeTask.subject_id))} 
              isOverlay={true}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  </div>
);
};

export default KanbanView;
