import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginView = () => {
  const navigate = useNavigate();
  const { login, signup } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      if (isSignup) {
        await signup(formData);
        navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`);
      } else {
        await login({ email: formData.email, password: formData.password });
        navigate('/dashboard');
      }
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.requiresVerification) {
        // Redireciona para tela de verificação se e-mail não verificado
        navigate(`/verify-email?email=${encodeURIComponent(formData.email)}`);
      } else {
        const message = err.response?.data?.message || 'Ocorreu um erro. Verifique seus dados e tente novamente.';
        setError(message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo e Título  */}
        <div className="text-center">
          <img
            src="/logo.png"
            alt="EduTrack AI Logo"
            className="h-24 mx-auto object-contain mb-4 drop-shadow-sm transition-transform hover:scale-105 duration-300"
          />
          <p className="text-gray-500 mt-2 text-lg">
            {isSignup ? 'Crie sua conta para começar' : 'Acesse sua plataforma acadêmica'}
          </p>
        </div>

        {/* Card do Formulário */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 sm:p-10 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)]">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm font-medium flex items-center">
              <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {isSignup && (
              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-bold text-gray-700">Nome Completo</label>
                <input type="text" id="name" name="name" required={isSignup} value={formData.name} onChange={handleChange} className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent block px-4 py-3.5 placeholder-gray-400 transition-shadow" placeholder="Seu nome completo" />
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-bold text-gray-700">E-mail</label>
              <input type="email" id="email" name="email" required value={formData.email} onChange={handleChange} className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent block px-4 py-3.5 placeholder-gray-400 transition-shadow" placeholder="seu@email.com" />
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-bold text-gray-700">Senha</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} id="password" name="password" required minLength="6" value={formData.password} onChange={handleChange} className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent block px-4 py-3.5 pr-12 placeholder-gray-400 transition-shadow" placeholder="Mínimo 6 caracteres" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-5 0-9.27-3.11-11-7.5a11.72 11.72 0 013.168-4.477M6.343 6.343A9.97 9.97 0 0112 5c5 0 9.27 3.11 11 7.5a11.72 11.72 0 01-4.168 4.477M6.343 6.343L3 3m3.343 3.343l2.829 2.829m4.486 4.486l2.829 2.829M6.343 6.343l11.314 11.314M14.121 14.121A3 3 0 009.879 9.879" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {!isSignup && (
              <div className="text-right -mt-2">
                <Link to="/esqueci-senha" className="text-sm font-bold text-blue-600 hover:text-indigo-700 transition-colors">
                  Esqueci minha senha
                </Link>
              </div>
            )}

            <button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed mt-2">
              {isSubmitting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isSignup ? 'Criando conta...' : 'Entrando...'}
                </>
              ) : (
                isSignup ? 'Criar Conta' : 'Entrar'
              )}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-gray-100 pt-6">
            <button
              onClick={() => { setIsSignup(!isSignup); setError(''); }}
              className="text-sm font-bold text-blue-600 hover:text-indigo-700 transition-colors"
            >
              {isSignup ? 'Já tem uma conta? Faça login' : 'Não tem conta? Cadastre-se'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
