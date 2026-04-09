import React, { useState, useEffect } from 'react';
import taskService from '../services/taskService';
import { useToast } from '../context/ToastContext';

const EditTaskModal = ({ task, subjects, onClose, onSave }) => {
  const { addToast } = useToast();
  const [formData, setFormData] = useState({
    titulo: '',
    subject_id: '',
    data_prevista: '',
    priority: 4,
    descricao: '',
    status: 'pendente',
    tags: '',
    attachments: []
  });
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isPriorityMenuOpen, setIsPriorityMenuOpen] = useState(false);

  useEffect(() => {
    if (task) {
      setFormData({
        titulo: task.titulo || '',
        subject_id: task.subject_id || '',
        data_prevista: task.data_prevista || '',
        priority: task.priority || 4,
        descricao: task.descricao || '',
        status: task.status || 'pendente',
        tags: task.tags ? task.tags.join(', ') : '',
        attachments: task.attachments || []
      });
    }
  }, [task]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
    if (!formData.titulo.trim()) {
      setError('O título da tarefa é obrigatório.');
      return;
    }
    if (!formData.subject_id) {
      setError('Selecione uma disciplina.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const finalData = { 
        ...formData, 
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [] 
      };
      await taskService.update(task.id, finalData);
      onSave(); // Callback to refresh data and close modal
    } catch (err) {
      console.error('Erro ao atualizar tarefa:', err);
      setError(err.response?.data?.message || 'Erro ao atualizar tarefa. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja mover esta tarefa para a lixeira?')) {
      return;
    }

    setIsSubmitting(true);
    try {
      await taskService.softDelete(task.id);
      
      addToast({
        message: `Tarefa "${task.titulo}" movida para a lixeira.`,
        type: 'delete',
        duration: 5000,
        action: {
          label: 'Desfazer',
          onClick: async () => {
            try {
              await taskService.restore(task.id);
              onSave(); 
              addToast({ message: 'Ação desfeita com sucesso!', type: 'success' });
            } catch (err) {
              console.error('Erro ao desfazer exclusão:', err);
            }
          }
        }
      });

      onSave();
    } catch (err) {
      console.error('Erro ao deletar tarefa:', err);
      setError('Erro ao mover para a lixeira. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!task) return null;

  const inputClass = "w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent block px-4 py-3 placeholder-gray-400 transition-all font-medium";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className="relative w-full max-w-xl bg-white rounded-[2.5rem] shadow-2xl border border-gray-100 overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-50 flex items-center justify-between bg-gradient-to-r from-gray-50 to-white">
          <div>
            <h2 className="text-2xl font-black text-gray-800 tracking-tight">Editar Tarefa</h2>
            <p className="text-sm text-gray-500 font-medium mt-0.5">Ajuste os detalhes da sua atividade académica.</p>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-xl text-sm font-bold animate-in slide-in-from-top-2 duration-300 flex items-center">
              <svg className="w-5 h-5 mr-2 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Título da Tarefa</label>
            <input 
              type="text" 
              name="titulo" 
              value={formData.titulo} 
              onChange={handleChange} 
              className={inputClass}
              placeholder="Ex: Entrega do Trabalho de IA"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Disciplina</label>
              <select 
                name="subject_id" 
                value={formData.subject_id} 
                onChange={handleChange} 
                className={`${inputClass} appearance-none cursor-pointer`}
              >
                <option value="" disabled>Selecione...</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.nome}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Prazo (Deadline)</label>
              <input 
                type="date" 
                name="data_prevista" 
                value={formData.data_prevista} 
                onChange={handleChange} 
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-end">
            <div className="space-y-2">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Prioridade</label>
              <div className="relative">
                <button 
                  type="button"
                  onClick={() => setIsPriorityMenuOpen(!isPriorityMenuOpen)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl hover:border-gray-300 transition-all font-bold text-gray-700"
                >
                  <svg 
                    className={`w-4 h-4 ${Number(formData.priority) === 4 ? '' : 'fill-current'}`} 
                    viewBox="0 0 24 24" 
                    style={{ color: Number(formData.priority) === 1 ? '#de4c4a' : Number(formData.priority) === 2 ? '#f49c18' : Number(formData.priority) === 3 ? '#4073ff' : '#808080' }}
                    fill={Number(formData.priority) === 4 ? 'none' : 'currentColor'}
                    stroke="currentColor" 
                    strokeWidth={Number(formData.priority) === 4 ? '2.5' : '0'}
                  >
                    <path d="M4 2v20M4 4l16 5-16 5V4z"/>
                  </svg>
                  <span>Prioridade {formData.priority}</span>
                  <svg className={`w-4 h-4 ml-auto transition-transform duration-300 ${isPriorityMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7"/></svg>
                </button>
                
                {isPriorityMenuOpen && (
                  <div className="absolute top-full mt-2 left-0 w-full bg-white border border-gray-100 rounded-2xl shadow-xl z-[110] overflow-hidden py-1 animate-in fade-in slide-in-from-top-2 duration-200">
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
                          strokeWidth={p === 4 ? '2.5' : '0'}
                        >
                          <path d="M4 2v20M4 4l16 5-16 5V4z"/>
                        </svg>
                        <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900">P{p} - {['Crítica', 'Alta', 'Média', 'Baixa'][p-1]}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Status</label>
              <select 
                name="status" 
                value={formData.status} 
                onChange={handleChange} 
                className={`${inputClass} appearance-none cursor-pointer`}
              >
                <option value="pendente">Pendente</option>
                <option value="em andamento">Em Andamento</option>
                <option value="concluida">Concluída</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Descrição</label>
            <textarea 
              name="descricao" 
              rows="4" 
              value={formData.descricao} 
              onChange={handleChange} 
              className={`${inputClass} resize-none custom-scrollbar`}
              placeholder="Adicione detalhes, observações ou links importantes..."
            ></textarea>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Etiquetas (separadas por vírgula)</label>
            <input 
              type="text" 
              name="tags" 
              value={formData.tags} 
              onChange={handleChange} 
              className={inputClass}
              placeholder="Ex: Prova, Leitura, Trabalho em Grupo"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Anexos</label>
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
                      <a href={file.file_url} target="_blank" rel="noreferrer" className="font-medium text-blue-600 hover:underline truncate">{file.file_name}</a>
                    </div>
                    <button type="button" onClick={() => setFormData(prev => ({...prev, attachments: prev.attachments.filter((_, i) => i !== idx)}))} className="text-red-500 hover:text-red-700 p-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-6 border-t border-gray-50 flex items-center justify-end gap-4">
            <button 
              type="button" 
              onClick={onClose}
              disabled={isSubmitting}
              className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button 
              type="button" 
              onClick={handleDelete}
              disabled={isSubmitting}
              className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-all disabled:opacity-50 flex items-center justify-center shadow-inner"
              title="Mover para Lixeira"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all flex items-center disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTaskModal;
