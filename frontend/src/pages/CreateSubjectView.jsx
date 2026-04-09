import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import subjectService from '../services/subjectService';

const CreateSubjectView = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ nome: '', professor: '', carga_horaria: '', descricao: '', data_inicio: '', data_fim: '' });

  const handleChange = (e) => { setFormData(prev => ({ ...prev, [e.target.name]: e.target.value })); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      await subjectService.create(formData);
      navigate('/disciplinas');
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao salvar disciplina. Tente novamente.');
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
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Nova Disciplina</h1>
          <p className="text-gray-500 mt-2 text-lg">Preencha os detalhes do módulo educacional.</p>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm font-medium">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2"><label className="block text-sm font-bold text-gray-700">Nome <span className="text-red-500">*</span></label><input type="text" name="nome" required value={formData.nome} onChange={handleChange} className={inputClass} placeholder="Ex: Engenharia de Software" /></div>
            <div className="space-y-2"><label className="block text-sm font-bold text-gray-700">Professor <span className="text-red-500">*</span></label><input type="text" name="professor" required value={formData.professor} onChange={handleChange} className={inputClass} placeholder="Ex: Dr. Alan Turing" /></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2"><label className="block text-sm font-bold text-gray-700">Carga Horária <span className="text-red-500">*</span></label><input type="number" name="carga_horaria" required min="1" value={formData.carga_horaria} onChange={handleChange} className={inputClass} placeholder="80" /></div>
            <div className="space-y-2"><label className="block text-sm font-bold text-gray-700">Data Início <span className="text-red-500">*</span></label><input type="date" name="data_inicio" required value={formData.data_inicio} onChange={handleChange} className={inputClass} /></div>
            <div className="space-y-2"><label className="block text-sm font-bold text-gray-700">Data Fim <span className="text-red-500">*</span></label><input type="date" name="data_fim" required value={formData.data_fim} onChange={handleChange} className={inputClass} /></div>
          </div>
          <div className="space-y-2"><label className="block text-sm font-bold text-gray-700">Descrição <span className="text-red-500">*</span></label><textarea name="descricao" rows="4" required value={formData.descricao} onChange={handleChange} className={inputClass + " resize-none"} placeholder="O que será abordado neste curso?"></textarea></div>
          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button type="submit" disabled={isSubmitting} className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-1 transition-all duration-200 flex items-center disabled:opacity-50 disabled:cursor-not-allowed">
              {isSubmitting ? <><svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>Processando...</> : <><svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/></svg>Salvar Disciplina</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSubjectView;
