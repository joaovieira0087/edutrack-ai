import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import subjectService from '../services/subjectService';
import taskService from '../services/taskService';

const CreateTaskView = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [subjects, setSubjects] = useState([]);
  const [isPriorityMenuOpen, setIsPriorityMenuOpen] = useState(false);
  const [formData, setFormData] = useState({ titulo: '', subject_id: '', data_prevista: '', status: 'pendente', descricao: '', priority: 4, tags: '', attachments: [] });
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    subjectService.getAll().then(setSubjects).catch(console.error);
  }, []);

  const handleChange = (e) => { setFormData(prev => ({ ...prev, [e.target.name]: e.target.value })); setError(''); };

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
      navigate('/tarefas');
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao salvar tarefa. Tente novamente.');
    } finally { setIsSubmitting(false); }
  };

  const inputClass = "w-full bg-gray-50/50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent block px-4 py-3 placeholder-gray-400 transition-shadow";

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <button onClick={() => navigate(-1)} className="flex items-center text-sm font-bold text-gray-500 hover:text-blue-600 transition-colors group cursor-pointer">
        <div className="bg-white border border-gray-200 shadow-sm w-8 h-8 rounded-full flex items-center justify-center mr-3 group-hover:border-blue-300 group-hover:-translate-x-1 transition-all"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg></div>Voltar
      </button>

      <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 sm:p-10 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Nova Tarefa Acadêmica</h1>
          <p className="text-gray-500 mt-2 text-lg">Defina uma nova entrega ou atividade.</p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm font-medium">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2"><label className="block text-sm font-bold text-gray-700">Título <span className="text-red-500">*</span></label><input type="text" name="titulo" required value={formData.titulo} onChange={handleChange} className={inputClass} placeholder="Ex: Projeto Final" /></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">Disciplina <span className="text-red-500">*</span></label>
              <select name="subject_id" required value={formData.subject_id} onChange={handleChange} className={inputClass + " appearance-none cursor-pointer"}>
                <option value="" disabled>Selecione...</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.nome}</option>)}
              </select>
            </div>
            <div className="space-y-2"><label className="block text-sm font-bold text-gray-700">Deadline <span className="text-red-500">*</span></label><input type="date" name="data_prevista" required value={formData.data_prevista} onChange={handleChange} className={inputClass} /></div>
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">Status <span className="text-red-500">*</span></label>
              <select name="status" required value={formData.status} onChange={handleChange} className={inputClass + " appearance-none cursor-pointer"}>
                <option value="pendente">Pendente</option>
                <option value="em andamento">Em Andamento</option>
                <option value="concluida">Concluída</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">Prioridade</label>
            <div className="relative">
              <button 
                type="button"
                onClick={() => setIsPriorityMenuOpen(!isPriorityMenuOpen)}
                className="w-full sm:w-48 flex items-center gap-3 px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-xl hover:border-gray-300 transition-all font-bold text-gray-700"
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
                <div className="absolute bottom-full mb-2 left-0 w-48 bg-white border border-gray-100 rounded-2xl shadow-2xl z-50 overflow-hidden py-1 animate-in fade-in slide-in-from-bottom-2 duration-200">
                  {[1, 2, 3, 4].map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => { setFormData(prev => ({ ...prev, priority: p })); setIsPriorityMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors group"
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
                      <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900">Prioridade {p}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2"><label className="block text-sm font-bold text-gray-700">Descrição <span className="text-red-500">*</span></label><textarea name="descricao" rows="4" required value={formData.descricao} onChange={handleChange} className={inputClass + " resize-none"} placeholder="Detalhes da atividade..."></textarea></div>
          <div className="space-y-2"><label className="block text-sm font-bold text-gray-700">Etiquetas (separadas por vírgula)</label><input type="text" name="tags" value={formData.tags} onChange={handleChange} className={inputClass} placeholder="Ex: Prova, Leitura, Trabalho em Grupo" /></div>
          
          {/* File Upload Section */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-gray-700">Anexos</label>
            <div className="flex items-center gap-4">
              <label className={`cursor-pointer inline-flex items-center px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 text-sm font-bold text-gray-700 hover:bg-gray-100 transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                {isUploading ? 'Enviando...' : 'Anexar Arquivo'}
                <input type="file" className="hidden" onChange={handleFileUpload} disabled={isUploading} />
              </label>
            </div>
            {formData.attachments && formData.attachments.length > 0 && (
              <ul className="mt-3 space-y-2">
                {formData.attachments.map((file, idx) => (
                  <li key={idx} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg text-sm">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      <span className="font-medium text-gray-700 truncate">{file.file_name}</span>
                    </div>
                    <button type="button" onClick={() => setFormData(prev => ({...prev, attachments: prev.attachments.filter((_, i) => i !== idx)}))} className="text-red-500 hover:text-red-700 p-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          
          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-1 transition-all duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? <><svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>Registrando...</> : <><svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>Salvar Tarefa</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTaskView;
