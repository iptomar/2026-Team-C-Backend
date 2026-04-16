const { registerUser, loginUser } = require('../auth/authService');
const { addToBlacklist } = require('../auth/blacklist');
const jwt = require('jsonwebtoken');

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg')
require('dotenv').config()

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

async function register(req, res) {
  const { name, email, password } = req.body;
  const nameExist = await prisma.user.findFirst({
    where: { name: name },
  });
  if (nameExist){
    return res.status(400).json({ error: 'Nome já existe' });
  }
  const emailExist = await prisma.user.findFirst({
    where: { email: email },
  });
  if (emailExist){
    return res.status(400).json({ error: 'Email já existe' });
  }
  const user = await registerUser(name, email, password);
  res.status(201).json({ message: 'Utilizador registado com sucesso', user: { id: user.id, email: user.email, name: user.name, role: user.role } });

}


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
  addToBlacklist(req.token, req.user.exp);
  return res.json({ message: 'Logout realizado com sucesso' });
}


module.exports = {register, login, logout };




