import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import subjectService from '../services/subjectService';
import taskService from '../services/taskService';
import analyticsService from '../services/analyticsService';
import TaskCardTodoist from '../components/TaskCardTodoist';
import EditTaskModal from '../components/EditTaskModal';
import TaskDetailsModal from '../components/TaskDetailsModal';
import CalendarGrid from '../components/CalendarGrid';
import KanbanView from '../components/KanbanView';
import { useToast } from '../context/ToastContext';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip, Legend 
} from 'recharts';

const Dashboard = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsTask, setDetailsTask] = useState(null);
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('edutrack_view_mode') || 'kanban');
  const [analytics, setAnalytics] = useState(null);
  const [advancedAnalytics, setAdvancedAnalytics] = useState(null);
  const [refreshInsightsTrigger, setRefreshInsightsTrigger] = useState(0);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [completedTaskData, setCompletedTaskData] = useState(null);
  const { addToast } = useToast();

  useEffect(() => {
    localStorage.setItem('edutrack_view_mode', viewMode);
  }, [viewMode]);

  const fetchData = useCallback(async () => {
    try {
      // Sincronizar status antes de buscar dados
      await taskService.syncStatuses().catch(() => {});

      const [subjectsData, tasksData, analyticsData, advancedData] = await Promise.all([
        subjectService.getAll(),
        taskService.getAll(),
        subjectService.getAnalytics().catch(() => null),
        analyticsService.getAdvancedAnalytics().catch(() => null),
      ]);
      setSubjects(subjectsData);
      setTasks(tasksData);
      if (analyticsData) setAnalytics(analyticsData);
      if (advancedData) setAdvancedAnalytics(advancedData);
    } catch (err) {
      console.error('Erro ao carregar dados do dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    window.addEventListener('tasks-updated', fetchData);
    return () => {
      window.removeEventListener('tasks-updated', fetchData);
    };
  }, [fetchData]);

  /**
   * Toggle inteligente de status:
   *  pendente → em_andamento → concluida
   *  atrasada → em_andamento → concluida
   *  concluida → pendente (reabrir)
   *  bloqueada → sem ação (bloqueada)
   */
  const toggleTaskStatus = async (task) => {
    if (task.status === 'bloqueada') {
      addToast({ message: 'Esta tarefa está bloqueada por dependências.', type: 'error', duration: 3000 });
      return;
    }

    let newStatus;
    switch (task.status) {
      case 'concluida':
        newStatus = 'pendente';
        break;
      case 'pendente':
      case 'atrasada':
        newStatus = 'em_andamento';
        break;
      case 'em_andamento':
        newStatus = 'concluida';
        break;
      default:
        newStatus = 'pendente';
    }

    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    
    try {
      const response = await taskService.update(task.id, { status: newStatus });
      if (response && response.unblockedTasks && response.unblockedTasks.length > 0) {
        const unblockedNames = response.unblockedTasks.map(t => t.titulo).join(', ');
        addToast({ message: `🔓 Tarefas desbloqueadas: ${unblockedNames}`, type: 'success', duration: 6000 });
      }
      if (newStatus === 'concluida') {
        setRefreshInsightsTrigger(prev => prev + 1);
        setCompletedTaskData(task);
        setIsSuccessModalOpen(true);
      }
      fetchData();
    } catch (error) {
      console.error('Erro ao atualizar status da tarefa:', error);
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t));
      addToast({ message: error.response?.data?.message || 'Erro ao atualizar status.', type: 'error', duration: 3000 });
    }
  };

  const handleMoveTask = async (task, newStatus) => {
    if (task.status === newStatus) return;
    
    // Prevent invalid transition explicitly in UI although backend blocks it
    if (task.status === 'bloqueada' && (newStatus === 'em_andamento' || newStatus === 'concluida')) {
      addToast({ message: 'Resolva as dependências primeiro.', type: 'error', duration: 4000 });
      return;
    }

    // Optimistic Update
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));

    try {
      const response = await taskService.update(task.id, { status: newStatus });
      if (response && response.unblockedTasks && response.unblockedTasks.length > 0) {
        const unblockedNames = response.unblockedTasks.map(t => t.titulo).join(', ');
        addToast({ message: `🔓 Tarefas desbloqueadas: ${unblockedNames}`, type: 'success', duration: 6000 });
      }

      if (newStatus === 'concluida') {
        setRefreshInsightsTrigger(prev => prev + 1);
        setCompletedTaskData(task);
        setIsSuccessModalOpen(true);
      }
      fetchData();
    } catch (error) {
      console.error('Erro ao mover tarefa:', error);
      // Revert Optimistic Update
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: task.status } : t));
      addToast({ message: error.response?.data?.message || 'Erro ao mover tarefa.', type: 'error', duration: 3000 });
    }
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = () => {
    setRefreshInsightsTrigger(prev => prev + 1);
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
      if (activeFilter === 'pendente' || activeFilter === 'em_andamento' || activeFilter === 'concluida' || activeFilter === 'atrasada') {
        if (activeFilter === 'pendente' && task.status === 'em_andamento') {
          // Permite que "pendente" mostre "em_andamento" também
        } else if (task.status !== activeFilter) {
          return false;
        }
      } else if (activeFilter === 'high_priority') {
        if (Number(task.priority) !== 1) return false;
      } else if (activeFilter === 'due_today') {
        if (!task.data_prevista) return false;
        
        const taskDate = new Date(task.data_prevista + 'T00:00:00');
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (taskDate.getTime() !== today.getTime()) return false;
      } else if (activeFilter === 'no_subject') {
        if (task.subject_id) return false;
      } else if (activeFilter === 'blocked') {
        if (task.status !== 'bloqueada') return false;
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
      blocked: { title: 'Bloqueadas', icon: 'lock', color: 'text-gray-500', tasks: [] },
      recentlyCompleted: { title: 'Concluídas Recentemente', icon: 'check-circle', color: 'text-emerald-600', tasks: [] }
    };

    filteredTasks.forEach(task => {
      // Bloqueadas vão para coluna própria
      if (task.status === 'bloqueada') {
        categories.blocked.tasks.push(task);
        return;
      }

      if (task.status === 'concluida') {
        const updateDate = new Date(task.updatedAt || task.createdAt);
        updateDate.setHours(0, 0, 0, 0);
        if (updateDate.getTime() === today.getTime()) {
          categories.recentlyCompleted.tasks.push(task);
        }
        return;
      }

      // Status atrasada é determinado pelo backend
      if (task.status === 'atrasada') {
        categories.overdue.tasks.push(task);
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

  // Use weighted progress from analytics if available, else fallback to flat calculation
  const overallProgress = analytics?.global?.progress ?? (totalTasksCount === 0 ? 0 : Math.round((tasks.filter(t => t.status === 'concluida').length / totalTasksCount) * 100));

  const colorMap = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-500', hoverText: 'group-hover:text-blue-600' },
    indigo: { bg: 'bg-indigo-50', text: 'text-indigo-500', hoverText: 'group-hover:text-indigo-600' },
    red: { bg: 'bg-red-50', text: 'text-red-500', hoverText: 'group-hover:text-red-600' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-500', hoverText: 'group-hover:text-emerald-600' },
  };

  const showToday = temporalTasks.today.tasks.length > 0;
  const showBlocked = temporalTasks.blocked.tasks.length > 0;

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
    <div className="flex flex-col gap-8 pb-20 px-4 max-w-[1600px] mx-auto min-h-screen">
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
              <h3 className={`text-3xl font-black mt-2 text-gray-800 ${colorMap[card.color].hoverText} transition-colors`}>{card.value}</h3>
            </div>
            <div className={`w-14 h-14 rounded-2xl ${colorMap[card.color].bg} flex items-center justify-center ${colorMap[card.color].text} shadow-inner`}>
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={card.iconPath}></path></svg>
            </div>
          </Link>
        ))}
      </div>

      {/* Weighted Progress Bar */}
      {analytics?.global && (
        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-gray-100 shadow-[0_4px_24px_rgb(0,0,0,0.03)] animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <span className="text-indigo-500 p-2 bg-indigo-50 rounded-xl border border-indigo-100">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3"></path></svg>
              </span>
              <div>
                <h3 className="text-sm font-black text-gray-800 uppercase tracking-wide">Progresso Ponderado Global</h3>
                <p className="text-[10px] text-gray-400 font-medium">Calculado com base no peso de cada tarefa</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-indigo-600">{analytics.global.progress}%</span>
              <p className="text-[10px] text-gray-400 font-bold">{analytics.global.weightedCompleted}/{analytics.global.weightedTotal} pts</p>
            </div>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden shadow-inner">
            <div 
              className="bg-gradient-to-r from-indigo-500 via-blue-500 to-emerald-500 h-full rounded-full transition-all duration-1000 ease-out" 
              style={{ width: `${analytics.global.progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Main Task Area with Integrated Search & Filters */}
      <div className="flex flex-col gap-6 relative z-0 w-full">
        {/* Row 1: Title and Statistics (Estatísticas) */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 w-full bg-transparent">
          <h2 className="text-2xl font-black text-gray-800 tracking-tight flex items-center gap-3 shrink-0">
             <span className="w-2 h-8 bg-blue-600 rounded-full"></span>
             {viewMode === 'calendar' ? 'Calendário de Prazos' : 'Gestão de Atividades'}
          </h2>
          
          {/* Estatísticas de Tarefas */}
          <div className="flex flex-row flex-wrap items-center justify-start lg:justify-end gap-2 flex-1 overflow-x-auto pb-2 lg:pb-0 hide-scrollbar">
            {[
              { id: 'all', label: 'Todas', count: totalTasksCount, color: 'text-gray-600', activeClass: 'bg-gray-800 text-white border-gray-900 shadow-sm' },
              { id: 'atrasada', label: 'Atrasadas', count: tasks.filter(t => t.status === 'atrasada').length, color: 'text-red-600', activeClass: 'bg-red-100 text-red-700 shadow-sm border-red-200' },
              { id: 'pendente', label: 'Próximas', count: tasks.filter(t => t.status === 'pendente' || t.status === 'em_andamento').length, color: 'text-blue-600', activeClass: 'bg-blue-100 text-blue-700 shadow-sm border-blue-200' },
              { id: 'concluida', label: 'Concluídas', count: tasks.filter(t => t.status === 'concluida').length, color: 'text-emerald-600', activeClass: 'bg-emerald-100 text-emerald-700 shadow-sm border-emerald-200' },
            ].map(filter => (
              <button
                key={filter.id}
                onClick={() => setActiveFilter(filter.id)}
                className={`whitespace-nowrap px-4 py-2 rounded-xl text-[11px] uppercase tracking-wider font-bold transition-all duration-300 border flex items-center gap-2 ${
                  activeFilter === filter.id || (filter.id === 'pendente' && (activeFilter === 'pendente' || activeFilter === 'em_andamento'))
                    ? filter.activeClass + ' scale-[1.02]'
                    : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700 dark:hover:bg-gray-700'
                }`}
              >
                <span>{filter.label}</span>
                <span className={`px-2 py-0.5 rounded-md bg-white/80 dark:bg-gray-900/50 shadow-sm border border-gray-100/50 ${activeFilter === filter.id ? '' : filter.color}`}>
                  {filter.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Row 1.5: Botão Adicionar Tarefa */}
        <div className="flex justify-start w-full mt-2 lg:mt-4 mb-4">
          <Link to="/tarefas/nova" className="text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2 px-6 py-3 rounded-xl transition-all shadow-md hover:shadow-lg active:scale-95 z-20">
             <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
             Adicionar Tarefa
          </Link>
        </div>

        {/* Row 2: Search and View Mode Switcher */}
        <div className="flex flex-col md:flex-row gap-5 justify-between items-center bg-white/80 backdrop-blur-md p-3 rounded-2xl border border-gray-100 shadow-[0_4px_24px_rgb(0,0,0,0.03)] w-full">
          {/* Search Input */}
          <div className="relative w-full group flex-1">
            <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <input
              type="text"
              className="w-full bg-transparent border-0 text-gray-900 text-sm font-medium rounded-2xl focus:ring-0 block pl-11 p-3 transition-all placeholder-gray-400 outline-none"
              placeholder="Buscar títulos, tags ou disciplinas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="hidden md:block w-px h-8 bg-gray-200"></div>
          
          {/* View Mode Switcher */}
          <div className="flex bg-gray-100/80 p-1 rounded-xl shadow-inner border border-gray-200/50 w-full md:w-auto justify-center">
            <button 
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg flex items-center justify-center transition-all ${viewMode === 'list' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
              title="Visualização em Lista"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16"></path></svg>
            </button>
            <button 
              onClick={() => setViewMode('calendar')}
              className={`p-2 rounded-lg flex items-center justify-center transition-all ${viewMode === 'calendar' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
              title="Visualização em Calendário"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
            </button>
            <button 
              onClick={() => setViewMode('kanban')}
              className={`p-2 rounded-lg flex items-center justify-center transition-all ${viewMode === 'kanban' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-600 dark:text-blue-400' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'}`}
              title="Visualização em Kanban"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"></path></svg>
            </button>
          </div>
        </div>

        {filteredTasks.length === 0 && (searchTerm !== '' || activeFilter !== 'all') ? (
          <div className="py-24 text-center bg-white/50 dark:bg-gray-800/20 rounded-3xl border border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-500 shadow-sm relative overflow-hidden">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-50/50 dark:from-blue-900/10 via-transparent to-transparent"></div>
            <div className="w-20 h-20 bg-white dark:bg-gray-800 rounded-3xl shadow-sm flex items-center justify-center text-blue-500 mb-6 border border-gray-100 dark:border-gray-700 rotate-3 hover:rotate-0 hover:scale-105 transition-all">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
            </div>
            <h3 className="text-2xl font-black text-gray-800 dark:text-gray-100 mb-3 relative z-10">Nenhum resultado</h3>
            {searchTerm ? (
              <p className="text-base font-medium text-gray-500 mb-8 relative z-10">Nenhuma tarefa encontrada para "<span className="font-bold text-gray-700">{searchTerm}</span>"</p>
            ) : (
               <p className="text-base font-medium text-gray-500 mb-8 relative z-10">Nenhuma tarefa corresponde ao filtro selecionado.</p>
            )}
            <button 
              onClick={() => { setSearchTerm(''); setActiveFilter('all'); }} 
              className="relative z-10 px-6 py-3 bg-white dark:bg-gray-800 text-sm font-bold text-blue-600 dark:text-blue-400 border-2 border-blue-100 dark:border-blue-900/50 rounded-2xl hover:bg-blue-50 dark:hover:bg-gray-700 hover:border-blue-200 transition-all shadow-sm active:scale-95"
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
        ) : viewMode === 'kanban' ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <KanbanView 
              tasks={filteredTasks}
              subjects={subjects}
              onTaskMove={handleMoveTask}
              onEdit={handleEditTask}
              onDelete={handleSoftDelete}
            />
          </div>
        ) : (
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${showToday && showBlocked ? 'lg:grid-cols-5' : showToday || showBlocked ? 'lg:grid-cols-4' : 'lg:grid-cols-3'} gap-8 items-start`}>
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
            { id: 'blocked', title: 'Bloqueadas', key: 'blocked', color: 'text-gray-500', icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            )},
            { id: 'recentlyCompleted', title: 'Concluídas', key: 'recentlyCompleted', color: 'text-emerald-600', icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
            )}
          ].map((col) => {
            if (col.id === 'today' && !showToday) return null;
            if (col.id === 'blocked' && !showBlocked) return null;
            const category = temporalTasks[col.key];
            const isToday = col.id === 'today';
            const isBlocked = col.id === 'blocked';
            const columnBg = isToday ? 'bg-indigo-50/40' : isBlocked ? 'bg-gray-50/60' : 'bg-gray-50/50';
            const columnBorder = isToday ? 'border-indigo-100' : isBlocked ? 'border-gray-200' : 'border-gray-100';

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
                    <span className="text-[10px] font-black text-gray-400 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 px-2 py-0.5 rounded-full">
                      {category.tasks.length}
                    </span>
                  </div>
                </div>

                <div className={`space-y-4 min-h-[100px] ${col.key === 'recentlyCompleted' ? 'opacity-70' : ''}`}>
                  {category.tasks.length === 0 ? (
                    <div className="px-5 py-10 text-center bg-white/40 dark:bg-gray-800/20 border-[1.5px] border-dashed border-gray-200/80 dark:border-gray-700 rounded-3xl flex flex-col items-center justify-center transition-all bg-gradient-to-b from-transparent to-gray-50/50 dark:to-transparent group hover:border-gray-300 dark:hover:border-gray-600">
                      {col.key === 'overdue' && (
                        <>
                          <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 mb-4 border border-emerald-100/50 dark:border-emerald-500/20 shadow-inner group-hover:scale-110 group-hover:-rotate-6 transition-transform">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                          </div>
                          <p className="text-xs font-bold text-gray-500 dark:text-gray-300 leading-relaxed">Parabéns! Você não tem pendências atrasadas.</p>
                        </>
                      )}
                      {col.key === 'today' && (
                        <>
                          <div className="w-12 h-12 bg-amber-50 dark:bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 mb-4 border border-amber-100/50 dark:border-amber-500/20 shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-transform">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                          </div>
                          <p className="text-xs font-bold text-gray-500 dark:text-gray-300 leading-relaxed">Tudo limpo por aqui! Que tal um descanso ou uma leitura extra?</p>
                        </>
                      )}
                      {col.key === 'upcoming' && (
                        <>
                          <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-500 mb-4 border border-blue-100/50 dark:border-blue-800/50 shadow-inner group-hover:scale-110 group-hover:rotate-6 transition-transform">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                          </div>
                          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 leading-relaxed">Nenhuma tarefa no radar agora. Aproveite!</p>
                        </>
                      )}
                      {col.key === 'blocked' && (
                        <>
                          <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center text-gray-400 mb-4 border border-gray-200/50 dark:border-gray-700 shadow-inner group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"></path></svg>
                          </div>
                          <p className="text-xs font-bold text-gray-500 dark:text-gray-400 leading-relaxed">Sem tarefas bloqueadas. Fluxo livre!</p>
                        </>
                      )}
                      {col.key === 'recentlyCompleted' && (
                        <>
                          <div className="w-12 h-12 bg-indigo-50 dark:bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-500 mb-4 border border-indigo-100/50 dark:border-indigo-500/20 shadow-inner group-hover:scale-110 transition-transform">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"></path></svg>
                          </div>
                          <p className="text-xs font-bold text-gray-500 dark:text-gray-300 leading-relaxed">Sua produtividade está ótima! Continue assim.</p>
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
         <div className="pt-10 border-t border-gray-100 animate-in fade-in slide-in-from-bottom-6 duration-700">
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

      {/* Modal de Celebração de Conclusão */}
      {isSuccessModalOpen && completedTaskData && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-3xl border border-gray-100 p-8 shadow-2xl max-w-md w-full text-center relative overflow-hidden animate-in zoom-in-95 duration-300">
            {/* Elemento de background sutil */}
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-500"></div>
            
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-6 border border-emerald-100 shadow-inner">
              <svg className="w-10 h-10 text-emerald-500 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            
            <h3 className="text-2xl font-black text-gray-800 mb-3">Excelente Trabalho! 🎉</h3>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Você concluiu a tarefa <strong className="text-gray-900 font-bold">"{completedTaskData.titulo}"</strong>!<br />
              Quer ver como foi o seu desempenho em comparação com o seu planejamento?
            </p>
            
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  navigate(`/ai-insights?taskId=${completedTaskData.id || completedTaskData._id}`);
                }}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-2xl transition-all shadow-md hover:shadow-lg active:scale-[0.98]"
              >
                Ver Desempenho
              </button>
              <button
                onClick={() => {
                  setIsSuccessModalOpen(false);
                  setCompletedTaskData(null);
                }}
                className="w-full py-4 bg-gray-50 hover:bg-gray-100 text-gray-500 font-bold text-sm rounded-2xl transition-all active:scale-[0.98]"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {isEditModalOpen && (
        <EditTaskModal 
          task={editingTask} 
          subjects={subjects} 
          allTasks={tasks}
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
