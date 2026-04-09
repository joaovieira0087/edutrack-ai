import React, { useState, useEffect, useCallback } from 'react';
import taskService from '../services/taskService';
import subjectService from '../services/subjectService';
import { useToast } from '../context/ToastContext';

const TrashView = () => {
  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToast } = useToast();

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [trashData, subjectsData] = await Promise.all([
        taskService.getTrash(),
        subjectService.getAll()
      ]);
      setTasks(trashData);
      setSubjects(subjectsData);
    } catch (error) {
      console.error('Erro ao carregar lixeira:', error);
      addToast({ message: 'Erro ao carregar lixeira', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRestore = async (id) => {
    try {
      await taskService.restore(id);
      setTasks(prev => prev.filter(t => t.id !== id));
      addToast({ 
        message: 'Tarefa restaurada com sucesso!', 
        type: 'success' 
      });
    } catch (error) {
      addToast({ message: 'Erro ao restaurar tarefa', type: 'error' });
    }
  };

  const handlePermanentDelete = async (id, titulo) => {
    if (!window.confirm(`Tem certeza que deseja excluir permanentemente a tarefa "${titulo}"? Esta ação não pode ser desfeita.`)) {
      return;
    }

    try {
      await taskService.permanentlyDelete(id);
      setTasks(prev => prev.filter(t => t.id !== id));
      addToast({ 
        message: 'Tarefa removida permanentemente.', 
        type: 'success' 
      });
    } catch (error) {
      addToast({ message: 'Erro ao remover tarefa', type: 'error' });
    }
  };

  const handleRestoreAll = async () => {
    if (tasks.length === 0) return;
    try {
      await taskService.restoreAll();
      setTasks([]);
      addToast({ message: 'Todas as tarefas foram restauradas!', type: 'success' });
    } catch (error) {
      addToast({ message: 'Erro ao restaurar tarefas', type: 'error' });
    }
  };

  const handleEmptyTrash = async () => {
    if (tasks.length === 0) return;
    if (!window.confirm('Tem certeza que deseja esvaziar a lixeira? Todas as tarefas serão removidas permanentemente.')) {
      return;
    }

    try {
      await taskService.emptyTrash();
      setTasks([]);
      addToast({ message: 'Lixeira esvaziada!', type: 'success' });
    } catch (error) {
      addToast({ message: 'Erro ao esvaziar lixeira', type: 'error' });
    }
  };

  const getSubjectName = (id) => {
    const subject = subjects.find(s => s.id === id);
    return subject ? subject.nome : 'Sem disciplina';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Carregando lixeira...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20 px-4 max-w-[1200px] mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight flex items-center gap-4">
            <span className="p-3 bg-red-50 text-red-600 rounded-2xl border border-red-100">
               <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            </span>
            Gestão da Lixeira
          </h1>
          <p className="text-gray-500 mt-2 text-lg">Itens deletados podem ser recuperados ou excluídos permanentemente.</p>
        </div>

        <div className="flex items-center gap-3">
            <button 
                onClick={handleRestoreAll}
                disabled={tasks.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-700 rounded-xl font-bold hover:bg-blue-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Recuperar Tudo
            </button>
            <button 
                onClick={handleEmptyTrash}
                disabled={tasks.length === 0}
                className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                Esvaziar Lixeira
            </button>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-100 rounded-[2.5rem] py-32 flex flex-col items-center justify-center text-center">
          <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mb-6">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
          </div>
          <h3 className="text-2xl font-black text-gray-800 tracking-tight">Lixeira Vazia</h3>
          <p className="text-gray-400 font-medium mt-2">Nenhum item encontrado para exclusão ou recuperação.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map(task => (
            <div key={task.id} className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-100 flex flex-col h-full hover:shadow-md transition-shadow group">
               <div className="flex items-start justify-between mb-4">
                  <div className="p-2 bg-gray-50 text-gray-400 rounded-xl group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </div>
                  <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleRestore(task.id)}
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                        title="Restaurar"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      </button>
                      <button 
                        onClick={() => handlePermanentDelete(task.id, task.titulo)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Excluir Permanentemente"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                  </div>
               </div>

               <h3 className="text-xl font-bold text-gray-800 line-clamp-2 mb-2 group-hover:text-red-700 transition-colors">{task.titulo}</h3>
               <div className="mt-auto pt-6 border-t border-gray-50 flex items-center justify-between">
                  <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{getSubjectName(task.subject_id)}</span>
                  <span className="text-xs font-bold text-gray-300 italic">Deletado em {new Date(task.updatedAt).toLocaleDateString('pt-BR')}</span>
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TrashView;
