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
const KanbanColumn = ({ id, title, tasks, subjects, icon, bgGradient, headerBg }) => {
  const { setNodeRef } = useDroppable({
    id: id,
  });

  return (
    <div className={`flex flex-col w-80 shrink-0 rounded-3xl overflow-hidden ${bgGradient} border border-gray-100 dark:border-gray-800 shadow-sm transition-colors duration-300`}>
      {/* Col Header */}
      <div className={`px-5 py-4 ${headerBg} backdrop-blur-md border-b border-white/20 flex flex-col gap-1 items-start justify-center shadow-[0_2px_10px_rgba(0,0,0,0.02)]`}> 
        <div className="flex items-center gap-2">
          {icon}
          <h3 className="font-bold text-gray-800 dark:text-gray-100 tracking-tight text-[15px] drop-shadow-sm">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
           <span className="text-[10px] font-black uppercase tracking-widest text-gray-500/80 dark:text-gray-400 bg-white/50 dark:bg-gray-800/50 px-2 py-0.5 rounded-full shadow-inner">{tasks.length} {tasks.length === 1 ? 'Tarefa' : 'Tarefas'}</span>
        </div>
      </div>

      {/* Col Body */}
      <div ref={setNodeRef} className="flex-1 p-3 flex flex-col gap-3 min-h-[400px] overflow-y-auto custom-scrollbar">
        {tasks.map(task => (
          <KanbanCard key={task.id} task={task} subject={subjects.find(s => String(s.id) === String(task.subject_id))} />
        ))}
        {tasks.length === 0 && (
          <div className="m-auto flex flex-col items-center justify-center p-6 text-center opacity-50 select-none">
            <div className="w-12 h-12 bg-white/50 dark:bg-gray-800/50 rounded-full flex items-center justify-center mb-3 shadow-inner">
               <svg className="w-5 h-5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4M8 16l-4-4 4-4" /></svg>
            </div>
            <p className="text-xs font-bold text-gray-400 dark:text-gray-300">Solte as tarefas aqui</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ----------------------------------------------------
// KanbanCard Component
// ----------------------------------------------------
const KanbanCard = ({ task, subject }) => {
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
      className={`relative p-4 rounded-2xl bg-white/80 dark:bg-gray-800/90 backdrop-blur-md shadow-sm border ${isOverdue ? 'border-red-400 dark:border-red-500/50 animate-pulse-soft shadow-red-500/10' : 'border-white dark:border-gray-700/50'} focus:outline-none hover:shadow-md hover:border-blue-200 dark:hover:border-blue-500/50 transition-all cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50 ring-2 ring-blue-500 scale-105 z-50' : 'opacity-100'}`}
    >
      <div className="flex flex-col gap-2 relative z-10">
        
        {/* Header Tags */}
        <div className="flex items-start justify-between gap-2">
            <div className="flex-1 flex flex-wrap gap-1.5 items-center">
                {subject && (
                    <span className="inline-flex items-center text-[9px] font-black uppercase text-indigo-500 tracking-tighter bg-indigo-50 px-1.5 py-0.5 rounded-md border border-indigo-100">
                        <span className="w-1 h-1 rounded-full bg-indigo-400 mr-1.5"></span>
                        {subject.nome}
                    </span>
                )}
                {peso > 1 && (
                    <span className="inline-flex items-center text-[9px] font-black text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-md border border-gray-200 dark:border-gray-600" title={`Peso: ${peso}`}>
                         {peso}x
                    </span>
                )}
            </div>

            {/* Blocked Padlock */}
            {isBlocked && (
                <div className="shrink-0 p-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-md shadow-inner" title={`Bloqueada por: ${blockedByTitles}`}>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path></svg>
                </div>
            )}
        </div>

        {/* Title */}
        <h4 className={`text-sm font-bold leading-snug mt-1 ${task.status === 'concluida' ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-800 dark:text-gray-100'}`}>
            {task.titulo}
        </h4>

        {/* Due Date Row */}
        {dateText && (
          <div className="flex items-center gap-1.5 mt-2">
              <span className={`inline-flex items-center text-[9px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border bg-white ${isOverdue ? 'border-red-100 text-red-600 bg-red-50' : task.status === 'concluida' ? 'border-gray-100 text-gray-400' : 'border-emerald-100 text-emerald-600 bg-emerald-50'}`}>
                  <svg className="w-2.5 h-2.5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  {dateText}
              </span>
          </div>
        )}

      </div>

      {/* Glass gradient overlay layer for aesthetics */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent rounded-2xl pointer-events-none"></div>
    </div>
  );
};

// ----------------------------------------------------
// KanbanView Main Component
// ----------------------------------------------------
const KanbanView = ({ tasks, subjects, onTaskMove }) => {
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
