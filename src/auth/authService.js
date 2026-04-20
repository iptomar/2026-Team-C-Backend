const { PrismaClient } = require('@prisma/client');
const { hashPassword, comparePassword } = require('./password');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function createError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

// Registo de utilizador
async function registerUser(name, email, plainPassword) {
  const cleanName = name ? name.trim() : '';
  const cleanEmail = email ? email.trim().toLowerCase() : '';
  const cleanPassword = plainPassword || '';

  const nameExist = await prisma.user.findFirst({
    where: { name: cleanName },
  });

  if (nameExist) {
    throw createError('Nome já existe');
  }

  const emailExist = await prisma.user.findFirst({
    where: { email: cleanEmail },
  });

  if (emailExist) {
    throw createError('Email já existe');
  }

  const hashedPassword = await hashPassword(cleanPassword);

  const user = await prisma.user.create({
    data: {
      email: cleanEmail,
      password: hashedPassword,
      name: cleanName,
      role: 'USER',
    },
  });

  return user;
}

// Login
async function loginUser(email, plainPassword) {
  const cleanEmail = email ? email.trim().toLowerCase() : '';

  const user = await prisma.user.findFirst({
    where: { email: cleanEmail },
  });

  if (!user) {
    throw createError('Utilizador não encontrado', 404);
  }

  const isValid = await comparePassword(plainPassword, user.password);

  if (!isValid) {
    throw createError('Password incorreta', 401);
  }

  return user;
}

async function changePassword(userId, currentPassword, newPassword) {
  if (!currentPassword || !newPassword) {
    throw createError('As passwords não podem estar vazias');
  }

  if (currentPassword === newPassword) {
    throw createError('A nova password deve ser diferente da atual');
  }

  const user = await prisma.user.findUnique({
    where: { id: parseInt(userId) },
  });

  if (!user) {
    throw createError("Utilizador não encontrado", 404);
  }

  const isValid = await comparePassword(currentPassword, user.password);

  if (!isValid) {
    throw createError('Password atual incorreta', 401);
  }

  const hashedPassword = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: parseInt(userId) },
    data: { password: hashedPassword },
  });
}

module.exports = { registerUser, loginUser, changePassword };
