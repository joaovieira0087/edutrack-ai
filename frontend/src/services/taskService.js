import { crudApi } from './api';

const taskService = {
  getAll: async () => {
    const response = await crudApi.get('/tasks');
    return response.data || [];
  },
  getById: async (id) => {
    const response = await crudApi.get(`/tasks/${id}`);
    return response.data;
  },
  create: async (data) => {
    const payload = {
      subject_id: data.subject_id,
      titulo: data.titulo,
      descricao: data.descricao,
      data_prevista: data.data_prevista,
      status: data.status || 'pendente',
      priority: data.priority || 4,
      tags: data.tags || [],
      attachments: data.attachments || [],
    };
    const response = await crudApi.post('/tasks', payload);
    return response.data;
  },
  update: async (id, data) => {
    const response = await crudApi.patch(`/tasks/${id}`, data);
    return response.data;
  },
  getTrash: async () => {
    const response = await crudApi.get('/tasks/trash');
    return response.data || [];
  },
  softDelete: async (id) => {
    const response = await crudApi.patch(`/tasks/${id}/soft-delete`);
    return response.data;
  },
  restore: async (id) => {
    const response = await crudApi.patch(`/tasks/${id}/restore`);
    return response.data;
  },
  permanentlyDelete: async (id) => {
    const response = await crudApi.delete(`/tasks/${id}/permanent`);
    return response.data;
  },
  emptyTrash: async () => {
    const response = await crudApi.delete('/tasks/trash/empty');
    return response.data;
  },
  restoreAll: async () => {
    const response = await crudApi.patch('/tasks/trash/restore-all');
    return response.data;
  },
  uploadAttachment: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await crudApi.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  }
};

export default taskService;
