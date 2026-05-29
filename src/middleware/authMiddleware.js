const jwt = require('jsonwebtoken');
const { isBlacklisted } = require('../auth/blacklist');

function authMiddleware(req, res, next) {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({ message: 'Token em falta' });
  }
  if (isBlacklisted(token)) {
    return res.status(401).json({ message: 'Sessão inválida, realize o login novamente.' });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    req.token = token;
    next();
  } catch {
    return res.status(401).json({ message: 'Token inválido ou expirado' });
  }
}

module.exports = authMiddleware;

