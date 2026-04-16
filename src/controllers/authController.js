const { registerUser, loginUser } = require('../auth/authService');
const { addToBlacklist } = require('../auth/blacklist');
const jwt = require('jsonwebtoken');

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function isStrongPassword(password) {
  const regex =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&.,:_\-])[A-Za-z\d@$!%*?&.,:_\-]{8,}$/;
  return regex.test(password);
}

async function register(req, res) {
  try {
    const { name, email, password } = req.body;

    const cleanName = name ? name.trim() : '';
    const cleanEmail = email ? email.trim().toLowerCase() : '';
    const cleanPassword = password ? password.trim() : '';

    if (!cleanName || !cleanEmail || !cleanPassword) {
      return res.status(400).json({ error: 'Preencha todos os campos.' });
    }

    if (!isValidEmail(cleanEmail)) {
      return res.status(400).json({ error: 'Email inválido.' });
    }

    if (!isStrongPassword(cleanPassword)) {
      return res.status(400).json({
        error:
          'A palavra-passe deve ter pelo menos 8 caracteres, com maiúscula, minúscula, número e carácter especial.',
      });
    }

    const nameExist = await prisma.user.findFirst({
      where: { name: cleanName },
    });

    if (nameExist) {
      return res.status(400).json({ error: 'Nome já existe' });
    }

    const emailExist = await prisma.user.findFirst({
      where: { email: cleanEmail },
    });

    if (emailExist) {
      return res.status(400).json({ error: 'Email já existe' });
    }

    const user = await registerUser(cleanName, cleanEmail, cleanPassword);

    res.status(201).json({
      message: 'Utilizador registado com sucesso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: 'Erro interno no servidor.' });
  }
}

async function login(req, res) {
  const { email, password } = req.body;

  const user = await loginUser(email, password);

  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({
    token,
    user: { id: user.id, email: user.email, name: user.name, role: user.role }
  });
}

async function logout(req, res) {
  addToBlacklist(req.token, req.user.exp);
  return res.json({ message: 'Logout realizado com sucesso' });
}

module.exports = { register, login, logout };