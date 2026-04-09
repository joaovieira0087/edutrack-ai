const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  const token = req.header('Authorization');

  if (!token) {
    return res.status(401).json({ message: 'Acesso negado. Nenhum token fornecido.' });
  }

  try {
    const formattedToken = token.replace('Bearer ', '');
    const decoded = jwt.verify(formattedToken, process.env.JWT_SECRET);
    req.user = decoded; // { id: usuario_id }
    next();
  } catch (ex) {
    res.status(400).json({ message: 'Token inválido.' });
  }
};

module.exports = authMiddleware;
