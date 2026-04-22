const { registerUser, loginUser, changePassword } = require('../auth/authService');
const { sendEmail } = require('../email/transporter');
const { addToBlacklist } = require('../auth/blacklist');
const { resetPassword, generateLinkforResetPassword } = require('../auth/passwordreset');
const jwt = require('jsonwebtoken');


async function generateResetLink(req, res) {
  try {
    const email = req.body.email;
    await generateLinkforResetPassword(email);
    return res.json({ message: 'Link para reset de password enviado com sucesso' });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}

async function resetUserPassword(req, res) {
  try {
    const { token, newPassword } = req.body;
    await resetPassword(token, newPassword);
    return res.json({ message: 'Password atualizada com sucesso' });
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
}


async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    const user = await registerUser(name, email, password);

    sendEmail(
      email,
      'Bem-vindo ao Lusobites!',
      `Olá ${email},\n\nObrigado por se registar no Lusobites! Estamos entusiasmados em tê-lo conosco. Explore nossos deliciosos pratos e aproveite a experiência gastronômica.\n\nAtenciosamente,\nEquipe Lusobites`
    );

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

async function changeUserPassword(req, res) {
  try {
    const { currentPassword, newPassword } = req.body;
    await changePassword(req.user.userId, currentPassword, newPassword);
    addToBlacklist(req.token, req.user.exp);
    return res.json({ message: 'Password alterada com sucesso. Faça login novamente.' });
  } catch (error) {
    return res.status(error.statusCode || 400).json({ error: error.message || 'Erro ao alterar password.' });
  }
}

module.exports = { register, login, logout, generateResetLink, resetUserPassword, changeUserPassword };
