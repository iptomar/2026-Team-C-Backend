const { registerUser, loginUser } = require('../auth/authService');
const { addToBlacklist } = require('../auth/blacklist');
const jwt = require('jsonwebtoken');

async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    const user = await registerUser(name, email, password);

    return res.status(201).json({
      message: 'Utilizador registado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('ERRO NO REGISTER:', error);

    return res.status(error.statusCode || 400).json({
      error: error.message || 'Erro ao registar utilizador.',
    });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    const user = await loginUser(email, password);

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('ERRO NO LOGIN:', error);

    return res.status(error.statusCode || 400).json({
      error: error.message || 'Erro ao fazer login.',
    });
  }
}

async function logout(req, res) {
  try {
    addToBlacklist(req.token, req.user.exp);
    return res.json({ message: 'Logout realizado com sucesso' });
  } catch (error) {
    console.error('ERRO NO LOGOUT:', error);
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
}

module.exports = { register, login, logout };