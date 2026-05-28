const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { sendResetCodeEmail } = require('../services/emailService');

const authController = {
  signup: async (req, res) => {
    try {
      const { name, email, password } = req.body;

      const existingUser = await User.findOne({ email });
      if (existingUser) return res.status(400).json({ message: 'Email já está em uso.' });

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      const user = new User({
        nome: name,
        email: email,
        senha: hashedPassword
      });

      await user.save();

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.status(201).json({ authToken: token });
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

      const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
      res.status(200).json({ authToken: token });
    } catch (error) {
      res.status(500).json({ message: 'Erro no servidor', error: error.message });
    }
  },

  me: async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('-senha');
      if (!user) return res.status(404).json({ message: 'Usuário não encontrado.' });

      // Xano mapeia alguns campos extras, vamos retornar uma estrutura compatível
      res.json({ id: user._id, name: user.nome, email: user.email });
    } catch (error) {
      res.status(500).json({ message: 'Erro no servidor' });
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

