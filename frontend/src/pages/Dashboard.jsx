import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import subjectService from '../services/subjectService';
import taskService from '../services/taskService';
import TaskCardTodoist from '../components/TaskCardTodoist';
import EditTaskModal from '../components/EditTaskModal';
import TaskDetailsModal from '../components/TaskDetailsModal';
import CalendarGrid from '../components/CalendarGrid';
import { useToast } from '../context/ToastContext';

const Dashboard = () => {
  const [subjects, setSubjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsTask, setDetailsTask] = useState(null);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('edutrack_view_mode') || 'list');
  const { addToast } = useToast();

  useEffect(() => {
    localStorage.setItem('edutrack_view_mode', viewMode);
  }, [viewMode]);

  const fetchData = useCallback(async () => {
    try {
      const [subjectsData, tasksData] = await Promise.all([
        subjectService.getAll(),
        taskService.getAll()
      ]);
      setSubjects(subjectsData);
      setTasks(tasksData);
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleTaskStatus = async (task) => {
    const newStatus = task.status === 'concluida' ? 'pendente' : 'concluida';
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    
    try {
      await taskService.update(task.id, { status: newStatus });
    } catch (error) {
      console.error('Erro ao atualizar status da tarefa:', error);
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t));
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    fetchData();
    setIsEditModalOpen(false);
    setEditingTask(null);
  };

  const handleViewDetails = async (task) => {
    try {
      // Fetch fresh data with full history from server
      const freshTask = await taskService.getById(task.id);
      setDetailsTask(freshTask);
      setIsDetailsModalOpen(true);
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
      // Fallback to local data if fetch fails
      setDetailsTask(task);
      setIsDetailsModalOpen(true);
    }
  };

  const handleSoftDelete = async (task) => {
    // Optimistic UI — remove immediately
    setTasks(prev => prev.filter(t => t.id !== task.id));

    try {
      await taskService.softDelete(task.id);

      addToast({
        message: 'Item movido para a lixeira',
        type: 'delete',
        duration: 6000,
        action: {
          label: 'Desfazer',
          onClick: async () => {
            try {
              await taskService.restore(task.id);
              // Re-add the task to the list
              setTasks(prev => [...prev, task]);
              addToast({ message: 'Tarefa restaurada com sucesso!', type: 'success', duration: 3000 });
            } catch (err) {
              console.error('Erro ao desfazer exclusão:', err);
              addToast({ message: 'Erro ao restaurar tarefa.', type: 'error', duration: 3000 });
            }
          }
        }
      });
    } catch (error) {
      console.error('Erro ao mover para lixeira:', error);
      // Rollback — re-add task on failure
      setTasks(prev => [...prev, task]);
      addToast({ message: 'Erro ao mover para a lixeira.', type: 'error', duration: 3000 });
    }
  };

  const totalSubjects = subjects.length;
  const totalTasks = tasks.length;
  const pendingTasks = tasks.filter(t => t.status !== 'concluida').length;
  
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      // 1. Busca "Smart"
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        const tituloMatch = task.titulo?.toLowerCase().includes(lowerSearch);
        const subject = subjects.find(s => Number(s.id) === Number(task.subject_id)) || null;
        const subjectMatch = subject?.nome?.toLowerCase().includes(lowerSearch);
        const tagsMatch = task.tags?.some(tag => tag.toLowerCase().includes(lowerSearch));
        
        if (!tituloMatch && !subjectMatch && !tagsMatch) return false;
      }

      // 2. Filtros Rápidos
      if (activeFilter === 'high_priority') {
        if (Number(task.priority) !== 1) return false;
      } else if (activeFilter === 'due_today') {
        if (!task.data_prevista) return false;
        
        const taskDate = new Date(task.data_prevista + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (taskDate.getTime() !== today.getTime()) return false;
      } else if (activeFilter === 'no_subject') {
        if (task.subject_id) return false;
      }

      return true;
    });
  }, [tasks, searchTerm, activeFilter, subjects]);
  
  const temporalTasks = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const categories = {
      overdue: { title: 'Atrasadas', icon: 'clock', color: 'text-red-600', tasks: [] },
      today: { title: 'Hoje', icon: 'calendar', color: 'text-gray-900', tasks: [] },
      tomorrow: { title: 'Amanhã', icon: 'calendar-day', color: 'text-orange-600', tasks: [] },
      upcoming: { title: 'Próximos dias', icon: 'calendar-range', color: 'text-gray-500', tasks: [] },
      recentlyCompleted: { title: 'Concluídas Recentemente', icon: 'check-circle', color: 'text-emerald-600', tasks: [] }
    };

    filteredTasks.forEach(task => {
      if (task.status === 'concluida') {
        const updateDate = new Date(task.updatedAt || task.createdAt);
        updateDate.setHours(0, 0, 0, 0);
        if (updateDate.getTime() === today.getTime()) {
          categories.recentlyCompleted.tasks.push(task);
        }
        return;
      }

      if (!task.data_prevista) {
        categories.upcoming.tasks.push(task);
        return;
      }

      const taskDate = new Date(task.data_prevista + 'T00:00:00');
      if (taskDate < today) {
        categories.overdue.tasks.push(task);
      } else if (taskDate.getTime() === today.getTime()) {
        categories.today.tasks.push(task);
      } else if (taskDate.getTime() === tomorrow.getTime()) {
        categories.tomorrow.tasks.push(task);
      } else {
        categories.upcoming.tasks.push(task);
      }
    });

    // Sort within categories by priority
    Object.keys(categories).forEach(key => {
      categories[key].tasks.sort((a, b) => (Number(a.priority) || 4) - (Number(b.priority) || 4));
    });

    return categories;
  }, [filteredTasks]);

  const getSubjectById = (id) => subjects.find(s => String(s.id) === String(id)) || null;

  const totalSubjectsCount = subjects.length;
  const totalTasksCount = tasks.length;
  const pendingTasksCount = tasks.filter(t => t.status !== 'concluida').length;
  const overallProgress = totalTasksCount === 0 ? 0 : Math.round((tasks.filter(t => t.status === 'concluida').length / totalTasksCount) * 100);

  const colors = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-500', hoverText: 'group-hover:text-blue-600' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-500', hoverText: 'group-hover:text-indigo-600' },
    red: { bg: 'bg-red-50', text: 'text-red-500', hoverText: 'group-hover:text-red-600' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-500', hoverText: 'group-hover:text-emerald-600' },
  };

  const showToday = temporalTasks.today.tasks.length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20 px-4 max-w-[1600px] mx-auto">
      <div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">Seu Dashboard Acadêmico</h1>
        <p className="text-gray-500 mt-2 text-lg">Central de comando unificada e inteligente.</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Disciplinas', value: totalSubjectsCount, iconPath: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253", color: "blue", path: "/disciplinas" },
          { label: 'Total Tarefas', value: totalTasksCount, iconPath: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01", color: "indigo", path: "/dashboard" },
          { label: 'Pendências', value: pendingTasksCount, iconPath: "M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z", color: "red", path: "/dashboard" },
          { label: 'Produtividade', value: `${overallProgress}%`, iconPath: "M13 7h8m0 0v8m0-8l-8 8-4-4-6 6", color: "emerald", path: "/dashboard" },
        ].map((card, idx) => (
          <Link to={card.path} key={idx} className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 hover:-translate-y-1.5 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] transition-all duration-300 flex items-center justify-between group cursor-pointer">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{card.label}</p>
              <h3 className={`text-3xl font-black mt-2 text-gray-800 ${colors[card.color].hoverText} transition-colors`}>{card.value}</h3>
            </div>
            <div className={`w-14 h-14 rounded-2xl ${colors[card.color].bg} flex items-center justify-center ${colors[card.color].text} shadow-inner`}>
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={card.iconPath}></path></svg>
            </div>
          </Link>
        ))}
      </div>

      {/* Search and Filters Section */}
      <div className="flex flex-col md:flex-row gap-5 justify-between items-center bg-white/80 backdrop-blur-md p-4 rounded-3xl border border-gray-100 shadow-[0_4px_24px_rgb(0,0,0,0.03)] animate-in fade-in slide-in-from-bottom-2 duration-500 relative z-10 w-full overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-transparent pointer-events-none"></div>
        {/* Search Input */}
        <div className="relative w-full md:w-80 group">
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
          <input
            type="text"
            className="w-full bg-white border border-gray-200/80 text-gray-900 text-sm font-medium rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 block pl-11 p-3.5 transition-all placeholder-gray-400 hover:border-gray-300 shadow-sm outline-none relative z-10"
            placeholder="Buscar títulos ou disciplinas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        {/* Filter Chips */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto relative z-10">
          {[
            { id: 'all', label: 'Todos', icon: null },
            { id: 'high_priority', label: 'Alta Prioridade', icon: <svg className="w-3.5 h-3.5 mr-1.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg> },
            { id: 'due_today', label: 'Vence Hoje', icon: <svg className="w-3.5 h-3.5 mr-1.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> },
            { id: 'no_subject', label: 'Sem Matéria', icon: <svg className="w-3.5 h-3.5 mr-1.5 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> }
          ].map(filter => (
            <button
              key={filter.id}
              onClick={() => setActiveFilter(filter.id)}
              className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-xs font-bold transition-all duration-300 border flex items-center ${
                activeFilter === filter.id 
                  ? 'bg-gray-900 text-white border-gray-900 shadow-md transform scale-[1.02]' 
                  : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700'
              }`}
            >
              {filter.icon}
              {filter.label}
            </button>
          ))}
        </div>

        {/* View Mode Switcher */}
        <div className="flex bg-gray-100/80 p-1 rounded-xl shadow-inner border border-gray-200/50 relative z-10 w-full md:w-auto justify-center">
          <button 
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-lg flex items-center justify-center transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            title="Visualização em Lista"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16"></path></svg>
          </button>
          <button 
            onClick={() => setViewMode('calendar')}
            className={`p-2 rounded-lg flex items-center justify-center transition-all ${viewMode === 'calendar' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
            title="Visualização em Calendário"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
          </button>
        </div>
      </div>

      {/* Main Task Area */}
      <div className="space-y-12 mt-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-3">
             <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
             {viewMode === 'calendar' ? 'Calendário de Prazos' : 'Gestão de Atividades'}
          </h2>
          <Link to="/tarefas/nova" className="text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-4 py-2 rounded-xl transition-all">
             <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
             Nova Tarefa
          </Link>
        </div>

        {filteredTasks.length === 0 && (searchTerm !== '' || activeFilter !== 'all') ? (
          <div className="py-24 text-center bg-white/50 rounded-3xl border border-dashed border-gray-200 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500 shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-50/50 via-transparent to-transparent"></div>
            <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center text-blue-500 mb-6 border border-gray-100 rotate-3 hover:rotate-0 hover:scale-105 transition-all">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <h3 className="text-2xl font-black text-gray-800 mb-3 relative z-10">Nenhum resultado</h3>
            {searchTerm ? (
              <p className="text-base font-medium text-gray-500 mb-8 relative z-10">Nenhuma tarefa encontrada para "<span className="font-bold text-gray-700">{searchTerm}</span>"</p>
            ) : (
               <p className="text-base font-medium text-gray-500 mb-8 relative z-10">Nenhuma tarefa corresponde ao filtro selecionado.</p>
            )}
            <button 
              onClick={() => { setSearchTerm(''); setActiveFilter('all'); }} 
              className="relative z-10 px-6 py-3 bg-white text-sm font-bold text-blue-600 border-2 border-blue-100 rounded-2xl hover:bg-blue-50 hover:border-blue-200 transition-all shadow-sm active:scale-95"
            >
              Limpar Filtros e Busca
            </button>
          </div>
        ) : viewMode === 'calendar' ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <CalendarGrid 
              tasks={filteredTasks}
              subjects={subjects}
              onToggleStatus={toggleTaskStatus}
              onEdit={handleEditTask}
              onDelete={handleSoftDelete}
              onViewDetails={handleViewDetails}
            />
          </div>
        ) : (
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${showToday ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-8 items-start`}>
            {[
            { id: 'overdue', title: 'Atrasadas', key: 'overdue', color: 'text-red-600', icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            )},
            { id: 'today', title: 'Hoje', key: 'today', color: 'text-indigo-900', icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            )},
            { id: 'upcoming', title: 'Próximas', key: 'upcoming', color: 'text-blue-600', icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 5l7 7-7 7M5 5l7 7-7 7" /></svg>
            )},
            { id: 'recentlyCompleted', title: 'Concluídas', key: 'recentlyCompleted', color: 'text-emerald-600', icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
            )}
          ].map((col) => {
            if (col.id === 'today' && !showToday) return null;
            const category = temporalTasks[col.key];
            const isToday = col.id === 'today';
            const columnBg = isToday ? 'bg-indigo-50/40' : 'bg-gray-50/50';
            const columnBorder = isToday ? 'border-indigo-100' : 'border-gray-100';

            return (
              <div key={col.id} className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className={`flex items-center justify-between border-b ${columnBorder} pb-3 mb-5`}>
                  <div className="flex items-center gap-3">
                    <span className={`${col.color} p-1.5 ${columnBg} rounded-lg border ${columnBorder}`}>
                      {col.icon}
                    </span>
                    <h2 className={`text-base font-black ${col.color} tracking-tight uppercase`}>
                      {col.title}
                    </h2>
                    <span className="text-[10px] font-black text-gray-400 bg-white border border-gray-100 px-2 py-0.5 rounded-full">
                      {category.tasks.length}
                    </span>
                  </div>
                </div>

                <div className={`space-y-4 min-h-[100px] ${col.key === 'recentlyCompleted' ? 'opacity-70' : ''}`}>
                  {category.tasks.length === 0 ? (
                    <div className="px-5 py-10 text-center bg-white/40 border-[1.5px] border-dashed border-gray-200/80 rounded-3xl flex flex-col items-center justify-center transition-all bg-gradient-to-b from-transparent to-gray-50/50 group hover:border-gray-300">
                      {col.key === 'overdue' && (
                        <>
                          <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 mb-4 border border-emerald-100/50 shadow-inner group-hover:scale-110 group-hover:-rotate-6 transition-transform">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          </div>
                          <p className="text-xs font-bold text-gray-500 leading-relaxed">Parabéns! Você não tem pendências atrasadas.</p>
                        </>
                      )}
                      {col.key === 'today' && (
                        <>
                          <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 mb-4 border border-amber-100/50 shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-transform">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                          </div>
                          <p className="text-xs font-bold text-gray-500 leading-relaxed">Tudo limpo por aqui! Que tal um descanso ou uma leitura extra?</p>
                        </>
                      )}
                      {col.key === 'upcoming' && (
                        <>
                          <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-500 mb-4 border border-blue-100/50 shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-transform">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                          </div>
                          <p className="text-xs font-bold text-gray-500 leading-relaxed">Nenhuma tarefa no radar agora. Aproveite!</p>
                        </>
                      )}
                      {col.key === 'recentlyCompleted' && (
                        <>
                          <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-500 mb-4 border border-indigo-100/50 shadow-inner group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                          </div>
                          <p className="text-xs font-bold text-gray-500 leading-relaxed">Sua produtividade está ótima! Continue assim.</p>
                        </>
                      )}
                    </div>
                  ) : (
                    category.tasks.map((task) => (
                      <TaskCardTodoist 
                        key={task.id} 
                        task={task} 
                        subject={getSubjectById(task.subject_id)} 
                        onToggleStatus={toggleTaskStatus} 
                        onEdit={handleEditTask}
                        onDelete={handleSoftDelete}
                        onViewDetails={handleViewDetails}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}
          </div>
        )}
      </div>

      {/* Caixa de Entrada Section - Apenas visualização de Lista */}
      {viewMode === 'list' && temporalTasks.upcoming.tasks.filter(t => !t.data_prevista).length > 0 && (
         <div className="mt-16 pt-10 border-t border-gray-100 animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="flex items-center gap-3 mb-6">
                <span className="text-gray-500 p-2 bg-gray-100 rounded-xl border border-gray-200">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0a2 2 0 01-2 2H6a2 2 0 01-2-2m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
                </span>
                <div>
                  <h2 className="text-2xl font-black text-gray-800 tracking-tight">Caixa de Entrada</h2>
                  <p className="text-sm text-gray-400 font-medium">Tarefas aguardando planejamento.</p>
                </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {temporalTasks.upcoming.tasks.filter(t => !t.data_prevista).map((task) => (
                  <div key={task.id} className="bg-white border border-gray-100 rounded-2xl p-1 shadow-sm hover:shadow-md transition-shadow">
                    <TaskCardTodoist 
                      task={task} 
                      subject={getSubjectById(task.subject_id)} 
                      onToggleStatus={toggleTaskStatus} 
                      onEdit={handleEditTask}
                      onDelete={handleSoftDelete}
                      onViewDetails={handleViewDetails}
                    />
                  </div>
                ))}
            </div>
         </div>
      )}

      {isEditModalOpen && (
        <EditTaskModal 
          task={editingTask} 
          subjects={subjects} 
          onClose={() => setIsEditModalOpen(false)} 
          onSave={handleSaveEdit} 
        />
      )}

      {isDetailsModalOpen && (
        <TaskDetailsModal
          task={detailsTask}
          subject={getSubjectById(detailsTask?.subject_id)}
          onClose={() => { setIsDetailsModalOpen(false); setDetailsTask(null); }}
        />
      )}
    </div>
  );
};

export default Dashboard;
