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

// ----------------------------------------------------
// KanbanColumn Component
// ----------------------------------------------------
const KanbanColumn = ({ id, title, tasks, subjects, icon, bgGradient, headerBg, onEdit, onDelete }) => {
  const { setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div className={`flex flex-col w-80 shrink-0 rounded-3xl overflow-hidden ${bgGradient} border border-slate-100 dark:border-slate-700/60 shadow-sm dark:shadow-lg dark:shadow-slate-950/40 transition-colors duration-300 h-auto`}>
      {/* Col Header */}
      <div className={`px-5 py-4 ${headerBg} border-b border-slate-100 dark:border-slate-700 flex flex-col gap-1 items-start justify-center h-auto`}> 
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-bold text-slate-800 dark:text-slate-100 tracking-tight text-[15px]">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 bg-white/50 dark:bg-slate-800/50 px-2 py-0.5 rounded-full shadow-inner">{tasks.length} {tasks.length === 1 ? 'Tarefa' : 'Tarefas'}</span>
        </div>
      </div>

      {/* Col Body */}
      <div ref={setNodeRef} className="flex-1 p-3 flex flex-col gap-3 min-h-[400px] overflow-y-auto custom-scrollbar h-auto">
        {tasks.map(task => (
          <KanbanCard 
            key={task.id} 
            task={task} 
            subject={subjects.find(s => String(s.id) === String(task.subject_id))} 
            onEdit={onEdit} 
            onDelete={onDelete} 
          />
        ))}
        {tasks.length === 0 && (
          <div className="m-auto flex flex-col items-center justify-center p-6 text-center opacity-50 select-none h-auto">
            <div className="w-12 h-12 bg-white/50 dark:bg-slate-800/50 rounded-full flex items-center justify-center mb-3 shadow-inner">
               <svg className="w-5 h-5 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4M8 16l-4-4 4-4" /></svg>
            </div>
            <p className="text-xs font-bold text-slate-400 dark:text-slate-300">Solte as tarefas aqui</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ----------------------------------------------------
// KanbanCard Component
// ----------------------------------------------------
const KanbanCard = ({ task, subject, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    data: { task }
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const isBlocked = task.status === 'bloqueada';
  const isOverdue = task.status === 'atrasada';
  
  // Format Date safely
  let dateText = '';
  if (task.data_prevista) {
     const d = new Date(task.data_prevista + 'T00:00:00');
     dateText = d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
  }

  // Weight representation
  const peso = Number(task.peso) || 1;

  // Render blocked by titles
  const blockedByTitles = isBlocked && task.blocked_by ? task.blocked_by.map(dep => {
      return typeof dep === 'object' && dep.titulo ? dep.titulo : String(dep).slice(-6);
  }).join(', ') : '';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`group relative p-4 rounded-2xl bg-white dark:bg-[#1e2a3a] border ${isOverdue ? 'border-red-400 dark:border-red-500/40 animate-pulse-soft shadow-red-500/10' : 'border-slate-100 dark:border-slate-600/40 shadow-sm dark:shadow-lg dark:shadow-black/20'} focus:outline-none hover:shadow-md hover:border-blue-200 dark:hover:border-slate-500/50 transition-all cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50 ring-2 ring-blue-500 scale-105 z-50' : 'opacity-100'} h-auto`}
    >
      <div className="flex flex-col gap-2 relative z-10 h-auto">
        
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
                    <div className="shrink-0 p-1 bg-slate-50 dark:bg-slate-750 text-slate-500 dark:text-slate-400 rounded-md border border-slate-100 dark:border-slate-700 shadow-inner mr-1" title={`Bloqueada por: ${blockedByTitles}`}>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                    </div>
                )}
                
                {/* Botão Editar (Lápis) */}
                {onEdit && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onEdit(task); }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onTouchStart={(e) => e.stopPropagation()}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition-colors opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
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
                    className="p-1 text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
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
        <h4 className={`text-sm font-bold leading-snug mt-1 ${task.status === 'concluida' ? 'text-slate-400 dark:text-slate-500 line-through' : 'text-slate-800 dark:text-slate-200'}`}>
            {task.titulo}
        </h4>

        {/* Base Row: Datas, Peso, Bandeira de Prioridade e Ícone de Anexo alinhados horizontalmente */}
        <div className="flex items-center justify-between gap-1.5 mt-2 pt-1 h-auto flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap h-auto">
            {/* Due Date */}
            {dateText && (
              <span className={`inline-flex items-center text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border ${isOverdue ? 'border-red-100 dark:border-red-800/30 text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/25' : task.status === 'concluida' ? 'border-slate-100 dark:border-slate-600/30 text-slate-400 dark:text-slate-400 bg-slate-50 dark:bg-slate-700/50' : 'border-emerald-100 dark:border-emerald-800/30 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/25'}`}>
                  <svg className="w-2.5 h-2.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  {dateText}
              </span>
            )}

            {/* Weight indicator */}
            {peso > 1 && (
              <span className="inline-flex items-center text-[9px] font-black text-slate-500 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/40 px-1.5 py-0.5 rounded-md border border-slate-100 dark:border-slate-600/30" title={`Peso: ${peso}`}>
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
                className="inline-flex items-center text-slate-400 dark:text-slate-400 hover:text-slate-655 dark:hover:text-slate-300" 
                title={`${task.attachments.length} anexo(s)`}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
              </span>
            )}
          </div>
        </div>

      </div>

      {/* Subtle glass highlight — light mode only, no gradient in dark */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent dark:from-transparent dark:to-transparent rounded-2xl pointer-events-none"></div>
    </div>
  );
};

// ----------------------------------------------------
// KanbanView Main Component
// ----------------------------------------------------
const KanbanView = ({ tasks, subjects, onTaskMove, onEdit, onDelete }) => {
  const [activeTask, setActiveTask] = useState(null);

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
        {activeTask ? <div className="scale-105 shadow-xl rotate-3 opacity-90 transition-transform"><KanbanCard task={activeTask} subject={subjects.find(s => String(s.id) === String(activeTask.subject_id))} /></div> : null}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanView;
