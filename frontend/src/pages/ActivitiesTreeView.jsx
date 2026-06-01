import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import subjectService from '../services/subjectService';
import taskService from '../services/taskService';
import EditSubjectModal from '../components/EditSubjectModal';
import CreateTaskModal from '../components/CreateTaskModal';

const ActivitiesTreeView = () => {
  const navigate = useNavigate();
  const [subjects, setSubjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Modals / State for Actions
  const [editingSubject, setEditingSubject] = useState(null);
  
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);

  // Fetch subjects and tasks concurrently
  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const [subjectsData, tasksData] = await Promise.all([
        subjectService.getAll(),
        taskService.getAll()
      ]);
      setSubjects(subjectsData);
      setTasks(tasksData);
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar as atividades. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreateTask = (subjectId) => {
    setSelectedSubjectId(subjectId);
    setIsCreateModalOpen(true);
  };

  const handleSaveTask = () => {
    loadData(); // Reload all data to reflect the new task
  };

  const handleEditSubject = (subject) => {
    setEditingSubject(subject);
  };

  const handleSaveSubject = () => {
    setEditingSubject(null);
    loadData(); // Reload all subjects/tasks
  };

  const handleDeleteSubject = async (subject) => {
    const confirmDelete = window.confirm(`Tem certeza que deseja excluir a disciplina "${subject.nome}" e TODAS as suas tarefas associadas? Esta ação é irreversível.`);
    if (!confirmDelete) return;

    try {
      setLoading(true);
      await subjectService.delete(subject.id || subject._id);
      loadData();
    } catch (err) {
      console.error(err);
      setError('Erro ao excluir a disciplina.');
      setLoading(false);
    }
  };

  // Status mapping to label and classes
  const statusConfig = {
    pendente: {
      label: 'Pendente',
      dotClass: 'bg-slate-400 dark:bg-slate-500',
      badgeClass: 'bg-slate-50 text-slate-600 dark:bg-slate-900/40 dark:text-slate-400 border-slate-100 dark:border-slate-800'
    },
    em_andamento: {
      label: 'Em Andamento',
      dotClass: 'bg-blue-500 dark:bg-blue-400',
      badgeClass: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 border-blue-100/50 dark:border-blue-800/30'
    },
    atrasada: {
      label: 'Atrasada',
      dotClass: 'bg-red-500 dark:bg-red-400',
      badgeClass: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400 border-red-100/50 dark:border-red-800/30'
    },
    bloqueada: {
      label: 'Bloqueada',
      dotClass: 'bg-purple-500 dark:bg-purple-400',
      badgeClass: 'bg-purple-50 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400 border-purple-100/50 dark:border-purple-800/30'
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-500 dark:text-slate-400 font-medium">Carregando atividades estruturadas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50 rounded-2xl p-6 text-center max-w-lg mx-auto my-8">
        <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-red-800 dark:text-red-300 font-bold mb-4">{error}</p>
        <button onClick={loadData} className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold shadow-md hover:bg-red-700 transition-colors">
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header da Página */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Minhas Atividades</h1>
          <p className="text-gray-500 dark:text-slate-400 mt-2 text-lg">Visão estruturada de tarefas pendentes e em andamento por disciplina.</p>
        </div>
      </div>

      {subjects.length === 0 ? (
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-gray-100 dark:border-slate-800 shadow-sm rounded-3xl p-10 text-center max-w-xl mx-auto">
          <svg className="w-16 h-16 text-gray-300 dark:text-slate-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
          <h3 className="text-lg font-bold text-gray-800 dark:text-slate-200">Nenhuma disciplina cadastrada</h3>
          <p className="text-gray-500 dark:text-slate-400 mt-1 mb-6 text-sm">Você precisa cadastrar uma disciplina antes de gerenciar suas atividades estruturadas.</p>
          <button onClick={() => navigate('/disciplinas/nova')} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-md">
            + Cadastrar Disciplina
          </button>
        </div>
      ) : (
        /* Grid das Disciplinas */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map(subject => {
            // Filter tasks matching this subject and not completed/deleted
            const subjectTasks = tasks.filter(t => 
              t.subject_id === (subject.id || subject._id) && 
              t.status !== 'concluida' && 
              !t.is_deleted
            );

            return (
              <div 
                key={subject.id || subject._id} 
                className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border border-gray-100 dark:border-slate-800/80 shadow-[0_8px_30px_rgb(0,0,0,0.02)] rounded-3xl p-6 flex flex-col justify-between hover:shadow-md transition-all duration-300 relative overflow-hidden"
              >
                <div>
                  {/* Cabeçalho da Disciplina com Controles à direita */}
                  <div className="flex justify-between items-start border-b border-gray-50 dark:border-slate-800/50 pb-4 mb-4">
                    <div className="min-w-0 flex-1 pr-2">
                      <h2 className="text-lg font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wide truncate">
                        {subject.nome}
                      </h2>
                      {subject.professor && (
                        <p className="text-xs text-gray-400 dark:text-slate-500 mt-0.5 truncate">Prof. {subject.professor}</p>
                      )}
                    </div>
                    
                    {/* Botões de Gestão da Disciplina */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Badge Contagem */}
                      <span className="text-[10px] font-black bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-md border border-blue-100/50 dark:border-blue-800/20 mr-1">
                        {subjectTasks.length}
                      </span>
                      
                      {/* Editar */}
                      <button 
                        onClick={() => handleEditSubject(subject)}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-slate-900 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg transition-colors cursor-pointer"
                        title="Editar Disciplina"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </button>

                      {/* Apagar */}
                      <button 
                        onClick={() => handleDeleteSubject(subject)}
                        className="p-1 hover:bg-red-50 dark:hover:bg-red-950/30 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg transition-colors cursor-pointer"
                        title="Excluir Disciplina"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Lista de Tarefas Aninhadas */}
                  {subjectTasks.length === 0 ? (
                    <div className="py-6 text-center text-gray-400 dark:text-slate-500 text-sm italic font-medium">
                      Sem atividades pendentes.
                    </div>
                  ) : (
                    <div className="space-y-3 mb-6 pl-2">
                      {subjectTasks.map(task => {
                        const config = statusConfig[task.status] || statusConfig.pendente;
                        return (
                          <div 
                            key={task.id || task._id} 
                            onClick={() => navigate(`/tasks/${task.id || task._id}`)}
                            className="flex items-start justify-between gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-900/50 transition-colors cursor-pointer group animate-in fade-in duration-200"
                          >
                            <div className="flex items-start gap-2.5 overflow-hidden">
                              {/* Status Dot */}
                              <span className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${config.dotClass}`} />
                              <div className="overflow-hidden">
                                <p className="text-sm font-bold text-gray-700 dark:text-slate-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                                  {task.titulo}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500">
                                    {config.label}
                                  </span>
                                  {task.tempo_estimado > 0 && (
                                    <>
                                      <span className="text-[10px] text-gray-300 dark:text-slate-600">•</span>
                                      <span className="text-[10px] font-medium text-gray-400 dark:text-slate-500">
                                        {task.tempo_estimado} min
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Botão de Criação Rápida */}
                <div className="mt-4 pt-4 border-t border-gray-50 dark:border-slate-800/40">
                  <button
                    type="button"
                    onClick={() => handleOpenCreateTask(subject.id || subject._id)}
                    className="w-full py-2.5 border border-dashed border-gray-200 dark:border-slate-800 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50/20 dark:hover:bg-blue-900/10 text-gray-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                    </svg>
                    Criar Atividade em {subject.nome}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Criação Completa de Tarefas (Locked Subject) */}
      <CreateTaskModal
        isOpen={isCreateModalOpen}
        onClose={() => { setIsCreateModalOpen(false); setSelectedSubjectId(null); }}
        onSave={handleSaveTask}
        initialSubjectId={selectedSubjectId}
      />

      {/* Modal de Edição de Disciplina */}
      {editingSubject && (
        <EditSubjectModal
          subject={editingSubject}
          onClose={() => setEditingSubject(null)}
          onSave={handleSaveSubject}
        />
      )}
    </div>
  );
};

export default ActivitiesTreeView;
