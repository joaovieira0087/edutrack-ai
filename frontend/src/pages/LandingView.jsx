import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

/* ─── Animated Counter Hook ─── */
const useCountUp = (target, duration = 2000) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start = 0;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);
  return count;
};

/* ─── Kanban Mini Card ─── */
const KanbanMiniCard = ({ title, subject, color, delay = '0ms' }) => (
  <div
    className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300"
    style={{ animationDelay: delay }}
  >
    <div className={`text-[9px] font-bold uppercase tracking-widest ${color} mb-1.5`}>{subject}</div>
    <p className="text-xs font-semibold text-gray-700 dark:text-slate-300 leading-snug">{title}</p>
  </div>
);

const LandingView = () => {
  const tasksCount = useCountUp(1247);
  const insightsCount = useCountUp(892);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-gray-900 dark:text-gray-100 overflow-x-hidden">

      {/* ═══════ NAVBAR ═══════ */}
      <nav className={`sticky top-0 z-50 transition-all duration-500 ${scrolled ? 'bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-slate-800/50 shadow-sm' : 'bg-transparent border-b border-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 via-violet-600 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:shadow-indigo-500/40 group-hover:scale-105 transition-all duration-300">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <span className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
              EduTrack <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-500">AI</span>
            </span>
          </Link>

          {/* CTA Buttons */}
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-5 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-200 dark:border-slate-700 hover:border-gray-300 dark:hover:border-slate-600 rounded-xl transition-all duration-300 hidden sm:inline-flex"
            >
              Entrar
            </Link>
            <Link
              to="/login"
              className="px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all duration-300"
            >
              Criar Conta Grátis
            </Link>
          </div>
        </div>
      </nav>

      {/* ═══════ HERO SECTION ═══════ */}
      <section className="relative py-16 sm:py-24 lg:py-32 overflow-hidden">
        {/* Background Glow Decorations */}
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-gradient-to-br from-indigo-500/30 to-violet-500/30 rounded-full blur-3xl opacity-30 dark:opacity-20 pointer-events-none"></div>
        <div className="absolute bottom-1/4 -right-32 w-80 h-80 bg-gradient-to-br from-cyan-400/30 to-blue-500/30 rounded-full blur-3xl opacity-25 dark:opacity-15 pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-violet-500/10 to-cyan-500/10 rounded-full blur-3xl opacity-40 dark:opacity-20 pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center relative">
          {/* Left Column: Text */}
          <div className="flex flex-col gap-8 text-center lg:text-left">
            {/* Tech Badge */}


            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight">
              Domine sua rotina acadêmica com{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500">
                inteligência analítica invisível.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-gray-500 dark:text-gray-400 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Múltiplas disciplinas, prazos apertados e desorganização? O EduTrack AI calcula seu progresso ponderado, rastreia tempo automaticamente e entrega insights personalizados do Gemini — tudo em segundo plano.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <Link
                to="/login"
                className="group relative px-8 py-4 text-base font-bold text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 rounded-2xl shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 active:scale-95 transition-all duration-300"
              >
                <span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-300"></span>
                <span className="relative flex items-center gap-2">
                  Começar Agora — É Grátis
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>
              </Link>

              <a href="#features" className="px-6 py-4 text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-300 flex items-center gap-2">
                Ver recursos
                <svg className="w-4 h-4 animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </a>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-6 justify-center lg:justify-start pt-2">
              <div className="text-center">
                <span className="text-2xl font-black text-gray-900 dark:text-white">{tasksCount.toLocaleString()}+</span>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Tarefas rastreadas</p>
              </div>
              <div className="w-px h-10 bg-gray-200 dark:bg-slate-700"></div>
              <div className="text-center">
                <span className="text-2xl font-black text-gray-900 dark:text-white">{insightsCount.toLocaleString()}+</span>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Insights gerados</p>
              </div>
              <div className="w-px h-10 bg-gray-200 dark:bg-slate-700"></div>
              <div className="text-center">
                <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">98%</span>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Satisfação</p>
              </div>
            </div>
          </div>

          {/* Right Column: App Preview Mockup */}
          <div className="relative flex items-center justify-center lg:justify-end">
            {/* Decorative Circles */}
            <div className="absolute -top-8 -right-8 w-64 h-64 bg-gradient-to-br from-indigo-400/20 to-violet-400/20 rounded-full blur-3xl opacity-50 pointer-events-none"></div>
            <div className="absolute -bottom-8 -left-8 w-48 h-48 bg-gradient-to-br from-cyan-400/20 to-blue-400/20 rounded-full blur-3xl opacity-40 pointer-events-none"></div>

            {/* Main App Window */}
            <div className="relative w-full max-w-md">
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-700 shadow-2xl overflow-hidden">
                {/* Window Header */}
                <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-800/50">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-400"></span>
                    <span className="w-3 h-3 rounded-full bg-amber-400"></span>
                    <span className="w-3 h-3 rounded-full bg-emerald-400"></span>
                  </div>
                  <div className="flex-1 text-center">
                    <span className="text-[10px] font-bold text-gray-400 dark:text-slate-500 uppercase tracking-widest">EduTrack AI — Dashboard</span>
                  </div>
                </div>

                {/* Mock Content */}
                <div className="p-5 space-y-4">
                  {/* Mini Stats Row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-indigo-50 dark:bg-indigo-950/30 rounded-xl p-3 text-center border border-indigo-100 dark:border-indigo-900/50">
                      <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">87%</p>
                      <p className="text-[9px] font-bold text-indigo-500/70 uppercase tracking-wider">Progresso</p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-xl p-3 text-center border border-emerald-100 dark:border-emerald-900/50">
                      <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">12</p>
                      <p className="text-[9px] font-bold text-emerald-500/70 uppercase tracking-wider">Concluídas</p>
                    </div>
                    <div className="bg-violet-50 dark:bg-violet-950/30 rounded-xl p-3 text-center border border-violet-100 dark:border-violet-900/50">
                      <p className="text-lg font-black text-violet-600 dark:text-violet-400">-15%</p>
                      <p className="text-[9px] font-bold text-violet-500/70 uppercase tracking-wider">Desvio</p>
                    </div>
                  </div>

                  {/* Mini Chart Mockup */}
                  <div className="bg-gray-50 dark:bg-slate-800 rounded-xl p-4 border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase tracking-widest">Tempo por Disciplina</span>
                      <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-800">+12% eficiência</span>
                    </div>
                    {/* SVG Bar Chart */}
                    <svg viewBox="0 0 280 80" className="w-full h-16" preserveAspectRatio="none">
                      <rect x="10" y="20" width="45" height="60" rx="6" fill="#c7d2fe" className="dark:opacity-60" />
                      <rect x="10" y="35" width="45" height="45" rx="6" fill="#6366f1" />
                      <rect x="70" y="10" width="45" height="70" rx="6" fill="#c7d2fe" className="dark:opacity-60" />
                      <rect x="70" y="25" width="45" height="55" rx="6" fill="#6366f1" />
                      <rect x="130" y="30" width="45" height="50" rx="6" fill="#c7d2fe" className="dark:opacity-60" />
                      <rect x="130" y="40" width="45" height="40" rx="6" fill="#6366f1" />
                      <rect x="190" y="5" width="45" height="75" rx="6" fill="#c7d2fe" className="dark:opacity-60" />
                      <rect x="190" y="15" width="45" height="65" rx="6" fill="#6366f1" />
                    </svg>
                  </div>

                  {/* AI Insight Card */}
                  <div className="bg-gradient-to-br from-indigo-900 to-violet-900 rounded-xl p-4 text-white relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="relative flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-500/30 flex items-center justify-center shrink-0 border border-indigo-400/30 mt-0.5">
                        <svg className="w-4 h-4 text-indigo-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-indigo-200 uppercase tracking-widest mb-1">Insight do Gemini</p>
                        <p className="text-xs text-indigo-100 font-medium leading-relaxed italic">
                          "Você está 15% mais eficiente em Engenharia de Software esta semana! Continue focando nos horários matutinos."
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Badge */}
              <div className="absolute -bottom-4 -left-4 bg-white dark:bg-slate-800 rounded-2xl px-4 py-3 border border-gray-100 dark:border-slate-700 shadow-xl flex items-center gap-3 animate-bounce" style={{ animationDuration: '3s' }}>
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs font-black text-gray-800 dark:text-slate-200">Tarefa Concluída!</p>
                  <p className="text-[10px] text-gray-400 font-bold">Tempo real calculado: 42min</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ FEATURES SECTION ═══════ */}
      <section id="features" className="py-20 sm:py-28 bg-gray-50/50 dark:bg-slate-900/50 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-50/50 dark:from-indigo-950/20 via-transparent to-transparent pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 relative">
          {/* Section Header */}
          <div className="text-center mb-16">
            <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-800/50 text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-6">
              Recursos Poderosos
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-4">
              Por que gerenciar seus estudos{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-cyan-500">
                com o EduTrack AI?
              </span>
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              Ferramentas inteligentes que trabalham silenciosamente para maximizar sua performance acadêmica.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Feature 1 */}
            <div className="group bg-white dark:bg-slate-800 rounded-2xl p-7 border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-50 dark:from-indigo-950/30 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-100 to-violet-100 dark:from-indigo-900/40 dark:to-violet-900/40 flex items-center justify-center mb-5 shadow-sm group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">
                  <svg className="w-7 h-7 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-base font-black text-gray-900 dark:text-white mb-2">Cronômetro Invisível</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  O tempo gasto em cada tarefa é calculado automaticamente ao movê-la no Kanban. Zero pop-ups, zero interrupções.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group bg-white dark:bg-slate-800 rounded-2xl p-7 border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-violet-50 dark:from-violet-950/30 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/40 dark:to-purple-900/40 flex items-center justify-center mb-5 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <svg className="w-7 h-7 text-violet-600 dark:text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-base font-black text-gray-900 dark:text-white mb-2">Insights Atômicos (Gemini AI)</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  Cada tarefa concluída gera uma dica personalizada da IA para calibrar seus próximos planejamentos com precisão.
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group bg-white dark:bg-slate-800 rounded-2xl p-7 border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-cyan-50 dark:from-cyan-950/30 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/40 dark:to-blue-900/40 flex items-center justify-center mb-5 shadow-sm group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300">
                  <svg className="w-7 h-7 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-base font-black text-gray-900 dark:text-white mb-2">Visão Estratégica Ponderada</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  Progresso inteligente baseado em pesos: tarefas mais complexas pontuam mais no gráfico geral de evolução.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="group bg-white dark:bg-slate-800 rounded-2xl p-7 border border-gray-100 dark:border-slate-700 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-50 dark:from-emerald-950/30 to-transparent rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/40 dark:to-teal-900/40 flex items-center justify-center mb-5 shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                  <svg className="w-7 h-7 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-base font-black text-gray-900 dark:text-white mb-2">Relatórios Executivos PDF</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                  Gráficos analíticos profissionais gerados via motor Python para acompanhar sua evolução a longo prazo.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ KANBAN DEMO SECTION ═══════ */}
      <section className="py-20 sm:py-28 relative overflow-hidden">
        <div className="absolute top-0 left-1/3 w-72 h-72 bg-gradient-to-br from-violet-400/10 to-cyan-400/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="text-center mb-14">
            <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-violet-50 dark:bg-violet-950/40 border border-violet-100 dark:border-violet-800/50 text-xs font-bold text-violet-600 dark:text-violet-400 mb-6">
              Preview do App
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
              Arraste, solte e{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-cyan-500">
                o tempo se calcula sozinho.
              </span>
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              O quadro Kanban do EduTrack AI registra automaticamente quando você inicia e conclui cada tarefa.
            </p>
          </div>

          {/* Kanban Board Preview */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-gray-200 dark:border-slate-700 shadow-2xl p-6 sm:p-8 overflow-x-auto">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 min-w-[600px]">
              {/* Column: A Fazer */}
              <div className="bg-amber-50/50 dark:bg-amber-950/10 rounded-2xl p-4 border border-amber-100/50 dark:border-amber-900/30">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/40"></span>
                  <h4 className="text-sm font-black text-gray-800 dark:text-slate-200 uppercase tracking-wider">A Fazer</h4>
                  <span className="text-[10px] font-bold text-amber-600 bg-amber-100 dark:bg-amber-900/30 px-2 py-0.5 rounded-full ml-auto">3</span>
                </div>
                <div className="space-y-3">
                  <KanbanMiniCard title="Relatório de Banco de Dados" subject="Banco de Dados II" color="text-blue-600" />
                  <KanbanMiniCard title="Lista de Exercícios #4" subject="Cálculo III" color="text-violet-600" delay="100ms" />
                  <KanbanMiniCard title="Leitura: Cap. 7 - Processos" subject="Sist. Operacionais" color="text-emerald-600" delay="200ms" />
                </div>
              </div>

              {/* Column: Em Progresso */}
              <div className="bg-blue-50/50 dark:bg-blue-950/10 rounded-2xl p-4 border border-blue-100/50 dark:border-blue-900/30">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/40"></span>
                  <h4 className="text-sm font-black text-gray-800 dark:text-slate-200 uppercase tracking-wider">Em Progresso</h4>
                  <span className="text-[10px] font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/30 px-2 py-0.5 rounded-full ml-auto">2</span>
                </div>
                <div className="space-y-3">
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border-2 border-blue-300 dark:border-blue-600 shadow-md ring-2 ring-blue-200/50 dark:ring-blue-500/20">
                    <div className="text-[9px] font-bold uppercase tracking-widest text-indigo-600 mb-1.5">Eng. de Software</div>
                    <p className="text-xs font-semibold text-gray-700 dark:text-slate-300 leading-snug">Diagrama UML - Casos de Uso</p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <svg className="w-3 h-3 text-blue-500 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8v4l3 3" />
                      </svg>
                      <span className="text-[9px] font-bold text-blue-500">Cronômetro ativo: 28min</span>
                    </div>
                  </div>
                  <KanbanMiniCard title="Estudo Prova P2" subject="Redes de Computadores" color="text-orange-600" />
                </div>
              </div>

              {/* Column: Concluídas */}
              <div className="bg-emerald-50/50 dark:bg-emerald-950/10 rounded-2xl p-4 border border-emerald-100/50 dark:border-emerald-900/30">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/40"></span>
                  <h4 className="text-sm font-black text-gray-800 dark:text-slate-200 uppercase tracking-wider">Concluídas</h4>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-100 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full ml-auto">2</span>
                </div>
                <div className="space-y-3">
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-gray-100 dark:border-slate-700 shadow-sm opacity-80">
                    <div className="text-[9px] font-bold uppercase tracking-widest text-emerald-600 mb-1.5">Eng. de Software</div>
                    <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 leading-snug line-through">Pesquisa SCRUM vs Kanban</p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-[9px] font-bold text-emerald-500">Tempo real: 1h 15min</span>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-slate-800 rounded-xl p-3 border border-gray-100 dark:border-slate-700 shadow-sm opacity-80">
                    <div className="text-[9px] font-bold uppercase tracking-widest text-violet-600 mb-1.5">Cálculo III</div>
                    <p className="text-xs font-semibold text-gray-400 dark:text-slate-500 leading-snug line-through">Lista de Exercícios #3</p>
                    <div className="mt-2 flex items-center gap-1.5">
                      <svg className="w-3 h-3 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-[9px] font-bold text-emerald-500">Tempo real: 47min</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ FOOTER / CTA FINAL ═══════ */}
      <footer className="relative bg-gradient-to-b from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-950 border-t border-gray-200 dark:border-slate-800">
        {/* CTA Block */}
        <div className="max-w-4xl mx-auto px-6 py-20 sm:py-28 text-center relative">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-indigo-500/10 to-violet-500/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="relative">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight mb-6">
              Pronto para elevar o nível do seu{' '}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500">
                progresso acadêmico?
              </span>
            </h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-xl mx-auto mb-10">
              Junte-se a estudantes que já transformaram seus estudos com análise inteligente e rastreamento automático de produtividade.
            </p>

            <Link
              to="/login"
              className="group relative inline-flex items-center gap-3 px-10 py-5 text-lg font-bold text-white bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 rounded-2xl shadow-xl shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-105 active:scale-95 transition-all duration-300"
            >
              <span className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-600 via-violet-600 to-cyan-500 blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></span>
              <span className="relative">Criar Minha Conta Grátis</span>
              <svg className="w-5 h-5 relative group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 dark:border-slate-800 py-6">
          <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-lg flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-sm font-bold text-gray-500 dark:text-gray-400">
                © {new Date().getFullYear()} EduTrack AI. Todos os direitos reservados.
              </span>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
              Produtividade Acadêmica Inteligente. 2026 - EduTrack AI
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingView;
