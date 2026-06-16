import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import analyticsService from '../services/analyticsService';
import { useToast } from '../context/ToastContext';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip, Legend 
} from 'recharts';

/**
 * Utilitário para formatar minutos de forma amigável (ex: 90 -> 1h 30min, 45 -> 45min)
 */
const formatTime = (minutes) => {
  if (!minutes || minutes <= 0) return '0 min';
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}min` : `${hrs}h`;
};

const AiInsightsView = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const taskId = searchParams.get('taskId');

  // Estados gerais
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  // Estados Modo Foco em Tarefa
  const [taskInsight, setTaskInsight] = useState(null);

  // Estados Modo Visão Geral
  const [aiInsights, setAiInsights] = useState(null);
  const [advancedAnalytics, setAdvancedAnalytics] = useState(null);
  const [completedTasks, setCompletedTasks] = useState([]);

  // Carregar dados conforme o modo ativo
  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      if (taskId) {
        // MODO FOCO EM TAREFA
        const data = await analyticsService.getTaskAIInsights(taskId);
        setTaskInsight(data);
      } else {
        // MODO VISÃO GERAL
        const [insightsData, advancedData, completedTasksData] = await Promise.all([
          analyticsService.getAIInsights().catch(() => null),
          analyticsService.getAdvancedAnalytics().catch(() => null),
          analyticsService.getCompletedTasks().catch(() => []),
        ]);
        if (insightsData) setAiInsights(insightsData);
        if (advancedData) setAdvancedAnalytics(advancedData);
        if (completedTasksData) setCompletedTasks(completedTasksData);
      }
    } catch (err) {
      console.error('Erro ao carregar dados de inteligência artificial:', err);
      const errMsg = err.response?.data?.message || 'Falha ao carregar os dados de IA.';
      setError(errMsg);
      addToast({ 
        message: errMsg, 
        type: 'error', 
        duration: 4000 
      });
    } finally {
      setLoading(false);
    }
  }, [taskId, addToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Função para baixar PDF
  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      await analyticsService.downloadPDFReport();
      addToast({ message: 'Relatório PDF gerado e baixado com sucesso! 📄', type: 'success', duration: 4000 });
    } catch (err) {
      console.error('Erro ao gerar relatório em PDF:', err);
      addToast({ message: 'Erro ao gerar ou baixar o relatório em PDF.', type: 'error', duration: 4000 });
    } finally {
      setDownloading(false);
    }
  };

  // Limpar modo foco
  const handleClearFocus = () => {
    setSearchParams({});
  };

  if (loading) {
    return (
      <div className="w-full flex flex-col gap-6 animate-pulse p-4 md:p-6 pb-12">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-3 flex-1">
            <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-48"></div>
            <div className="h-8 bg-slate-300 dark:bg-slate-750 rounded w-80"></div>
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-64"></div>
          </div>
          <div className="h-12 bg-slate-300 dark:bg-slate-700 rounded-2xl w-44 shrink-0"></div>
        </div>

        {taskId ? (
          // MODO FOCO EM TAREFA SKELETON
          <div className="flex flex-col gap-8 max-w-4xl mx-auto w-full">
            {/* 3 Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/60"></div>
              <div className="h-28 bg-slate-300 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/60"></div>
              <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/60"></div>
            </div>

            {/* Recommendation Banner */}
            <div className="h-36 bg-slate-350 dark:bg-slate-800/80 rounded-3xl border border-slate-200 dark:border-slate-700/80"></div>

            {/* Graph Card */}
            <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-3xl border border-slate-100 dark:border-slate-700/60"></div>
          </div>
        ) : (
          // MODO VISÃO GERAL SKELETON
          <div className="flex flex-col gap-6 w-full">
            {/* Banner Summary */}
            <div className="h-48 bg-slate-300 dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700/80"></div>

            {/* Grid de 2 colunas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full">
              {/* Col 1 */}
              <div className="flex flex-col gap-6">
                <div className="h-64 bg-slate-200 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700/60"></div>
                <div className="h-[360px] bg-slate-300 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700/60"></div>
                <div className="h-[360px] bg-slate-200 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700/60"></div>
              </div>

              {/* Col 2 */}
              <div className="h-[600px] bg-slate-300 dark:bg-slate-800 rounded-2xl border border-gray-100 dark:border-slate-700/60"></div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50 rounded-2xl p-6 text-center max-w-lg mx-auto my-8 animate-in fade-in duration-300">
        <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <p className="text-red-800 dark:text-red-300 font-bold mb-4">{error}</p>
        <button onClick={loadData} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-md transition-colors">
          Tentar Novamente
        </button>
      </div>
    );
  }

  // ==========================================
  // RENDERIZAÇÃO: MODO FOCO EM TAREFA ATÔMICA
  // ==========================================
  if (taskId && taskInsight) {
    const taskData = taskInsight;
    const planejado = Number(taskData?.task?.tempo_estimado) || 0;
    const real = Number(taskData?.task?.tempo_real) || 0;
    const classification = real > planejado ? 'acima' : real < planejado ? 'abaixo' : 'no_prazo';

    let cardTitle = 'DENTRO DO PRAZO';
    let cardValue = '0%';
    let cardSubtitle = 'Tempo cravado com o planejado';
    let cardBg = 'bg-slate-100/50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/50';
    let cardText = 'text-slate-600 dark:text-slate-400';
    let cardIconColor = 'text-slate-400 dark:text-slate-500';
    let cardIcon = (
      <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );

    if (real < planejado) {
      const val = planejado > 0 ? Math.round(((planejado - real) / planejado) * 100) : 100;
      cardTitle = 'ALTA EFICIÊNCIA';
      cardValue = `+${val}%`;
      cardSubtitle = 'De tempo economizado';
      cardBg = 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50';
      cardText = 'text-emerald-700 dark:text-emerald-400';
      cardIconColor = 'text-emerald-500 dark:text-emerald-400';
      cardIcon = (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    } else if (real > planejado) {
      const val = planejado > 0 ? Math.round(((real - planejado) / planejado) * 100) : 100;
      cardTitle = 'TEMPO EXCEDIDO';
      cardValue = `-${val}%`;
      cardSubtitle = 'A mais do que o estimado';
      cardBg = 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50';
      cardText = 'text-amber-800 dark:text-amber-400';
      cardIconColor = 'text-amber-600 dark:text-amber-400';
      cardIcon = (
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    }

    return (
      <div className="flex flex-col gap-8 pb-12 max-w-4xl mx-auto h-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 font-extrabold text-[10px] uppercase tracking-widest px-3 py-1.5 rounded-full border border-indigo-100 dark:border-indigo-800">
              Análise Atômica de Tarefa
            </span>
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight mt-3">
              {taskData?.task?.titulo || taskData?.task?.nome || 'Tarefa sem nome'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-bold mt-1 uppercase text-[11px] tracking-wider">
              Disciplina: <span className="text-indigo-600 dark:text-indigo-400">{taskData?.task?.subject_name}</span>
            </p>
          </div>
          <button
            onClick={handleClearFocus}
            className="px-5 py-3 border-2 border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 rounded-2xl font-bold text-sm transition-all bg-white dark:bg-slate-800 shadow-sm flex items-center gap-2 active:scale-95 shrink-0 self-start cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Visão Geral de IA
          </button>
        </div>

        {/* Comparativo de Tempos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800/90 border border-slate-100 dark:border-slate-700 p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300 h-auto">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Tempo Planejado</span>
            <h3 className="text-3xl font-black text-slate-800 dark:text-slate-100 mt-3">{formatTime(taskData?.task?.tempo_estimado)}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">Definido no início da atividade</p>
          </div>

          <div className="bg-white dark:bg-slate-800/90 border border-slate-100 dark:border-slate-700 p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300 h-auto">
            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Tempo Real Gasto</span>
            <h3 className="text-3xl font-black text-indigo-600 dark:text-indigo-400 mt-3">{formatTime(taskData?.task?.tempo_real)}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">Calculado silenciosamente pelo sistema</p>
          </div>

          <div className={`border p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:-translate-y-1 transition-all duration-300 flex items-center justify-between group h-auto ${cardBg}`}>
            <div>
              <span className={`text-xs font-extrabold uppercase tracking-widest ${cardText}`}>
                {cardTitle}
              </span>
              <h3 className="text-3xl font-black mt-3 text-slate-800 dark:text-slate-100">
                {cardValue}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-semibold">{cardSubtitle}</p>
            </div>
            <div className={`w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 border border-inherit flex items-center justify-center shadow-inner shrink-0 ${cardIconColor}`}>
              {cardIcon}
            </div>
          </div>
        </div>

        {/* Card com a Recomendação do Gemini */}
        <div className="bg-gradient-to-br from-indigo-900 to-blue-900 p-8 rounded-3xl border border-indigo-700 shadow-[0_12px_40px_rgba(79,70,229,0.15)] text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <svg className="w-64 h-64" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/30 backdrop-blur-md border border-indigo-400/40 flex items-center justify-center text-indigo-200 shrink-0">
              <svg className="w-8 h-8 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            
            <article className="flex flex-col gap-2">
              <h4 className="text-xs font-black text-indigo-200 uppercase tracking-widest">Recomendação Estratégica AI</h4>
              <h3 className="text-xl font-bold text-white tracking-tight">Dica de Produtividade do Gemini</h3>
              <p className="text-base text-indigo-100 font-medium leading-relaxed italic">
                "{taskData?.insight || 'Nenhum insight disponível para esta tarefa.'}"
              </p>
            </article>
          </div>
        </div>

        {/* Visual Duplo ProgressBar */}
        <div className="bg-white dark:bg-slate-800/90 border border-slate-100 dark:border-slate-700 p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 mb-6 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Comparativo Gráfico de Dedicação
          </h3>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Tempo Estimado</span>
                <span className="text-sm font-black text-slate-800 dark:text-slate-100">{formatTime(taskData?.task?.tempo_estimado)}</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-3.5 overflow-hidden shadow-inner">
                <div className="bg-gray-400 h-full rounded-full transition-all duration-1000 ease-out" style={{ width: '100%' }}></div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-extrabold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">Tempo Real Gasto</span>
                <span className="text-sm font-black text-indigo-600 dark:text-indigo-400">{formatTime(taskData?.task?.tempo_real)}</span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-3.5 overflow-hidden shadow-inner">
                <div 
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${
                    classification === 'acima' ? 'bg-red-500' :
                    classification === 'abaixo' ? 'bg-emerald-500' : 'bg-blue-500'
                  }`} 
                  style={{ width: `${Math.min(100, (taskData?.task?.tempo_real / (taskData?.task?.tempo_estimado || 1)) * 100)}%` }}
                ></div>
              </div>
              {taskData?.task?.tempo_real > taskData?.task?.tempo_estimado && (
                <p className="text-[10px] text-red-500 dark:text-red-400 font-bold mt-2 uppercase tracking-wide">
                  ⚠️ O tempo real gasto superou o tempo estimado planejado originalmente.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDERIZAÇÃO: MODO VISÃO GERAL HOLÍSTICO
  // ==========================================
  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-900 p-4 md:p-6 pb-12 flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">Central de Inteligência Artificial</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Seus insights de produtividade acadêmica alimentados pelo Gemini e Python Engine.</p>
        </div>
        
        {/* PDF Download Button */}
        <button
          onClick={handleDownloadPDF}
          disabled={downloading}
          className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm rounded-2xl transition-all shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 self-start sm:self-center shrink-0"
        >
          {downloading ? (
            <>
              <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Gerando Relatório...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Baixar Relatório Completo PDF
            </>
          )}
        </button>
      </div>

      {/* Bloco de Sumário e Insights Gerais da IA */}
      {aiInsights && (
        <div className="bg-gradient-to-br from-indigo-900 to-blue-900 p-6 sm:p-8 rounded-3xl border border-indigo-700 shadow-[0_8px_30px_rgb(0,0,0,0.12)] text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <svg className="w-48 h-48 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <span className="bg-indigo-500/30 text-indigo-200 p-2.5 rounded-xl backdrop-blur-md border border-indigo-400/30">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </span>
              <div>
                <h3 className="text-sm font-black text-indigo-100 uppercase tracking-widest">Inteligência Estratégica AI</h3>
                <p className="text-[10px] text-indigo-300/80 font-bold">Sumário motivacional e dicas gerais da IA</p>
              </div>
            </div>

            <article className="flex flex-col gap-6">
              <div className="flex flex-col gap-2 bg-indigo-950/20 p-5 rounded-2xl border border-indigo-800/40 backdrop-blur-sm text-lg font-bold text-white leading-relaxed italic">
                <p>"{aiInsights.summary}"</p>
              </div>

              {aiInsights.recommendations && aiInsights.recommendations.length > 0 && (
                <div className="flex flex-col gap-3">
                  <h4 className="text-xs font-black text-indigo-200 uppercase tracking-widest mb-1">Recomendações Práticas</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {aiInsights.recommendations.map((rec, index) => (
                      <div key={index} className="bg-indigo-950/30 p-4 rounded-xl border border-indigo-800/50 backdrop-blur-sm flex items-start gap-3 hover:-translate-y-0.5 transition-transform duration-200">
                        <span className="text-indigo-300 font-extrabold text-sm mt-0.5 bg-indigo-500/20 px-2 py-0.5 rounded-md border border-indigo-400/20 shrink-0">
                          {index + 1}
                        </span>
                        <p className="text-sm text-indigo-100 font-medium leading-relaxed">
                          {rec}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </article>
          </div>
        </div>
      )}

      {/* ===== GRID DE VISÃO GERAL: 2 COLUNAS ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full items-start">

        {/* Coluna 1: Gráficos e Métricas Gerais */}
        <div className="flex flex-col gap-6 h-auto">

          {/* Progresso por Disciplina */}
          {advancedAnalytics?.subjects && advancedAnalytics.subjects.length > 0 && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-5 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Progresso por Disciplina
              </h3>
              <div className="space-y-5">
                {advancedAnalytics.subjects.map((sub) => (
                  <div key={sub.id} className="space-y-2 group">
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-sm font-bold text-gray-800 dark:text-slate-200 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{sub.subject_name || sub.nome}</span>
                        <p className="text-[10px] text-gray-400 dark:text-slate-500 font-bold">{sub.task_count} tarefas registradas</p>
                      </div>
                      <span className="text-sm font-black text-indigo-600 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-0.5 rounded-lg border border-indigo-100 dark:border-indigo-800">{sub.progress_weighted}%</span>
                    </div>
                    <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${
                          sub.progress_weighted === 100 ? 'bg-emerald-500' : 
                          sub.progress_weighted > 50 ? 'bg-indigo-500' : 'bg-blue-400'
                        }`} 
                        style={{ width: `${sub.progress_weighted || 0}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pie Chart: Tempo Gasto por Disciplina */}
          {advancedAnalytics?.subjects && advancedAnalytics.subjects.length > 0 && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
                </svg>
                Tempo Gasto por Disciplina (horas)
              </h3>
              <div className="w-full h-[300px] relative">
                {(() => {
                  const pieData = (advancedAnalytics?.subjects || []).filter(s => s.total_hours > 0).map(s => ({ ...s, name: s.subject_name || s.nome }));
                  if (pieData.length === 0) {
                    return (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <svg className="w-12 h-12 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
                        </svg>
                        <p className="text-sm font-bold">Nenhuma tarefa com tempo registrado</p>
                        <p className="text-xs mt-1">Conclua tarefas com tempo real para ver o gráfico</p>
                      </div>
                    );
                  }
                  return (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="total_hours"
                          nameKey="name"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={[ '#4f46e5', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6' ][index % 6]} stroke="none" />
                          ))}
                        </Pie>
                        <RechartTooltip 
                          formatter={(value) => [`${value}h`, 'Tempo Real']}
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }}
                        />
                        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Bar Chart: Estimado vs Real */}
          {advancedAnalytics?.subjects && advancedAnalytics.subjects.length > 0 && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Estimado vs Real (minutos)
              </h3>
              <div className="w-full h-[300px] relative">
                {(() => {
                  const barData = (advancedAnalytics?.subjects || []).map(s => ({ name: s.subject_name || s.nome, estimado: s.time_estimated_min, real: s.time_real_min }));
                  if (barData.length === 0) {
                    return (
                      <div className="h-full flex flex-col items-center justify-center text-gray-400">
                        <svg className="w-12 h-12 mb-3 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        <p className="text-sm font-bold">Nenhum dado de tempo disponível</p>
                        <p className="text-xs mt-1">Preencha tempos estimados e reais nas tarefas</p>
                      </div>
                    );
                  }
                  return (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={barData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                        <RechartTooltip cursor={{ fill: '#f9fafb' }} contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', fontWeight: 'bold' }} />
                        <Bar dataKey="estimado" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={20} />
                        <Bar dataKey="real" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={20} />
                        <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontWeight: 'bold', fontSize: '10px', textTransform: 'uppercase' }} />
                      </BarChart>
                    </ResponsiveContainer>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Detalhamento de Desvios por Disciplina */}
          {aiInsights?.deviations && aiInsights.deviations.length > 0 && (
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm">
              <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100 mb-5 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Eficiência e Desvio por Disciplina
              </h3>
              
              <div className="flex flex-col gap-4">
                {aiInsights.deviations.map((dev, index) => {
                  const hasData = dev.status !== 'sem_dados';
                  const borderClass = dev.status === 'acima' ? 'border-red-100 dark:border-red-900/50 bg-red-50/20 dark:bg-red-900/10' :
                                      dev.status === 'abaixo' ? 'border-emerald-100 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-900/10' :
                                      dev.status === 'no_prazo' ? 'border-blue-100 dark:border-blue-900/50 bg-blue-50/20 dark:bg-blue-900/10' :
                                      'border-gray-100 dark:border-slate-700 bg-white dark:bg-slate-800';
                  
                  const badgeClass = dev.status === 'acima' ? 'bg-red-50 text-red-700 border-red-100' :
                                     dev.status === 'abaixo' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                     dev.status === 'no_prazo' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                     'bg-gray-50 text-gray-500 border-gray-200';
                  
                  const labelMap = {
                    acima: 'Desvio Alto',
                    abaixo: 'Alta Eficiência',
                    no_prazo: 'No Prazo',
                    sem_dados: 'Sem Dados',
                  };

                  return (
                    <div key={index} className={`p-5 rounded-xl border transition-all duration-300 flex flex-col h-auto gap-3 group ${borderClass}`}>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-sm font-bold text-gray-800 dark:text-slate-200 group-hover:text-indigo-600 transition-colors uppercase tracking-tight line-clamp-1">{dev.subject}</span>
                        <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border uppercase tracking-wider shrink-0 ${badgeClass}`}>
                          {labelMap[dev.status]}
                        </span>
                      </div>
                      {hasData && (
                        <p className="text-xs text-gray-400 font-semibold">
                          Estimado: <strong className="text-gray-700 dark:text-slate-300">{formatTime(dev.tempo_estimado_min)}</strong> | Real: <strong className="text-gray-700 dark:text-slate-300">{formatTime(dev.tempo_real_min)}</strong>
                        </p>
                      )}
                      {hasData ? (
                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Desvio Percentual</span>
                            <span className={`text-lg font-black ${dev.status === 'acima' ? 'text-red-600' : dev.status === 'abaixo' ? 'text-emerald-600' : 'text-blue-600'}`}>
                              {dev.deviation_percent > 0 ? '+' : ''}{dev.deviation_percent}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                dev.status === 'acima' ? 'bg-red-500' :
                                dev.status === 'abaixo' ? 'bg-emerald-500' : 'bg-blue-500'
                              }`} 
                              style={{ width: `${Math.min(100, Math.abs(dev.deviation_percent))}%` }}
                            ></div>
                          </div>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 font-bold italic py-1">
                          Registre tempos reais de estudo nas tarefas desta disciplina para gerar análises de eficiência.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Coluna 2: Lista/Histórico de Atividades Concluídas */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-gray-100 dark:border-slate-700 shadow-sm h-auto flex flex-col">
          <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
            Histórico de Atividades Analisadas 📈
          </h3>

          {completedTasks.length === 0 ? (
            <div className="text-center py-12 bg-gray-50/50 dark:bg-slate-900/30 rounded-2xl border border-dashed border-gray-200 dark:border-slate-700">
              <svg className="w-12 h-12 text-gray-300 dark:text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
              </svg>
              <p className="text-sm font-bold text-gray-400 dark:text-slate-500">Nenhuma atividade concluída para analisar.</p>
              <p className="text-xs text-gray-400/80 dark:text-slate-600 mt-1">Conclua tarefas no Kanban ou no Dashboard para iniciar as análises de IA.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
              {completedTasks.map((task) => (
                <div 
                  key={task.id} 
                  className="p-4 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-indigo-200 dark:hover:border-indigo-800 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-between gap-3 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span className="text-[9px] font-black px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 border border-indigo-100/50 dark:border-indigo-800 uppercase tracking-wider">
                        {task.subject_name}
                      </span>
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-gray-50 dark:bg-slate-700 text-gray-500 dark:text-slate-400 border border-gray-200/50 dark:border-slate-600 uppercase tracking-wider">
                        Real: {formatTime(task.tempo_real)}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-gray-800 dark:text-slate-200 group-hover:text-indigo-600 transition-colors truncate">
                      {task.titulo}
                    </h4>
                  </div>

                  <button
                    onClick={() => setSearchParams({ taskId: task.id })}
                    className="px-3 py-2 bg-gray-50 dark:bg-slate-700 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 text-gray-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 border border-gray-200 dark:border-slate-600 hover:border-indigo-100 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shrink-0 active:scale-95 shadow-sm"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Ver Insights
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiInsightsView;
