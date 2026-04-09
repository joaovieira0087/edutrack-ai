import { crudApi } from './api';

const subjectService = {
  getAll: async () => {
    const response = await crudApi.get('/subjects');
    return response.data || [];
  },
  getById: async (id) => {
    const response = await crudApi.get(`/subjects/${id}`);
    return response.data;
  },
  create: async (data) => {
    const payload = {
      nome: data.nome,
      professor: data.professor,
      carga_horaria: parseInt(data.carga_horaria) || 0,
      descricao: data.descricao,
      data_inicio: data.data_inicio,
      data_fim: data.data_fim,
    };
    const response = await crudApi.post('/subjects', payload);
    return response.data;
  },
};

export default subjectService;
