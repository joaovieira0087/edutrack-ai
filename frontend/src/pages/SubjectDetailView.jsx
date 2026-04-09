import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import subjectService from '../services/subjectService';
import taskService from '../services/taskService';

const SubjectDetailView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const subjectId = parseInt(id, 10);
  const [subject, setSubject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [subjectData, allTasks] = await Promise.all([
          subjectService.getById(subjectId),
          taskService.getAll()
        ]);
        setSubject(subjectData);
        setTasks(allTasks.filter(t => t.subject_id === subjectId));
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    fetchData();
  }, [subjectId]);

  const completedTasks = tasks.filter(t => t.status === 'concluida').length;
  const progress = tasks.length === 0 ? 0 : Math.round((completedTasks / tasks.length) * 100);

  if (loading) return <div className="flex items-center justify-center py-32"><div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div></div>;
  if (!subject) return <div className="text-center py-20"><h2 className="text-2xl font-bold text-gray-700">Disciplina não encontrada.</h2><button onClick={() => navigate(-1)} className="mt-4 px-6 py-2 bg-blue-100 text-blue-700 rounded-xl font-medium">Voltar</button></div>;

  return (
    <div className="space-y-8">
      <button onClick={() => navigate(-1)} className="flex items-center text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors group cursor-pointer">
        <div className="bg-white border border-gray-200 shadow-sm w-8 h-8 rounded-full flex items-center justify-center mr-3 group-hover:border-blue-300 group-hover:-translate-x-1 transition-all">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
        </div>
        Voltar para disciplinas
      </button>

      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-bl from-blue-50 to-transparent rounded-bl-full -z-10 opacity-70"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-100 mb-4">Módulo &bull; ID: {subject.id}</span>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">{subject.nome}</h1>
            <p className="text-gray-500 mt-2 text-lg font-medium">{subject.professor}</p>
          </div>
          <div className="bg-gray-50/80 px-6 py-4 rounded-2xl border border-gray-100 shadow-sm text-center min-w-[160px]">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Carga Horária</p>
            <p className="text-2xl font-black text-gray-800">{subject.carga_horaria}<span className="text-base text-gray-500 ml-1">h</span></p>
          </div>
        </div>
        <div className="mt-8 pt-8 border-t border-gray-100 flex flex-col lg:flex-row gap-10">
          <div className="flex-1">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3">Programa</h3>
            <p className="text-gray-600 leading-relaxed">{subject.descricao}</p>
            <div className="mt-6 flex flex-wrap gap-6 text-sm font-medium text-gray-500">
              <span className="flex items-center"><svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>Início: {subject.data_inicio}</span>
              <span className="flex items-center"><svg className="w-5 h-5 mr-2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>Fim: {subject.data_fim}</span>
            </div>
          </div>
          <div className="w-full lg:w-72 bg-gradient-to-br from-gray-50 to-white p-5 rounded-2xl border border-gray-100 shadow-sm">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Progresso</h3>
            <div className="flex items-end justify-between font-bold mb-2"><span className="text-3xl text-blue-600">{progress}%</span><span className="text-sm text-gray-400 mb-1">{completedTasks}/{tasks.length}</span></div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner"><div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-full rounded-full transition-all duration-1000" style={{ width: `${progress}%` }}></div></div>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <span className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mr-3 border border-indigo-100"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"/></svg></span>
          Tarefas
        </h2>
        {tasks.length > 0 ? (
          <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead><tr className="bg-gray-50/50 border-b border-gray-100 text-xs uppercase tracking-widest text-gray-400 font-bold"><th className="px-6 py-4">Título</th><th className="px-6 py-4">Data</th><th className="px-6 py-4">Status</th></tr></thead>
              <tbody className="divide-y divide-gray-50 text-sm font-medium">
                {tasks.map(task => (
                  <tr key={task.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="px-6 py-5"><div className="text-gray-900 font-bold">{task.titulo}</div><div className="text-gray-500 font-normal mt-1">{task.descricao}</div></td>
                    <td className="px-6 py-5 text-gray-500">{task.data_prevista}</td>
                    <td className="px-6 py-5"><span className={`px-4 py-1.5 rounded-full text-xs font-bold border ${task.status === 'concluida' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : task.status === 'em andamento' ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-gray-50 text-gray-500 border-gray-200'}`}>{task.status === 'concluida' ? 'Concluída' : task.status === 'em andamento' ? 'Em Andamento' : 'Pendente'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center shadow-sm">
            <h3 className="text-lg font-bold text-gray-700">Nenhuma tarefa</h3>
            <p className="text-gray-500 mt-1">Este módulo não possui tarefas cadastradas.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubjectDetailView;
