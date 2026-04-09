import React, { useState, useEffect } from 'react';
import subjectService from '../services/subjectService';
import taskService from '../services/taskService';
import TaskCardTodoist from '../components/TaskCardTodoist';

const CompletedTasksView = () => {
  const [tasks, setTasks] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksData, subjectsData] = await Promise.all([
          taskService.getAll(),
          subjectService.getAll()
        ]);
        setTasks(tasksData.filter(t => t.status === 'concluida'));
        setSubjects(subjectsData);
      } catch (err) {
        console.error('Erro:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleTaskStatus = async (task) => {
    try {
      // Revert para pendente
      const newStatus = 'pendente';
      
      // Update otimista (Some da tela)
      setTasks(prev => prev.filter(t => t.id !== task.id));
      
      await taskService.update(task.id, { status: newStatus });
    } catch (error) {
      console.error('Erro', error);
      // Aqui faria revert no erro mas simplificamos
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center mb-10 border-b border-gray-100 pb-6">
        <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center mr-4">
          <svg className="w-6 h-6 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"></path></svg>
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Histórico de Concluídas</h1>
          <p className="text-gray-500 font-medium mt-1">Veja tudo o que você já terminou.</p>
        </div>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-20 bg-white/50 border border-dashed border-gray-200 rounded-3xl">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path></svg>
          <h3 className="text-lg font-bold text-gray-700">Nada por aqui.</h3>
          <p className="text-gray-500 text-sm mt-1">Nenhuma tarefa concluída no momento.</p>
        </div>
      ) : (
        <div className="flex flex-col space-y-6 max-w-3xl mx-auto">
          {subjects.map(subject => {
            const completedTasks = tasks
              .filter(t => t.subject_id === subject.id)
              .sort((a, b) => (Number(a.priority) || 4) - (Number(b.priority) || 4));
            if (completedTasks.length === 0) return null;

            return (
              <div key={subject.id} className="flex flex-col">
                {/* Section Title (Subject Header) */}
                <div className="flex items-center justify-between pb-1 mb-1 group mt-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[15px] font-bold text-gray-900">{subject.nome}</h3>
                  </div>
                  <span className="text-[11px] font-bold text-gray-400">
                    {completedTasks.length} concluída{completedTasks.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Tasks List */}
                <div className="flex flex-col">
                  {completedTasks.map(task => (
                    <TaskCardTodoist 
                      key={task.id} 
                      task={task} 
                      subject={null} 
                      onToggleStatus={toggleTaskStatus} 
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CompletedTasksView;
