import React, { useState, useEffect, useCallback } from 'react';
import analyticsService from '../services/analyticsService';

/**
 * AIInsightsCard — Painel de Insights Inteligentes com IA
 * 
 * Exibe recomendações personalizadas do Gemini AI baseadas
 * na análise de desvio entre tempo estimado e real.
 */
const AIInsightsCard = ({ refreshTrigger = 0 }) => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const fetchInsights = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await analyticsService.getAIInsights();
      setInsights(data);
    } catch (err) {
      console.error('Erro ao buscar insights:', err);
      setError('Não foi possível gerar insights no momento.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights, refreshTrigger]);

  const handleDownloadPDF = async () => {
    try {
      setPdfLoading(true);
      await analyticsService.downloadPDFReport();
    } catch (err) {
      console.error('Erro ao gerar PDF:', err);
      setError('Erro ao gerar relatório PDF. Tente novamente.');
    } finally {
      setPdfLoading(false);
    }
  };

  const getDeviationBadge = (deviation) => {
    if (deviation === null || deviation === undefined) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01" /></svg>
          Sem dados
        </span>
      );
    }
    if (deviation > 20) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
          +{deviation.toFixed(0)}%
        </span>
      );
    }
    if (deviation < -10) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" /></svg>
          {deviation.toFixed(0)}%
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20">
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" /></svg>
        No prazo
      </span>
    );
  };

  // Loading skeleton
  if (loading) {
    return (
      <div className="bg-gradient-to-br from-violet-950 via-indigo-950 to-blue-950 p-6 rounded-3xl border border-violet-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] animate-pulse">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-violet-800/50 rounded-xl"></div>
          <div className="space-y-2">
            <div className="h-4 w-48 bg-violet-800/50 rounded-lg"></div>
            <div className="h-3 w-32 bg-violet-800/30 rounded-lg"></div>
          </div>
        </div>
        <div className="space-y-3">
          <div className="h-16 bg-violet-900/30 rounded-2xl"></div>
          <div className="h-16 bg-violet-900/30 rounded-2xl"></div>
          <div className="h-16 bg-violet-900/30 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !insights) {
    return (
      <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-3xl border border-gray-700 shadow-[0_8px_30px_rgb(0,0,0,0.12)]">
        <div className="text-center py-6">
          <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-400 mx-auto mb-4 border border-red-500/20">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.072 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
          </div>
          <p className="text-sm font-bold text-gray-300 mb-4">{error}</p>
          <button 
            onClick={fetchInsights}
            className="px-5 py-2.5 bg-indigo-500/20 text-indigo-300 text-xs font-bold rounded-xl border border-indigo-500/30 hover:bg-indigo-500/30 transition-all active:scale-95"
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (!insights) return null;

  const hasRecommendations = insights.recommendations && insights.recommendations.length > 0;
  const hasDeviations = insights.deviations && insights.deviations.length > 0;
  const displayedRecommendations = expanded ? insights.recommendations : insights.recommendations?.slice(0, 3);

  return (
    <div className="bg-gradient-to-br from-violet-950 via-indigo-950 to-blue-950 p-6 rounded-3xl border border-violet-800/50 shadow-[0_8px_30px_rgb(0,0,0,0.15)] relative overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 w-full">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-72 h-72 bg-gradient-to-bl from-violet-500/5 to-transparent rounded-full -translate-y-1/2 translate-x-1/4"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-blue-500/5 to-transparent rounded-full translate-y-1/3 -translate-x-1/4"></div>
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="bg-gradient-to-br from-violet-500/30 to-indigo-500/30 text-violet-200 p-2.5 rounded-xl backdrop-blur-md border border-violet-400/20 shadow-lg">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24">
                <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" fill="currentColor" opacity="0.3"/>
                <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            </span>
            <div>
              <h3 className="text-sm font-black text-violet-100 uppercase tracking-widest">Insights Inteligentes</h3>
              <p className="text-[11px] text-violet-300/60 font-bold">Powered by Gemini AI</p>
            </div>
          </div>

          {/* PDF Download Button */}
          <button
            onClick={handleDownloadPDF}
            disabled={pdfLoading}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-violet-200 text-xs font-bold rounded-xl border border-violet-500/20 hover:border-violet-400/40 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm"
          >
            {pdfLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-violet-300/30 border-t-violet-300 rounded-full animate-spin"></div>
                Gerando...
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                Relatório PDF
              </>
            )}
          </button>
        </div>

        {/* AI Summary */}
        {insights.summary && (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-violet-500/10 mb-5">
            <p className="text-sm text-violet-100/90 font-medium leading-relaxed italic">
              "{insights.summary}"
            </p>
          </div>
        )}

        {/* Deviations grid */}
        {hasDeviations && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
            {insights.deviations.map((dev, idx) => (
              <div key={idx} className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-violet-800/30 hover:border-violet-600/40 transition-all group">
                <div className="flex items-center justify-between mb-2">
                  {getDeviationBadge(dev.deviation_percent)}
                </div>
                <p className="text-xs font-bold text-violet-200 truncate group-hover:text-white transition-colors" title={dev.subject}>
                  {dev.subject}
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] text-violet-400/70 font-medium">
                    Est: {dev.tempo_estimado_min}min
                  </span>
                  <span className="text-violet-700">•</span>
                  <span className="text-[10px] text-violet-400/70 font-medium">
                    Real: {dev.tempo_real_min}min
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Recommendations */}
        {hasRecommendations && (
          <div className="space-y-3">
            <h4 className="text-xs font-black text-violet-300/80 uppercase tracking-wider flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
              Recomendações
            </h4>
            {displayedRecommendations.map((rec, idx) => (
              <div 
                key={idx} 
                className="flex items-start gap-3 bg-white/[0.03] rounded-xl p-3.5 border border-violet-800/20 hover:bg-white/[0.06] hover:border-violet-600/30 transition-all group"
              >
                <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500/20 to-indigo-500/20 flex items-center justify-center text-violet-300 text-[10px] font-black border border-violet-500/20 mt-0.5 group-hover:from-violet-500/30 group-hover:to-indigo-500/30 transition-all">
                  {idx + 1}
                </span>
                <p className="text-sm text-violet-100/80 font-medium leading-relaxed group-hover:text-violet-100 transition-colors">
                  {rec}
                </p>
              </div>
            ))}

            {/* Show more / less */}
            {insights.recommendations.length > 3 && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="w-full py-2 text-[11px] font-bold text-violet-400 hover:text-violet-300 transition-colors flex items-center justify-center gap-1"
              >
                {expanded ? (
                  <>
                    Ver menos
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 15l7-7 7 7" /></svg>
                  </>
                ) : (
                  <>
                    Ver todas ({insights.recommendations.length})
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                  </>
                )}
              </button>
            )}
          </div>
        )}

        {/* No recommendations - encourage data entry */}
        {!hasRecommendations && (
          <div className="text-center py-6">
            <div className="w-14 h-14 bg-violet-500/10 rounded-2xl flex items-center justify-center text-violet-300 mx-auto mb-4 border border-violet-500/20">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
            </div>
            <p className="text-sm font-bold text-violet-200 mb-2">Dados insuficientes para insights</p>
            <p className="text-xs text-violet-400/70 max-w-md mx-auto leading-relaxed">
              Registre tempos estimados e reais nas suas tarefas para que a IA possa gerar recomendações personalizadas de estudo.
            </p>
          </div>
        )}

        {/* Refresh button */}
        <div className="mt-4 pt-4 border-t border-violet-800/20 flex items-center justify-between">
          <p className="text-[10px] text-violet-500/50 font-medium">
            {insights.generated_at 
              ? `Atualizado em ${new Date(insights.generated_at).toLocaleString('pt-BR', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}`
              : ''}
          </p>
          <button
            onClick={fetchInsights}
            disabled={loading}
            className="text-[11px] font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors active:scale-95"
          >
            <svg className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Atualizar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIInsightsCard;
