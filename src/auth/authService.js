const { PrismaClient } = require('@prisma/client');
const { hashPassword, comparePassword } = require('./password');
const { PrismaPg } = require('@prisma/adapter-pg')
require('dotenv').config()

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter })

// Registo de utilizador - guarda a password como hash
async function registerUser(email, plainPassword) {
  const hashedPassword = await hashPassword(plainPassword);

  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role,
    },
  });

  return user;
}

// Login - compara a password introduzida com o hash na BD
async function loginUser(email, plainPassword) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new Error('Utilizador não encontrado');
  }

  const isValid = await comparePassword(plainPassword, user.password);

  if (!isValid) {
    throw new Error('Password incorreta');
  }

  return user;
}

module.exports = { registerUser, loginUser };
