import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../services/authService';

const ForgotPasswordView = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes (600s)
  
  const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  // Timer countdown for Step 2
  useEffect(() => {
    if (step !== 2 || timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [step, timeLeft]);

  // Handle email submission (Step 1)
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor, informe seu e-mail.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await authService.forgotPassword(email);
      setStep(2);
      setTimeLeft(600); // Reset timer to 10 mins
    } catch (err) {
      setError(err.response?.data?.message || 'Ocorreu um erro ao enviar o código. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle OTP digit input changes (Step 2)
  const handleOtpChange = (value, index) => {
    if (isNaN(value)) return;

    const newOtp = [...otp];
    // Keep only the last character entered
    newOtp[index] = value.substring(value.length - 1);
    setOtp(newOtp);
    setError('');

    // Auto-focus next input if value entered
    if (value && index < 3) {
      otpRefs[index + 1].current.focus();
    }
  };

  const handleOtpKeyDown = (e, index) => {
    // Backspace: clear current or focus previous input
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        otpRefs[index - 1].current.focus();
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{4}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtp(digits);
      otpRefs[3].current.focus();
    }
  };

  // Resend OTP code
  const handleResendOtp = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      await authService.forgotPassword(email);
      setTimeLeft(600); // Reset timer
      setOtp(['', '', '', '']);
      otpRefs[0].current.focus();
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao reenviar o código.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Verify OTP code (Step 2)
  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 4) {
      setError('Por favor, insira o código de 4 dígitos.');
      return;
    }

    if (timeLeft <= 0) {
      setError('O código expirou. Solicite um novo código de recuperação.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await authService.verifyCode(email, code);
      setStep(3);
    } catch (err) {
      setError(err.response?.data?.message || 'Código inválido ou expirado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset password (Step 3)
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setError('Preencha ambos os campos de senha.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem.');
      return;
    }

    if (newPassword.length < 6) {
      setError('A senha deve ter no mínimo 6 caracteres.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const code = otp.join('');
      await authService.resetPassword(email, code, newPassword, confirmPassword);
      setSuccessMessage('Sua senha foi alterada com sucesso!');
      
      // Auto redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Falha ao redefinir a senha.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format countdown timer (MM:SS)
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50/50 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        
        {/* Logo e Título */}
        <div className="text-center">
          <img 
            src="/logo.png" 
            alt="EduTrack AI Logo" 
            className="h-24 mx-auto object-contain mb-4 drop-shadow-sm transition-transform hover:scale-105 duration-300" 
          />
          <p className="text-gray-500 mt-2 text-lg">
            Recuperação de Acesso
          </p>
        </div>

        {/* Card Principal */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 sm:p-10 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)] relative overflow-hidden">
          
          {/* Breadcrumb Visual de Etapas */}
          <div className="flex items-center justify-center space-x-3 mb-8">
            <span className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${step >= 1 ? 'bg-blue-600 scale-125' : 'bg-gray-200'}`}></span>
            <span className={`h-0.5 w-8 transition-colors duration-300 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></span>
            <span className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${step >= 2 ? 'bg-blue-600 scale-125' : 'bg-gray-200'}`}></span>
            <span className={`h-0.5 w-8 transition-colors duration-300 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></span>
            <span className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${step >= 3 ? 'bg-blue-600 scale-125' : 'bg-gray-200'}`}></span>
          </div>

          {/* Banner de Erro */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm font-medium flex items-start animate-shake">
              <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              <div>
                <span>{error}</span>
                {step === 2 && timeLeft <= 0 && (
                  <button 
                    onClick={handleResendOtp}
                    className="block text-blue-600 font-bold underline mt-1 hover:text-indigo-700"
                  >
                    Reenviar novo código
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Banner de Sucesso */}
          {successMessage && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-4 rounded-2xl mb-6 text-sm font-medium flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <p className="font-bold text-base text-emerald-900">{successMessage}</p>
              <p className="text-emerald-700/80 mt-1">Redirecionando para o login em instantes...</p>
            </div>
          )}

          {/* ETAPA 1: Inserção de E-mail */}
          {step === 1 && (
            <form onSubmit={handleEmailSubmit} className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-gray-800">Recupere sua senha</h2>
                <p className="text-sm text-gray-500">
                  Informe o e-mail cadastrado na sua conta. Enviaremos um código OTP de 4 dígitos para confirmação.
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="reset-email" className="block text-sm font-bold text-gray-700">E-mail</label>
                <input 
                  type="email" 
                  id="reset-email"
                  required 
                  value={email} 
                  onChange={(e) => { setEmail(e.target.value); setError(''); }} 
                  className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent block px-4 py-3.5 placeholder-gray-400 transition-shadow" 
                  placeholder="seu@email.com"
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting} 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enviando código...
                  </>
                ) : (
                  'Enviar Código'
                )}
              </button>
            </form>
          )}

          {/* ETAPA 2: Código OTP */}
          {step === 2 && (
            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-gray-800">Verifique seu e-mail</h2>
                <p className="text-sm text-gray-500">
                  Insira o código de 4 dígitos enviado para <strong className="text-gray-700">{email}</strong>.
                </p>
              </div>

              {/* Grid de Inputs de Código */}
              <div className="flex justify-center items-center gap-3 my-6">
                {otp.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={otpRefs[idx]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(e.target.value, idx)}
                    onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                    onPaste={handleOtpPaste}
                    className="w-14 h-16 text-center text-2xl font-extrabold bg-gray-50 border-2 border-gray-200 text-blue-900 rounded-2xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all"
                  />
                ))}
              </div>

              {/* Timer de Validade */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500 flex items-center">
                  <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Expira em: <strong className={`ml-1 ${timeLeft <= 60 ? 'text-red-500 animate-pulse' : 'text-gray-700'}`}>{formatTime(timeLeft)}</strong>
                </span>
                
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={timeLeft > 0 && timeLeft < 570} // block spamming (resend every 30s)
                  className="font-bold text-blue-600 hover:text-indigo-700 transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                  Reenviar código
                </button>
              </div>

              <div className="flex space-x-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => { setStep(1); setError(''); }}
                  className="w-1/3 border border-gray-200 text-gray-700 px-4 py-4 rounded-xl font-bold hover:bg-gray-50 transition-colors flex items-center justify-center"
                >
                  Voltar
                </button>

                <button 
                  type="submit" 
                  disabled={isSubmitting || timeLeft <= 0} 
                  className="w-2/3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Verificando...
                    </>
                  ) : (
                    'Confirmar Código'
                  )}
                </button>
              </div>
            </form>
          )}

          {/* ETAPA 3: Nova Senha */}
          {step === 3 && (
            <form onSubmit={handleResetSubmit} className="space-y-6">
              <div className="space-y-2">
                <h2 className="text-xl font-bold text-gray-800">Crie sua nova senha</h2>
                <p className="text-sm text-gray-500">
                  Sua nova senha deve ter pelo menos 6 caracteres e ser diferente das anteriores.
                </p>
              </div>

              <div className="space-y-5">
                <div className="space-y-2">
                  <label htmlFor="new-password" className="block text-sm font-bold text-gray-700">Nova Senha</label>
                  <div className="relative">
                    <input 
                      type={showNewPassword ? "text" : "password"} 
                      id="new-password"
                      required 
                      minLength={6}
                      value={newPassword} 
                      onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                      className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent block px-4 py-3.5 pr-12 placeholder-gray-400 transition-shadow" 
                      placeholder="Mínimo 6 caracteres"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                      aria-label={showNewPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showNewPassword ? (
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

                <div className="space-y-2">
                  <label htmlFor="confirm-password" className="block text-sm font-bold text-gray-700">Confirmar Nova Senha</label>
                  <div className="relative">
                    <input 
                      type={showConfirmPassword ? "text" : "password"} 
                      id="confirm-password"
                      required 
                      minLength={6}
                      value={confirmPassword} 
                      onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                      className="w-full bg-gray-50/50 border border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent block px-4 py-3.5 pr-12 placeholder-gray-400 transition-shadow" 
                      placeholder="Repita a nova senha"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 transition-colors"
                      tabIndex={-1}
                      aria-label={showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    >
                      {showConfirmPassword ? (
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
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting || successMessage} 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Salvando nova senha...
                  </>
                ) : (
                  'Salvar Nova Senha'
                )}
              </button>
            </form>
          )}

          {/* Link Voltar ao Login */}
          <div className="mt-6 text-center border-t border-gray-100 pt-6">
            <Link 
              to="/login"
              className="text-sm font-bold text-blue-600 hover:text-indigo-700 transition-colors"
            >
              Voltar para o Login
            </Link>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordView;
