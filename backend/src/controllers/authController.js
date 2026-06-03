const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendResetCodeEmail, sendVerificationCodeEmail } = require('../services/emailService');

const authController = {
  signup: async (req, res) => {
    try {
      const { name, email, password } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ message: 'Email já está em uso.' });

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Gera código OTP de 4 dígitos para verificação de e-mail
      const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
      const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

      const user = new User({
        nome: name,
        email: email,
        senha: hashedPassword,
        is_verified: false,
        verification_code: verificationCode,
        verification_code_expires: verificationCodeExpires
      });

      await user.save();

      // Log visual para desenvolvimento local
      console.log('\n╔══════════════════════════════════════════════════════════╗');
      console.log('║  🛠️  [DEV MODE] CÓDIGO DE VERIFICAÇÃO DE CONTA          ║');
      console.log('╠══════════════════════════════════════════════════════════╣');
      console.log(`║  E-mail: ${email}`);
      console.log(`║  Código OTP: ${verificationCode}`);
      console.log('╚══════════════════════════════════════════════════════════╝\n');

      // Dispara e-mail de verificação
      await sendVerificationCodeEmail(user.email, user.nome, verificationCode);

      // Retorna sucesso SEM token — conta precisa de verificação
      res.status(201).json({
        message: 'Conta criada com sucesso! Verifique seu e-mail para ativar sua conta.',
        requiresVerification: true
      });
    } catch (error) {
      res.status(500).json({ message: 'Erro no servidor', error: error.message });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await User.findOne({ email });
      if (!user) return res.status(400).json({ message: 'Credenciais inválidas.' });

      const validPassword = await bcrypt.compare(password, user.senha);
      if (!validPassword) return res.status(400).json({ message: 'Credenciais inválidas.' });

      // Bloqueio: impedir login de conta não verificada
      if (user.is_verified === false) {
        return res.status(403).json({
          message: 'Seu e-mail ainda não foi verificado. Insira o código de verificação enviado para o seu e-mail.',
          requiresVerification: true,
          email: user.email
        });
      }

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.status(200).json({ authToken: token });
    } catch (error) {
      res.status(500).json({ message: 'Erro no servidor', error: error.message });
    }
  },

  // ──────────────────────────────────────────────────────────────
  // Verificação de E-mail (Signup OTP)
  // ──────────────────────────────────────────────────────────────

  /**
   * Valida o código OTP de verificação de e-mail e ativa a conta
   * POST /api/auth/verify-email
   * Body: { email, code }
   */
  verifyEmail: async (req, res) => {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        return res.status(400).json({ message: 'E-mail e código são obrigatórios.' });
      }

      const user = await User.findOne({ email });

      if (!user) {
        return res.status(404).json({ message: 'Usuário não encontrado.' });
      }

      // Conta já verificada
      if (user.is_verified === true) {
        return res.status(400).json({ message: 'Esta conta já foi verificada. Faça login normalmente.' });
      }

      // Verifica se o código expirou
      if (!user.verification_code_expires || user.verification_code_expires < new Date()) {
        return res.status(400).json({
          message: 'O código expirou. Solicite um novo código de verificação.',
          expired: true
        });
      }

      // Compara o código
      if (user.verification_code !== code) {
        return res.status(400).json({ message: 'Código inválido. Verifique o e-mail e tente novamente.' });
      }

      // Código correto: ativar conta e limpar campos efêmeros
      user.is_verified = true;
      user.verification_code = null;
      user.verification_code_expires = null;
      await user.save();

      console.log(`[AuthController] ✅ E-mail verificado com sucesso para: ${email}`);

      // Gera e retorna o JWT para login automático
      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      return res.status(200).json({
        message: 'E-mail verificado com sucesso!',
        authToken: token
      });
    } catch (error) {
      console.error('[AuthController] Erro em verifyEmail:', error.message);
      res.status(500).json({ message: 'Erro no servidor ao verificar o e-mail.' });
    }
  },

  /**
   * Reenvia o código de verificação de e-mail
   * POST /api/auth/resend-verification
   * Body: { email }
   */
  resendVerificationCode: async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: 'O campo e-mail é obrigatório.' });
      }

      const genericMessage = 'Se este e-mail estiver cadastrado e pendente de verificação, um novo código foi enviado.';

      const user = await User.findOne({ email });

      // Anti-enumeração: retorna sucesso mesmo se e-mail não existir
      if (!user) {
        return res.status(200).json({ message: genericMessage });
      }

      // Conta já verificada
      if (user.is_verified === true) {
        return res.status(200).json({ message: genericMessage });
      }

      // Gera novo código
      const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
      const verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000);

      console.log('\n╔══════════════════════════════════════════════════════════╗');
      console.log('║  🛠️  [DEV MODE] NOVO CÓDIGO DE VERIFICAÇÃO (REENVIO)    ║');
      console.log('╠══════════════════════════════════════════════════════════╣');
      console.log(`║  E-mail: ${email}`);
      console.log(`║  Código OTP: ${verificationCode}`);
      console.log('╚══════════════════════════════════════════════════════════╝\n');

      user.verification_code = verificationCode;
      user.verification_code_expires = verificationCodeExpires;
      await user.save();

      await sendVerificationCodeEmail(user.email, user.nome, verificationCode);

      return res.status(200).json({ message: genericMessage });
    } catch (error) {
      console.error('[AuthController] Erro em resendVerificationCode:', error.message);
      res.status(500).json({ message: 'Erro no servidor ao reenviar o código de verificação.' });
    }
  },

  me: async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('-senha');
      if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });

      res.json({
        id: user._id,
        name: user.nome,
        email: user.email,
        settings: user.settings || {}
      });
    } catch (error) {
      res.status(500).json({ message: 'Erro no servidor' });
    }
  },

  /**
   * Atualiza dados de perfil e/ou senha do usuário autenticado
   * PUT /api/auth/profile
   * Body: { name?, currentPassword?, newPassword?, confirmPassword? }
   */
  updateProfile: async (req, res) => {
    try {
      const { name, currentPassword, newPassword, confirmPassword } = req.body;

      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });

      // Atualiza nome se fornecido
      if (name && name.trim()) {
        user.nome = name.trim();
      }

      // Atualiza senha se os campos de senha foram enviados
      if (currentPassword || newPassword || confirmPassword) {
        if (!currentPassword || !newPassword || !confirmPassword) {
          return res.status(400).json({ message: 'Preencha todos os campos de senha.' });
        }
        if (newPassword !== confirmPassword) {
          return res.status(400).json({ message: 'A nova senha e a confirmação não coincidem.' });
        }
        if (newPassword.length < 6) {
          return res.status(400).json({ message: 'A nova senha deve ter no mínimo 6 caracteres.' });
        }

        const isMatch = await bcrypt.compare(currentPassword, user.senha);
        if (!isMatch) {
          return res.status(400).json({ message: 'Senha atual incorreta.' });
        }

        const salt = await bcrypt.genSalt(10);
        user.senha = await bcrypt.hash(newPassword, salt);
      }

      await user.save();

      res.json({ message: 'Perfil atualizado com sucesso!', name: user.nome, email: user.email });
    } catch (error) {
      console.error('[AuthController] Erro em updateProfile:', error.message);
      res.status(500).json({ message: 'Erro no servidor ao atualizar perfil.' });
    }
  },

  /**
   * Atualiza as configurações comportamentais do usuário
   * PUT /api/auth/settings
   * Body: { email_deadlines, email_weekly_summary, timer_limit_hours, weekly_study_goal_hours }
   */
  updateSettings: async (req, res) => {
    try {
      const { email_deadlines, email_weekly_summary, timer_limit_hours, weekly_study_goal_hours } = req.body;

      const updatePayload = {};
      if (email_deadlines !== undefined) updatePayload['settings.email_deadlines'] = email_deadlines;
      if (email_weekly_summary !== undefined) updatePayload['settings.email_weekly_summary'] = email_weekly_summary;
      if (timer_limit_hours !== undefined) updatePayload['settings.timer_limit_hours'] = Number(timer_limit_hours);
      if (weekly_study_goal_hours !== undefined) updatePayload['settings.weekly_study_goal_hours'] = Number(weekly_study_goal_hours);

      const user = await User.findByIdAndUpdate(
        req.user.id,
        { $set: updatePayload },
        { new: true, select: '-senha' }
      );

      if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });

      res.json({ message: 'Configurações salvas com sucesso!', settings: user.settings });
    } catch (error) {
      console.error('[AuthController] Erro em updateSettings:', error.message);
      res.status(500).json({ message: 'Erro no servidor ao salvar configurações.' });
    }
  },

  // ──────────────────────────────────────────────────────────────
  // Recuperação de Senha via OTP de 4 Dígitos
  // ──────────────────────────────────────────────────────────────

  /**
   * Passo 1: Solicitação de recuperação — gera e envia o código OTP
   * POST /api/auth/forgot-password
   * Body: { email }
   */
  forgotPassword: async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: 'O campo e-mail é obrigatório.' });
      }

      console.log(`[DEV MODE] Iniciando recuperação para o e-mail: ${email}`);

      const user = await User.findOne({ email });

      // Mensagem genérica para prevenir enumeração de usuários (segurança)
      const genericMessage = 'Se este e-mail estiver cadastrado, um código de recuperação foi enviado.';

      if (!user) {
        console.log(`[DEV MODE] ⚠️ ALERTA: E-mail não encontrado no banco. O fluxo foi abortado silenciosamente (Anti-Enumeração).`);
        // Anti-enumeração: retorna sucesso mesmo se o e-mail não existir
        return res.status(200).json({ message: genericMessage });
      }

      // Gera código aleatório de 4 dígitos (1000–9999)
      const resetCode = Math.floor(1000 + Math.random() * 9000).toString();

      // Define expiração: agora + 10 minutos
      const resetCodeExpires = new Date(Date.now() + 10 * 60 * 1000);

      // Log altamente visual para desenvolvimento local (DEV MODE)
      console.log('\n╔══════════════════════════════════════════════════════════╗');
      console.log('║  🛠️  [DEV MODE] CÓDIGO OTP GERADO                       ║');
      console.log('╠══════════════════════════════════════════════════════════╣');
      console.log(`║  E-mail: ${email}`);
      console.log(`║  Código OTP: ${resetCode}`);
      console.log('╚══════════════════════════════════════════════════════════╝\n');

      // Persiste o código e a expiração no documento do usuário
      user.reset_code = resetCode;
      user.reset_code_expires = resetCodeExpires;
      await user.save();

      // Dispara o e-mail (ou fallback via console em modo dev)
      await sendResetCodeEmail(user.email, user.nome, resetCode);

      return res.status(200).json({ message: genericMessage });
    } catch (error) {
      console.error('[AuthController] Erro em forgotPassword:', error.message);
      res.status(500).json({ message: 'Erro no servidor ao processar a recuperação de senha.' });
    }
  },

  /**
   * Passo 2: Validação do código OTP
   * POST /api/auth/verify-code
   * Body: { email, code }
   */
  verifyCode: async (req, res) => {
    try {
      const { email, code } = req.body;

      if (!email || !code) {
        return res.status(400).json({ message: 'E-mail e código são obrigatórios.' });
      }

      const user = await User.findOne({ email });

      if (!user) {
        return res.status(400).json({ message: 'Código inválido ou expirado.' });
      }

      // Verifica se o código expirou
      if (!user.reset_code_expires || user.reset_code_expires < new Date()) {
        return res.status(400).json({
          message: 'O código expirou. Solicite um novo código de recuperação.',
          expired: true
        });
      }

      // Compara o código enviado com o persistido no banco
      if (user.reset_code !== code) {
        return res.status(400).json({ message: 'Código inválido. Verifique e tente novamente.' });
      }

      return res.status(200).json({ message: 'Código verificado com sucesso.' });
    } catch (error) {
      console.error('[AuthController] Erro em verifyCode:', error.message);
      res.status(500).json({ message: 'Erro no servidor ao verificar o código.' });
    }
  },

  /**
   * Passo 3: Gravação da nova senha
   * POST /api/auth/reset-password
   * Body: { email, code, newPassword, confirmPassword }
   */
  resetPassword: async (req, res) => {
    try {
      const { email, code, newPassword, confirmPassword } = req.body;

      // Validação dos campos obrigatórios
      if (!email || !code || !newPassword || !confirmPassword) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
      }

      // Valida correspondência das senhas
      if (newPassword !== confirmPassword) {
        return res.status(400).json({ message: 'As senhas não coincidem.' });
      }

      // Valida tamanho mínimo da senha
      if (newPassword.length < 6) {
        return res.status(400).json({ message: 'A senha deve ter no mínimo 6 caracteres.' });
      }

      const user = await User.findOne({ email });

      if (!user) {
        return res.status(400).json({ message: 'Dados inválidos para redefinição de senha.' });
      }

      // Revalida o código OTP (expiração + correspondência)
      if (!user.reset_code_expires || user.reset_code_expires < new Date()) {
        return res.status(400).json({
          message: 'O código expirou. Solicite um novo código de recuperação.',
          expired: true
        });
      }

      if (user.reset_code !== code) {
        return res.status(400).json({ message: 'Código inválido.' });
      }

      // Gera hash bcrypt da nova senha (custo 10 conforme spec)
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      // Atualiza a senha e limpa os campos efêmeros de recuperação
      user.senha = hashedPassword;
      user.reset_code = null;
      user.reset_code_expires = null;
      await user.save();

      console.log(`[AuthController] ✅ Senha redefinida com sucesso para: ${email}`);
      return res.status(200).json({ message: 'Senha redefinida com sucesso! Faça login com sua nova senha.' });
    } catch (error) {
      console.error('[AuthController] Erro em resetPassword:', error.message);
      res.status(500).json({ message: 'Erro no servidor ao redefinir a senha.' });
    }
  }
};

module.exports = authController;
