import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import subjectService from '../services/subjectService';

const SubjectsView = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        const data = await subjectService.getAll();
        setSubjects(data);
      } catch (err) {
        console.error('Erro ao carregar disciplinas:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSubjects();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 font-medium">Carregando disciplinas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Disciplinas</h1>
          <p className="text-gray-500 mt-1 text-lg">Gerencie seu currículo acadêmico.</p>
        </div>
        <Link to="/disciplinas/nova" className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-2xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-1 transition-all duration-200 flex items-center cursor-pointer">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
          Nova Disciplina
        </Link>
      </div>

      {subjects.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-10 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
          </div>
          <h3 className="text-lg font-bold text-gray-700">Nenhuma disciplina cadastrada</h3>
          <p className="text-gray-500 mt-1">Comece adicionando sua primeira disciplina.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {subjects.map(subject => (
            <div key={subject.id} className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 border border-gray-100 shadow-sm hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] hover:border-indigo-100 transition-all duration-300 group">
              <div className="flex justify-between sm:items-start mb-6 flex-col sm:flex-row gap-4">
                <div className="flex items-center">
                  <Link to={`/disciplinas/${subject.id}`} className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 mr-5 group-hover:scale-110 transition-transform shadow-inner cursor-pointer">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                  </Link>
                  <div>
                    <Link to={`/disciplinas/${subject.id}`} className="text-xl font-bold text-gray-900 mb-1 group-hover:text-indigo-700 transition-colors cursor-pointer hover:underline decoration-indigo-300 underline-offset-4 block">
                      {subject.nome}
                    </Link>
                    <p className="text-sm text-gray-500 font-medium">{subject.professor}</p>
                  </div>
                </div>
                <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-bold bg-indigo-50/50 text-indigo-600 border border-indigo-100">
                  Início: {subject.data_inicio}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 line-clamp-3 mb-6 bg-gray-50/50 p-4 rounded-2xl leading-relaxed border border-gray-100/50">
                {subject.descricao}
              </p>
              
              <div className="flex items-center justify-between text-sm font-bold text-gray-400 uppercase tracking-wider pt-4 border-t border-gray-100">
                <span className="flex items-center text-gray-600">
                  <svg className="w-5 h-5 mr-2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  {subject.carga_horaria} horas curriculares
                </span>
                <Link to={`/disciplinas/${subject.id}`} className="text-indigo-600 hover:text-indigo-800 flex items-center cursor-pointer group-hover:translate-x-1 transition-transform">
                  Detalhes
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SubjectsView;
