import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import taskService from '../services/taskService';
import subjectService from '../services/subjectService';

const priorityConfig = {
  1: { label: 'P1 — Crítica', color: '#de4c4a', fill: 'currentColor', strokeW: '0' },
  2: { label: 'P2 — Alta', color: '#f49c18', fill: 'currentColor', strokeW: '0' },
  3: { label: 'P3 — Média', color: '#4073ff', fill: 'currentColor', strokeW: '0' },
  4: { label: 'P4 — Baixa', color: '#808080', fill: 'none', strokeW: '2.5' },
};

const statusLabels = {
  pendente: { text: 'Pendente', bg: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30' },
  em_andamento: { text: 'Em Andamento', bg: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30' },
  concluida: { text: 'Concluída', bg: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30' },
  atrasada: { text: 'Atrasada', bg: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30' },
  bloqueada: { text: 'Bloqueada', bg: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/20 dark:text-purple-400 dark:border-purple-900/30' }
};

const formatTimestamp = (ts) => {
  const date = new Date(ts);
  if (isNaN(date.getTime())) return ts;
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const formatDateDisplay = (dateString) => {
  if (!dateString) return 'Sem data definida';
  const dateObj = new Date(dateString + 'T00:00:00');
  if (isNaN(dateObj.getTime())) return dateString;
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }).format(dateObj);
};

const TaskDetailsView = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState(null);
  const [subject, setSubject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadFreshData = async () => {
    try {
      setLoading(true);
      setError('');
      const taskData = await taskService.getById(id);
      setTask(taskData);
      
      if (taskData.subject_id) {
        try {
          const subjData = await subjectService.getById(taskData.subject_id);
          setSubject(subjData);
        } catch (sErr) {
          console.error('Erro ao buscar disciplina:', sErr);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Erro ao carregar detalhes da atividade.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFreshData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-500 dark:text-slate-400 font-medium">Carregando detalhes da atividade...</p>
      </div>
    );
  }

  if (error || !task) {
    return (
      <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50 rounded-2xl p-6 text-center max-w-lg mx-auto my-8">
        <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-red-800 dark:text-red-300 font-bold mb-4">{error || 'Atividade não encontrada'}</p>
        <button onClick={() => navigate(-1)} className="px-4 py-2 bg-red-600 text-white rounded-xl font-bold shadow-md hover:bg-red-700 transition-colors">
          Voltar
        </button>
      </div>
    );
  }

  const p = Number(task.priority) || 4;
  const pConfig = priorityConfig[p];
  const sConfig = statusLabels[task.status] || statusLabels.pendente;
  const peso = Number(task.peso) || 1;

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      {/* Botão de Voltar */}
      <button onClick={() => navigate(-1)} className="flex items-center text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors group cursor-pointer">
        <div className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 shadow-sm w-8 h-8 rounded-full flex items-center justify-center mr-3 group-hover:border-blue-300 group-hover:-translate-x-1 transition-all">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/>
          </svg>
        </div>
        Voltar
      </button>

      {/* Card Principal - Detalhes da Atividade */}
      <div className="bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl rounded-[2.5rem] p-8 sm:p-10 border border-gray-100 dark:border-slate-900/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-bl from-blue-50/30 to-transparent rounded-bl-full -z-10 opacity-70"></div>
        
        {/* Cabeçalho */}
        <div className="border-b border-gray-50 dark:border-slate-900/60 pb-6 mb-6">
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 shrink-0"
                viewBox="0 0 24 24"
                style={{ color: pConfig.color }}
                fill={pConfig.fill}
                stroke="currentColor"
                strokeWidth={pConfig.strokeW}
              >
                <path d="M4 2v20M4 4l16 5-16 5V4z" />
              </svg>
              <span className="text-xs font-black uppercase tracking-widest" style={{ color: pConfig.color }}>
                {pConfig.label}
              </span>
            </div>
            <span className="text-gray-300 dark:text-slate-800">|</span>
            <span className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-bold border ${sConfig.bg}`}>
              {sConfig.text}
            </span>
          </div>

          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight mb-2">
            {task.titulo}
          </h1>

          <p className="text-sm text-gray-500 dark:text-slate-400">
            Disciplina: <span className="font-bold text-gray-700 dark:text-slate-300">{subject ? subject.nome : 'Nenhuma'}</span>
          </p>
        </div>

        {/* Grid de Conteúdo */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Coluna da Esquerda: Descrição */}
          <div className="lg:col-span-2 space-y-6">
            <div>
              <h3 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest block mb-2">
                Descrição Completa
              </h3>
              <div className="bg-gray-50/50 dark:bg-slate-900/30 rounded-2xl p-5 border border-gray-100 dark:border-slate-900 leading-relaxed whitespace-pre-wrap text-sm text-gray-700 dark:text-slate-300">
                {task.descricao || <span className="italic text-gray-400">Sem descrição fornecida para esta tarefa.</span>}
              </div>
            </div>

            {/* Anexos */}
            {task.attachments && task.attachments.length > 0 && (
              <div>
                <h3 className="text-[10px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest block mb-3">
                  Anexos ({task.attachments.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {task.attachments.map((file, idx) => (
                    <a 
                      key={idx} 
                      href={file.file_url} 
                      target="_blank" 
                      rel="noreferrer" 
                      className="flex items-center gap-3 p-3 bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-sm rounded-xl transition-all group"
                    >
                      <div className="w-10 h-10 bg-blue-50 dark:bg-blue-900/20 text-blue-500 rounded-lg flex items-center justify-center shrink-0 border border-blue-100 dark:border-blue-800/30 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-gray-700 dark:text-slate-300 truncate group-hover:text-blue-600 transition-colors">{file.file_name}</p>
                        <p className="text-[9px] text-gray-400 font-medium">Baixar ou Visualizar</p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Coluna da Direita: Metadados */}
          <div className="space-y-6">
            <div className="bg-gray-50/50 dark:bg-slate-900/30 border border-gray-100 dark:border-slate-900 rounded-3xl p-5 space-y-5">
              
              {/* Peso da Atividade */}
              <div>
                <span className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest block mb-1">
                  Peso da Atividade
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 rounded-lg border border-indigo-100 dark:border-indigo-900/30">
                    {peso}x
                  </span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 10 }).map((_, i) => (
                      <div key={i} className={`w-1.5 h-3.5 rounded-sm ${i < peso ? 'bg-indigo-500' : 'bg-gray-200 dark:bg-slate-800'}`}></div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Deadline */}
              <div>
                <span className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest block mb-1">
                  Prazo Final (Deadline)
                </span>
                <span className="text-sm font-bold text-gray-700 dark:text-slate-300">
                  {formatDateDisplay(task.data_prevista)}
                </span>
              </div>

              {/* Etiquetas */}
              {task.tags && task.tags.length > 0 && (
                <div>
                  <span className="text-[9px] font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest block mb-2">
                    Etiquetas
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {task.tags.map((tag, idx) => (
                      <span key={idx} className="inline-flex items-center text-[10px] font-bold text-gray-600 dark:text-slate-400 bg-white dark:bg-slate-950 border border-gray-100 dark:border-slate-800 px-2 py-1 rounded-lg">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Datas Internas */}
              <div className="border-t border-gray-100 dark:border-slate-900 pt-4 space-y-2 text-[11px] text-gray-400 dark:text-slate-500 font-medium">
                <p>Criada em: {formatTimestamp(task.createdAt)}</p>
                {task.completed_at && <p className="text-emerald-600 dark:text-emerald-500 font-bold">Concluída em: {formatTimestamp(task.completed_at)}</p>}
              </div>
            </div>

            {/* Métrica de Tempo */}
            <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-blue-950/20 dark:to-indigo-950/20 border border-blue-100/50 dark:border-blue-900/30 rounded-3xl p-5 space-y-4">
              <h4 className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                Métricas Temporais
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/80 dark:bg-slate-950/40 p-3 rounded-2xl border border-blue-50/50 dark:border-blue-900/20">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Estimado</p>
                  <p className="text-xl font-black text-gray-800 dark:text-white mt-1">
                    {task.tempo_estimado || 0}
                    <span className="text-xs text-gray-500 font-medium ml-1">min</span>
                  </p>
                </div>
                <div className="bg-white/80 dark:bg-slate-950/40 p-3 rounded-2xl border border-blue-50/50 dark:border-blue-900/20">
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-wider">Real Gasto</p>
                  <p className={`text-xl font-black mt-1 ${task.status === 'concluida' ? 'text-emerald-600 dark:text-emerald-500' : 'text-gray-400'}`}>
                    {task.status === 'concluida' ? task.tempo_real || 1 : '—'}
                    {task.status === 'concluida' && <span className="text-xs text-gray-500 font-medium ml-1">min</span>}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskDetailsView;
