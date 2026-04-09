const { loginUser } = require('../auth/authService');
const { addToBlacklist } = require('../auth/blacklist.js');
const jwt = require('jsonwebtoken');

async function login(req, res) {
  const { email, password } = req.body;

  const user = await loginUser(email, password);

  const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '8h' });

  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role }
  });
}

async function logout(req, res) {
  const token = req.headers['authorization']?.split(' ')[1];

  if (!token) {
    return res.status(400).json({ message: 'Token em falta' });
  }

  addToBlacklist(token);
  return res.json({ message: 'Logout realizado com sucesso' });
}


module.exports = { login, logout };




