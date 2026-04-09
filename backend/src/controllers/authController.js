const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
  }
};

module.exports = authController;
