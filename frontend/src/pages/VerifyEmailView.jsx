import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';

const VerifyEmailView = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { loginWithToken } = useAuth();
  
  const emailParam = searchParams.get('email') || '';
  const [email] = useState(emailParam);
  const [otp, setOtp] = useState(['', '', '', '']);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes
  
  const otpRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  // Handle OTP digit input changes
  const handleOtpChange = (value, index) => {
    if (isNaN(value)) return;

    const newOtp = [...otp];
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

  // Auto-submit when all 4 digits are filled
  useEffect(() => {
    const code = otp.join('');
    if (code.length === 4 && !isSubmitting && timeLeft > 0) {
      submitOtp(code);
    }
  }, [otp]);

  // Resend OTP code
  const handleResendOtp = async () => {
    if (!email) {
      setError('E-mail não especificado.');
      return;
    }
    setError('');
    setIsSubmitting(true);
    try {
      await authService.resendVerificationCode(email);
      setTimeLeft(900); // Reset timer to 15 mins
      setOtp(['', '', '', '']);
      otpRefs[0].current.focus();
      setSuccessMessage('Um novo código de verificação foi enviado para o seu e-mail.');
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao reenviar o código de verificação.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit verification code
  const submitOtp = async (code) => {
    if (!email) {
      setError('E-mail inválido ou ausente.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const response = await authService.verifyEmail(email, code);
      setSuccessMessage('E-mail verificado com sucesso!');
      
      // Auto login after success
      if (response && response.authToken) {
        await loginWithToken(response.authToken, email);
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        setTimeout(() => {
          navigate('/login');
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Código inválido ou expirado.');
      setOtp(['', '', '', '']);
      otpRefs[0].current.focus();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 4) {
      setError('Por favor, preencha todos os 4 dígitos.');
      return;
    }
    submitOtp(code);
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
          <p className="text-gray-500 mt-2 text-lg font-medium">
            Verificação de E-mail
          </p>
        </div>

        {/* Card Principal */}
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 sm:p-10 border border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.06)] relative overflow-hidden">
          
          {/* Banner de Erro */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 text-sm font-medium flex items-start animate-shake">
              <svg className="w-5 h-5 mr-2 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              <div>
                <span>{error}</span>
                {timeLeft <= 0 && (
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
              <p className="text-emerald-700/80 mt-1">Carregando painel de controle...</p>
            </div>
          )}

          <form onSubmit={handleManualSubmit} className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-xl font-bold text-gray-800">Ative sua conta</h2>
              <p className="text-sm text-gray-500">
                Insira o código de 4 dígitos enviado para <strong className="text-gray-700">{email || 'seu e-mail'}</strong>.
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
                  disabled={isSubmitting}
                  onChange={(e) => handleOtpChange(e.target.value, idx)}
                  onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                  onPaste={handleOtpPaste}
                  className="w-14 h-16 text-center text-2xl font-extrabold bg-gray-50 border-2 border-gray-200 text-blue-900 rounded-2xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none transition-all disabled:opacity-55"
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
                disabled={timeLeft > 0 && timeLeft < 870} // block spamming (resend every 30s)
                className="font-bold text-blue-600 hover:text-indigo-700 transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                Reenviar código
              </button>
            </div>

            <div className="flex space-x-3 pt-2">
              <button 
                type="submit" 
                disabled={isSubmitting || timeLeft <= 0} 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
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

export default VerifyEmailView;
