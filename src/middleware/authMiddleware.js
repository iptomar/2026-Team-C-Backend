const jwt = require('jsonwebtoken');
const { isBlacklisted } = require('../auth/blacklist');

function authMiddleware(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Token em falta' });
  }

  if (isBlacklisted(token)) {
    return res.status(401).json({ message: 'Sessão inválida, realize o login novamente.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Attach user info to request
    req.token = token; // Attach raw token for downstream use (e.g. logout)
    next();
  } catch {
    return res.status(401).json({ message: 'Token inválido ou expirado' });
  }
}

module.exports = authMiddleware;

