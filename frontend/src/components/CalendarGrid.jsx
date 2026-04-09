import React, { useState, useMemo } from 'react';
import TaskCardTodoist from './TaskCardTodoist';

const CalendarGrid = ({ tasks, subjects, onToggleStatus, onEdit, onDelete, onViewDetails }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayTasks, setSelectedDayTasks] = useState(null);

  const getDaysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const { daysArray, tasksByDate } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    
    // Create base array with blank spaces for previous month
    const days = Array.from({ length: firstDay }, () => null);
    
    // Create map for tasks indexed by YYYY-MM-DD
    const taskMap = {};
    tasks.forEach(task => {
      if (!task.data_prevista) return;
      // Convert 'YYYY-MM-DD' properly
      const dateStr = task.data_prevista; 
      if (!taskMap[dateStr]) taskMap[dateStr] = [];
      taskMap[dateStr].push(task);
    });

    for (let i = 1; i <= daysInMonth; i++) {
      const monthStr = String(month + 1).padStart(2, '0');
      const dayStr = String(i).padStart(2, '0');
      const dateKey = `${year}-${monthStr}-${dayStr}`;
      
      days.push({
        day: i,
        dateKey,
        tasks: taskMap[dateKey] || []
      });
    }

    return { daysArray: days, tasksByDate: taskMap };
  }, [currentDate, tasks]);

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const weekDays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  const getSubjectById = (id) => subjects.find(s => Number(s.id) === Number(id)) || null;

  return (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
      {/* Calendar Header */}
      <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-gray-50/50 to-white">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center border border-blue-100 shadow-inner">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          </div>
          <div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <p className="text-sm font-medium text-gray-400">Suas atividades distribuídas no mês.</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-gray-900 transition-colors border border-transparent hover:border-gray-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <button onClick={() => setCurrentDate(new Date())} className="px-4 py-2 bg-gray-50 hover:bg-gray-100 text-sm font-bold text-gray-700 rounded-xl border border-gray-200 transition-colors">
            Hoje
          </button>
          <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-xl text-gray-500 hover:text-gray-900 transition-colors border border-transparent hover:border-gray-200">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50/30">
        {weekDays.map(day => (
          <div key={day} className="py-3 text-center text-xs font-black text-gray-400 uppercase tracking-widest border-r border-gray-100 last:border-0">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 auto-rows-fr bg-gray-50">
        {daysArray.map((dayObj, i) => {
          if (!dayObj) {
            return <div key={`empty-${i}`} className="min-h-[120px] bg-gray-50/50 border-r border-b border-gray-100/50"></div>;
          }

          const isToday = dayObj.dateKey === new Date().toISOString().split('T')[0];
          const hasTasks = dayObj.tasks.length > 0;

          return (
            <div 
              key={dayObj.dateKey} 
              onClick={() => hasTasks && setSelectedDayTasks(dayObj)}
              className={`min-h-[120px] p-2 bg-white border-r border-b border-gray-100 relative group transition-colors ${hasTasks ? 'cursor-pointer hover:bg-blue-50/30' : ''}`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className={`w-7 h-7 flex items-center justify-center text-sm font-bold rounded-full ${isToday ? 'bg-blue-600 text-white shadow-md shadow-blue-500/30' : 'text-gray-500 group-hover:text-gray-900'}`}>
                  {dayObj.day}
                </span>
                {hasTasks && (
                  <span className="text-[10px] font-black text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded border border-gray-200">
                    {dayObj.tasks.length}
                  </span>
                )}
              </div>

              <div className="space-y-1">
                {dayObj.tasks.slice(0, 3).map(task => {
                  const pColor = {
                    1: 'bg-red-100/80 text-red-600 border-red-200',
                    2: 'bg-orange-100/80 text-orange-600 border-orange-200',
                    3: 'bg-blue-100/80 text-blue-600 border-blue-200',
                    4: 'bg-gray-100/80 text-gray-600 border-gray-200'
                  }[Number(task.priority) || 4];

                  return (
                    <div 
                      key={task.id} 
                      onClick={(e) => { e.stopPropagation(); onViewDetails(task); }}
                      className={`text-[10px] sm:text-xs font-bold px-2 py-1 rounded-md border truncate cursor-pointer hover:scale-[1.02] transition-transform shadow-sm ${pColor} ${task.status === 'concluida' ? 'opacity-50 line-through' : ''}`}
                    >
                      {task.titulo}
                    </div>
                  );
                })}
                {dayObj.tasks.length > 3 && (
                  <div className="text-[10px] font-black text-gray-400 text-center pt-1">
                    +{dayObj.tasks.length - 3} mais
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Day View Modal */}
      {selectedDayTasks && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-6">
          <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-in fade-in" onClick={() => setSelectedDayTasks(null)}></div>
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 fade-in">
            <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between bg-gradient-to-r from-blue-50 to-white">
              <h3 className="text-xl font-black text-gray-800">
                Tarefas para {selectedDayTasks.dateKey.split('-').reverse().join('/')}
              </h3>
              <button onClick={() => setSelectedDayTasks(null)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-4 space-y-3 max-h-[60vh] overflow-y-auto bg-gray-50/50">
              {selectedDayTasks.tasks.map(task => (
                <TaskCardTodoist 
                  key={task.id}
                  task={task}
                  subject={getSubjectById(task.subject_id)}
                  onToggleStatus={onToggleStatus}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onViewDetails={onViewDetails}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CalendarGrid;
