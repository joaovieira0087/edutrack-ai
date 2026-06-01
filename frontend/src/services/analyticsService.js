import { crudApi } from './api';

const analyticsService = {
  getAdvancedAnalytics: async () => {
    const response = await crudApi.get('/analytics');
    return response.data;
  },

  /**
   * Busca insights inteligentes gerados pelo Gemini AI.
   * Inclui desvios percentuais e recomendações personalizadas.
   */
  getAIInsights: async () => {
    const response = await crudApi.get('/analytics/insights');
    return response.data;
  },

  /**
   * Dispara a geração do relatório PDF e faz download do blob.
   * O PDF é gerado pelo Python com gráficos matplotlib.
   */
  downloadPDFReport: async () => {
    const response = await crudApi.get('/analytics/report/pdf', {
      responseType: 'blob',
    });

    // Criar link de download temporário
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `EduTrack_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * Busca os insights atômicos de uma tarefa concluída.
   */
  getTaskAIInsights: async (taskId) => {
    const response = await crudApi.get(`/analytics/tasks/${taskId}/insights`);
    return response.data;
  },

  /**
   * Busca a lista de tarefas concluídas do usuário logado.
   */
  getCompletedTasks: async () => {
    const response = await crudApi.get('/analytics/tasks/completed');
    return response.data;
  },
};

export default analyticsService;
