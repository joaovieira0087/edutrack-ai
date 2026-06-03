import React, { useState, useEffect } from 'react';
import subjectService from '../services/subjectService';
import taskService from '../services/taskService';

const CreateTaskModal = ({ isOpen, onClose, onSave, initialSubjectId }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [isPriorityMenuOpen, setIsPriorityMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    titulo: '',
    subject_id: initialSubjectId || '',
    data_prevista: '',
    status: 'pendente',
    descricao: '',
    priority: 4,
    peso: 1,
    tags: '',
    attachments: [],
    blocked_by: [],
    tempo_estimado: 0
  });
  const [isUploading, setIsUploading] = useState(false);
  const [allTasks, setAllTasks] = useState([]);

  useEffect(() => {
    if (isOpen) {
      subjectService.getAll().then(setSubjects).catch(console.error);
      taskService.getAll().then(setAllTasks).catch(console.error);
      setFormData({
        titulo: '',
        subject_id: initialSubjectId || '',
        data_prevista: '',
        status: 'pendente',
        descricao: '',
        priority: 4,
        peso: 1,
        tags: '',
        attachments: [],
        blocked_by: [],
        tempo_estimado: 0
      });
      setError('');
    }
  }, [isOpen, initialSubjectId]);

  const handleDependenciesChange = (e) => {
    const value = Array.from(e.target.selectedOptions, option => option.value);
    setFormData(prev => ({ ...prev, blocked_by: value }));
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const uploadResp = await taskService.uploadAttachment(file);
      setFormData(prev => ({ ...prev, attachments: [...prev.attachments, uploadResp] }));
    } catch (err) {
      setError('Erro ao enviar arquivo.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const finalData = {
        ...formData,
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      };
      await taskService.create(finalData);
      if (onSave) onSave();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao salvar tarefa. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const inputClass = "w-full bg-gray-50/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 text-gray-900 dark:text-white rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent block px-4 py-3 placeholder-gray-400 dark:placeholder-slate-600 transition-shadow";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      ></div>

      {/* Modal Box */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-950 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-slate-900 overflow-hidden animate-in zoom-in-95 fade-in duration-300 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-50 dark:border-slate-900/60 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white dark:from-slate-900/50 dark:to-slate-950 shrink-0">
          <div>
            <h2 className="text-2xl font-black text-gray-800 dark:text-white tracking-tight leading-tight">
              Nova Tarefa Acadêmica
            </h2>
            <p className="text-xs text-gray-400 mt-1">Defina uma nova entrega ou atividade.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-900 rounded-full text-gray-400 transition-colors shrink-0"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
          {error && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/30 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl mb-6 text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 dark:text-slate-300">Título <span className="text-red-500">*</span></label>
              <input
                type="text"
                name="titulo"
                required
                value={formData.titulo}
                onChange={handleChange}
                className={inputClass}
                placeholder="Ex: Projeto Final"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {!initialSubjectId && (
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-700 dark:text-slate-300">Disciplina <span className="text-red-500">*</span></label>
                  <select
                    name="subject_id"
                    required
                    value={formData.subject_id}
                    onChange={handleChange}
                    className={inputClass + " appearance-none cursor-pointer"}
                  >
                    <option value="" disabled>Selecione...</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
                  </select>
                </div>
              )}
              <div className={`space-y-2 ${initialSubjectId ? 'md:col-span-2' : ''}`}>
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-gray-400 dark:text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                  Prazo Final de Entrega <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="data_prevista"
                  required
                  value={formData.data_prevista}
                  onChange={handleChange}
                  className={inputClass}
                />
                <p className="text-[11px] text-gray-400 dark:text-slate-500 font-medium ml-1">Selecione a data do calendário em que esta tarefa precisa ser entregue.</p>
              </div>
            </div>

            {formData.subject_id && (
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300">Dependências (Bloqueada por)</label>
                <select 
                  multiple
                  name="blocked_by" 
                  value={formData.blocked_by} 
                  onChange={handleDependenciesChange} 
                  className={inputClass + " custom-scrollbar min-h-[100px]"}
                >
                  {allTasks
                    .filter(t => t.subject_id === formData.subject_id && t.status !== 'concluida')
                    .map(t => (
                      <option key={t.id} value={t.id} className="p-2 border-b border-gray-100 dark:border-slate-800 last:border-0 hover:bg-gray-100 dark:hover:bg-slate-900 rounded">
                        {t.titulo} ({t.status.replace('_', ' ')})
                      </option>
                    ))
                  }
                </select>
                <div className="bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-800/30 rounded-lg p-3 flex gap-3 mt-2">
                  <svg className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-xs text-blue-700/80 dark:text-blue-400 leading-relaxed font-medium">Sua tarefa ficará 'Bloqueada' até que as tarefas pai selecionadas sejam concluídas.</p>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 dark:text-slate-300">Prioridade</label>
              <div className="relative">
                <button 
                  type="button"
                  onClick={() => setIsPriorityMenuOpen(!isPriorityMenuOpen)}
                  className="w-full sm:w-48 flex items-center gap-3 px-4 py-3 bg-gray-50/50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800 rounded-xl hover:border-gray-300 transition-all font-bold text-gray-700 dark:text-slate-300"
                >
                  <svg 
                    className={`w-4 h-4 ${Number(formData.priority) === 4 ? '' : 'fill-current'}`} 
                    viewBox="0 0 24 24" 
                    style={{ color: Number(formData.priority) === 1 ? '#de4c4a' : Number(formData.priority) === 2 ? '#f49c18' : Number(formData.priority) === 3 ? '#4073ff' : '#808080' }}
                    fill={Number(formData.priority) === 4 ? 'none' : 'currentColor'}
                    stroke="currentColor" 
                    strokeWidth={Number(formData.priority) === 4 ? '2' : '0'}
                  >
                    <path d="M4 2v20M4 4l16 5-16 5V4z"/>
                  </svg>
                  <span>P{formData.priority}</span>
                  <svg className={`w-4 h-4 ml-auto transition-transform duration-300 ${isPriorityMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"/></svg>
                </button>
                
                {isPriorityMenuOpen && (
                  <div className="absolute bottom-full mb-2 left-0 w-48 bg-white dark:bg-slate-950 border border-gray-100 dark:border-slate-900 rounded-2xl shadow-2xl z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    {[1, 2, 3, 4].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => { setFormData(prev => ({ ...prev, priority: p })); setIsPriorityMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors group"
                      >
                        <svg 
                          className={`w-4 h-4 ${p === 4 ? '' : 'fill-current'}`} 
                          viewBox="0 0 24 24" 
                          style={{ color: p === 1 ? '#de4c4a' : p === 2 ? '#f49c18' : p === 3 ? '#4073ff' : '#808080' }}
                          fill={p === 4 ? 'none' : 'currentColor'}
                          stroke="currentColor" 
                          strokeWidth={p === 4 ? '2' : '0'}
                        >
                          <path d="M4 2v20M4 4l16 5-16 5V4z"/>
                        </svg>
                        <span className="text-sm font-bold text-gray-700 dark:text-slate-300 group-hover:text-gray-900 dark:group-hover:text-white">Prioridade {p}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 dark:text-slate-300">Descrição <span className="text-red-500">*</span></label>
              <textarea
                name="descricao"
                rows="4"
                required
                value={formData.descricao}
                onChange={handleChange}
                className={inputClass + " resize-none"}
                placeholder="Detalhes da atividade..."
              ></textarea>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 dark:text-slate-300">Peso da Tarefa ({formData.peso}x)</label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  name="peso"
                  min="1"
                  max="10"
                  value={formData.peso}
                  onChange={handleChange}
                  className="flex-1 h-2 bg-gray-200 dark:bg-slate-800 rounded-full appearance-none cursor-pointer accent-indigo-600"
                />
                <span className="text-sm font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-950/30 px-3 py-1 rounded-lg border border-indigo-100 dark:border-indigo-800/30 min-w-[48px] text-center">{formData.peso}x</span>
              </div>
            </div>

            <div className="p-5 bg-blue-50/30 dark:bg-slate-800/40 rounded-2xl border border-blue-100/50 dark:border-slate-700/40">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
                  <svg className="w-4 h-4 text-blue-500 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  Tempo de Foco Estimado (minutos)
                </label>
                <input 
                  type="number" 
                  name="tempo_estimado" 
                  min="0"
                  value={formData.tempo_estimado} 
                  onChange={handleChange} 
                  className={inputClass} 
                  placeholder="Ex: 30, 60, 90, 120" 
                />
                <p className="text-[11px] text-gray-500 dark:text-slate-400 font-medium leading-relaxed ml-1">
                  Insira quantos minutos você pretende passar focado executando ativamente esta tarefa (Ex: 30, 60, 90, 120 minutos). Este valor alimenta o cronômetro e os gráficos de desempenho da IA — não tem relação com o prazo de entrega acima.
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700 dark:text-slate-300">Etiquetas (separadas por vírgula)</label>
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                className={inputClass}
                placeholder="Ex: Prova, Leitura, Trabalho em Grupo"
              />
            </div>
            
            {/* File Upload Section */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-gray-700 dark:text-slate-300">Anexos</label>
              <div className="flex items-center gap-4">
                <label className={`cursor-pointer inline-flex items-center px-4 py-2 border border-gray-200 dark:border-slate-800 rounded-xl bg-gray-50 dark:bg-slate-900/50 text-sm font-bold text-gray-700 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-900 transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                  {isUploading ? 'Enviando...' : 'Anexar Arquivo'}
                  <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
                </label>
              </div>
              {formData.attachments && formData.attachments.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {formData.attachments.map((file, idx) => (
                    <li key={idx} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-slate-900/40 border border-gray-100 dark:border-slate-900 rounded-lg text-sm">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        <span className="font-medium text-gray-700 dark:text-slate-300 truncate">{file.file_name}</span>
                      </div>
                      <button type="button" onClick={() => setFormData(prev => ({...prev, attachments: prev.attachments.filter((_, i) => i !== idx)}))} className="text-red-500 hover:text-red-700 p-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="pt-6 border-t border-gray-100 dark:border-slate-900/60 flex justify-end gap-3">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={onClose}
                className="px-6 py-3 border border-gray-200 dark:border-slate-800 text-gray-700 dark:text-slate-300 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-slate-900 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || isUploading}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 transition-all duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Salvando...' : 'Salvar Tarefa'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateTaskModal;
