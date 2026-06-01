import React, { useState, useEffect } from 'react';
import subjectService from '../services/subjectService';

const EditSubjectModal = ({ subject, onClose, onSave }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    nome: '',
    professor: '',
    carga_horaria: '',
    descricao: '',
    data_inicio: '',
    data_fim: ''
  });

  useEffect(() => {
    if (subject) {
      setFormData({
        nome: subject.nome || '',
        professor: subject.professor || '',
        carga_horaria: subject.carga_horaria || '',
        descricao: subject.descricao || '',
        data_inicio: subject.data_inicio || '',
        data_fim: subject.data_fim || ''
      });
    }
  }, [subject]);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await subjectService.update(subject.id || subject._id, {
        ...formData,
        carga_horaria: parseInt(formData.carga_horaria) || 0
      });
      if (onSave) onSave();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.message || 'Erro ao atualizar disciplina. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!subject) return null;

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
              Editar Disciplina
            </h2>
            <p className="text-xs text-gray-400 mt-1">Atualize as informações de {subject.nome}</p>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300">Nome <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="nome"
                  required
                  value={formData.nome}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Ex: Engenharia de Software"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300">Professor <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  name="professor"
                  required
                  value={formData.professor}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="Ex: Dr. Alan Turing"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300">Carga Horária (h) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  name="carga_horaria"
                  required
                  min="1"
                  value={formData.carga_horaria}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="80"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300">Data Início <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  name="data_inicio"
                  required
                  value={formData.data_inicio}
                  onChange={handleChange}
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-bold text-gray-700 dark:text-slate-300">Data Fim <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  name="data_fim"
                  required
                  value={formData.data_fim}
                  onChange={handleChange}
                  className={inputClass}
                />
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
                placeholder="O que será abordado neste curso?"
              ></textarea>
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
                disabled={isSubmitting}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 transition-all duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
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
    </div>
  );
};

export default EditSubjectModal;
