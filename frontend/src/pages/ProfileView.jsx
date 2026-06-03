import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import authService from '../services/authService';

const ProfileView = () => {
  const { user, loginWithToken } = useAuth();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('profile');
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // ─── Profile Form ──────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [profileError, setProfileError] = useState('');

  // ─── Settings Form ─────────────────────────────────────────────
  const [settingsForm, setSettingsForm] = useState({
    email_deadlines: true,
    email_weekly_summary: true,
    timer_limit_hours: 4,
    weekly_study_goal_hours: 10,
  });
  const [settingsError, setSettingsError] = useState('');

  const loadUserData = useCallback(async () => {
    try {
      setLoadingData(true);
      const data = await authService.me();
      setProfileForm(prev => ({
        ...prev,
        name: data.name || '',
        email: data.email || '',
      }));
      if (data.settings) {
        setSettingsForm({
          email_deadlines: data.settings.email_deadlines ?? true,
          email_weekly_summary: data.settings.email_weekly_summary ?? true,
          timer_limit_hours: data.settings.timer_limit_hours ?? 4,
          weekly_study_goal_hours: data.settings.weekly_study_goal_hours ?? 10,
        });
      }
    } catch (err) {
      addToast({ message: 'Erro ao carregar dados do perfil.', type: 'error' });
    } finally {
      setLoadingData(false);
    }
  }, [addToast]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm(prev => ({ ...prev, [name]: value }));
    setProfileError('');
  };

  const handleSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettingsForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setSettingsError('');
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileError('');

    const isChangingPassword = profileForm.currentPassword || profileForm.newPassword || profileForm.confirmPassword;
    if (isChangingPassword) {
      if (!profileForm.currentPassword || !profileForm.newPassword || !profileForm.confirmPassword) {
        setProfileError('Preencha todos os três campos de senha para alterá-la.');
        return;
      }
      if (profileForm.newPassword !== profileForm.confirmPassword) {
        setProfileError('A nova senha e a confirmação não coincidem.');
        return;
      }
      if (profileForm.newPassword.length < 6) {
        setProfileError('A nova senha deve ter no mínimo 6 caracteres.');
        return;
      }
    }

    try {
      setLoadingProfile(true);
      const payload = { name: profileForm.name };
      if (isChangingPassword) {
        payload.currentPassword = profileForm.currentPassword;
        payload.newPassword = profileForm.newPassword;
        payload.confirmPassword = profileForm.confirmPassword;
      }
      await authService.updateProfile(payload);
      addToast({ message: 'Perfil atualizado com sucesso! ✅', type: 'success', duration: 4000 });
      // Clear password fields
      setProfileForm(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      // Refresh user in context
      if (loginWithToken) await loginWithToken(null, profileForm.email);
    } catch (err) {
      const msg = err.response?.data?.message || 'Erro ao salvar perfil. Tente novamente.';
      setProfileError(msg);
    } finally {
      setLoadingProfile(false);
    }
  };

  const handleSettingsSubmit = async (e) => {
    e.preventDefault();
    setSettingsError('');
    try {
      setLoadingSettings(true);
      await authService.updateSettings({
        email_deadlines: settingsForm.email_deadlines,
        email_weekly_summary: settingsForm.email_weekly_summary,
        timer_limit_hours: Number(settingsForm.timer_limit_hours),
        weekly_study_goal_hours: Number(settingsForm.weekly_study_goal_hours),
      });
      addToast({ message: 'Configurações salvas com sucesso! ⚙️', type: 'success', duration: 4000 });
    } catch (err) {
      const msg = err.response?.data?.message || 'Erro ao salvar configurações.';
      setSettingsError(msg);
    } finally {
      setLoadingSettings(false);
    }
  };

  const displayInitial = (profileForm.name || user?.name || 'U').charAt(0).toUpperCase();

  const inputClass = 'w-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent block px-4 py-3 placeholder-gray-400 dark:placeholder-slate-500 transition-all font-medium text-sm';
  const labelClass = 'block text-xs font-black text-gray-400 dark:text-slate-500 uppercase tracking-widest mb-2';

  if (loadingData) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
        <div className="w-16 h-16 rounded-full border-4 border-blue-100 dark:border-slate-700 border-t-blue-600 animate-spin" />
        <p className="text-gray-500 dark:text-slate-400 font-medium">Carregando perfil...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      {/* ─── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-6">
        {/* Avatar grande */}
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-3xl shadow-lg shadow-blue-500/25 shrink-0">
          {displayInitial}
        </div>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {profileForm.name || 'Meu Perfil'}
          </h1>
          <p className="text-gray-500 dark:text-slate-400 mt-1">{profileForm.email}</p>
          <span className="inline-flex items-center gap-1.5 mt-2 text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40 px-2.5 py-1 rounded-full uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Conta Ativa
          </span>
        </div>
      </div>

      {/* ─── Tab Switcher ────────────────────────────────────────── */}
      <div className="flex gap-1 bg-gray-100 dark:bg-slate-800/60 p-1.5 rounded-2xl w-fit">
        {[
          { id: 'profile', label: 'Dados do Perfil', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
          { id: 'settings', label: 'Configurações do Sistema', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-400 shadow-sm'
                : 'text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon} />
            </svg>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ─── TAB 1: Dados do Perfil ───────────────────────────────── */}
      {activeTab === 'profile' && (
        <form onSubmit={handleProfileSubmit} className="space-y-8">
          {/* Informações Cadastrais */}
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-gray-100 dark:border-slate-800 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-50 dark:border-slate-800 pb-4">
              <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-gray-800 dark:text-slate-100">Informações Cadastrais</h2>
                <p className="text-xs text-gray-400 dark:text-slate-500 font-medium">Edite seu nome de exibição</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className={labelClass}>Nome Completo</label>
                <input
                  type="text"
                  name="name"
                  value={profileForm.name}
                  onChange={handleProfileChange}
                  className={inputClass}
                  placeholder="Seu nome completo"
                />
              </div>
              <div>
                <label className={labelClass}>E-mail Acadêmico</label>
                <input
                  type="email"
                  name="email"
                  value={profileForm.email}
                  disabled
                  className={`${inputClass} opacity-60 cursor-not-allowed bg-gray-50 dark:bg-slate-700/50`}
                />
                <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1.5 font-medium">O e-mail não pode ser alterado por segurança da conta.</p>
              </div>
            </div>
          </div>

          {/* Alteração de Senha */}
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-gray-100 dark:border-slate-800 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
            <div className="flex items-center gap-3 border-b border-gray-50 dark:border-slate-800 pb-4">
              <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-gray-800 dark:text-slate-100">Alteração de Senha Segura</h2>
                <p className="text-xs text-gray-400 dark:text-slate-500 font-medium">Deixe em branco se não quiser alterar a senha</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {[
                { name: 'currentPassword', label: 'Senha Atual', placeholder: '••••••••' },
                { name: 'newPassword', label: 'Nova Senha', placeholder: 'Mínimo 6 caracteres' },
                { name: 'confirmPassword', label: 'Confirmar Nova Senha', placeholder: 'Repita a nova senha' },
              ].map(field => (
                <div key={field.name}>
                  <label className={labelClass}>{field.label}</label>
                  <input
                    type="password"
                    name={field.name}
                    value={profileForm[field.name]}
                    onChange={handleProfileChange}
                    className={inputClass}
                    placeholder={field.placeholder}
                    autoComplete="new-password"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Error + Submit */}
          {profileError && (
            <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/40 text-red-700 dark:text-red-400 px-5 py-4 rounded-2xl text-sm font-bold">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              {profileError}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loadingProfile}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
            >
              {loadingProfile ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                  Salvando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                  Salvar Perfil
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* ─── TAB 2: Configurações do Sistema ─────────────────────── */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSettingsSubmit} className="space-y-6">
          {/* Módulo: Notificações */}
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-gray-100 dark:border-slate-800 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-5">
            <div className="flex items-center gap-3 border-b border-gray-50 dark:border-slate-800 pb-4">
              <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-gray-800 dark:text-slate-100">Notificações Acadêmicas</h2>
                <p className="text-xs text-gray-400 dark:text-slate-500 font-medium">Controle os alertas automáticos enviados ao seu e-mail</p>
              </div>
            </div>

            {[
              {
                name: 'email_deadlines',
                label: 'Alertas de Prazos (Deadlines) por E-mail',
                desc: 'Receba avisos automáticos quando tarefas estiverem próximas do vencimento ou atrasadas.',
              },
              {
                name: 'email_weekly_summary',
                label: 'Resumo Semanal de Produtividade da IA',
                desc: 'Receba o relatório semanal do Gemini com análise do seu desempenho diretamente no e-mail.',
              },
            ].map(item => (
              <label key={item.name} className="flex items-start gap-4 cursor-pointer group p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
                <div className="relative mt-0.5 shrink-0">
                  <input
                    type="checkbox"
                    name={item.name}
                    checked={settingsForm[item.name]}
                    onChange={handleSettingsChange}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 rounded-full bg-gray-200 dark:bg-slate-700 peer-checked:bg-blue-600 transition-colors duration-300 peer-focus:ring-2 peer-focus:ring-blue-500/40" />
                  <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transform peer-checked:translate-x-6 transition-transform duration-300" />
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{item.label}</p>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 font-medium leading-relaxed">{item.desc}</p>
                </div>
              </label>
            ))}
          </div>

          {/* Módulo: Cronômetro Automático */}
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-gray-100 dark:border-slate-800 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-5">
            <div className="flex items-center gap-3 border-b border-gray-50 dark:border-slate-800 pb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-gray-800 dark:text-slate-100">Cronômetro Automático</h2>
                <p className="text-xs text-gray-400 dark:text-slate-500 font-medium">Evite métricas distorcidas por sessões esquecidas abertas</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-6 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-800 dark:text-slate-200">Limite máximo do cronômetro contínuo</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 font-medium leading-relaxed">
                  Se uma tarefa ficar na coluna "Em Processo" além deste limite, o cálculo de tempo real é pausado automaticamente — protegendo as suas métricas.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <input
                  type="number"
                  name="timer_limit_hours"
                  min="1"
                  max="24"
                  value={settingsForm.timer_limit_hours}
                  onChange={handleSettingsChange}
                  className="w-20 text-center text-2xl font-black bg-white/60 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-100 rounded-xl px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <span className="text-sm font-bold text-gray-500 dark:text-slate-400">horas</span>
              </div>
            </div>
          </div>

          {/* Módulo: Metas Individuais (Calibração Gemini) */}
          <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border border-gray-100 dark:border-slate-800 rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-5">
            <div className="flex items-center gap-3 border-b border-gray-50 dark:border-slate-800 pb-4">
              <div className="w-9 h-9 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center text-purple-600 dark:text-purple-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-extrabold text-gray-800 dark:text-slate-100">Metas Individuais — Calibração do Gemini AI</h2>
                <p className="text-xs text-gray-400 dark:text-slate-500 font-medium">Estes valores alimentam o prompt da IA para análises personalizadas</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-6 p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors">
              <div className="flex-1">
                <p className="text-sm font-bold text-gray-800 dark:text-slate-200">Meta de horas de estudo focadas por semana</p>
                <p className="text-xs text-gray-400 dark:text-slate-500 mt-1 font-medium leading-relaxed">
                  O Gemini usará este valor como referência matemática para avaliar se você cumpriu o planejado e gerar alertas e recomendações precisos.
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <input
                  type="number"
                  name="weekly_study_goal_hours"
                  min="1"
                  max="100"
                  value={settingsForm.weekly_study_goal_hours}
                  onChange={handleSettingsChange}
                  className="w-20 text-center text-2xl font-black bg-white/60 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 text-gray-900 dark:text-slate-100 rounded-xl px-3 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <span className="text-sm font-bold text-gray-500 dark:text-slate-400">h/semana</span>
              </div>
            </div>

            {/* Gemini calibration badge */}
            <div className="flex items-start gap-3 bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-100 dark:border-indigo-800/30 rounded-2xl px-5 py-4">
              <svg className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"/></svg>
              <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium leading-relaxed">
                <strong className="font-black">IA Calibrada:</strong> Ao salvar, a Central de Inteligência Artificial adaptará os prompts do Gemini para comparar seu progresso real com esta meta semanal, tornando os insights muito mais precisos e personalizados.
              </p>
            </div>
          </div>

          {/* Error + Submit */}
          {settingsError && (
            <div className="flex items-start gap-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-800/40 text-red-700 dark:text-red-400 px-5 py-4 rounded-2xl text-sm font-bold">
              <svg className="w-5 h-5 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
              {settingsError}
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loadingSettings}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold px-8 py-3.5 rounded-2xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:translate-y-0"
            >
              {loadingSettings ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/></svg>
                  Salvando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7"/></svg>
                  Salvar Configurações
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ProfileView;
