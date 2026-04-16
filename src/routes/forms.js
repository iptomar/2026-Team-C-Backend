const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// POST /api/forms
router.post('/forms', async (req, res) => {
  const { name, html, css, ownerId } = req.body;

  if (!name || !html || !css || !ownerId) {
    return res.status(400).json({ erro: 'name, html, css e ownerId são obrigatórios' });
  }

  try {
    const novoFormulario = await prisma.form.create({
      data: { name, html, css, ownerId: parseInt(ownerId) }
    });
    return res.status(201).json(novoFormulario);
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
});

// GET /api/forms
router.get('/forms', async (req, res) => {
  try {
    const formularios = await prisma.form.findMany({
      include: { owner: { select: { id: true, name: true, email: true } } }
    });
    return res.status(200).json(formularios);
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
});

// GET /api/forms/:id
router.get('/forms/:id', async (req, res) => {
  try {
    const formulario = await prisma.form.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { owner: { select: { id: true, name: true, email: true } } }
    });

    if (!formulario) {
      return res.status(404).json({ erro: 'Formulário não encontrado' });
    }

    return res.status(200).json(formulario);
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
});

// PUT /api/forms/:id
router.put('/forms/:id', async (req, res) => {
  const { name, html, css } = req.body;

  try {
    const formulario = await prisma.form.update({
      where: { id: parseInt(req.params.id) },
      data: { name, html, css }
    });
    return res.status(200).json(formulario);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ erro: 'Formulário não encontrado' });
    }
    return res.status(500).json({ erro: err.message });
  }
});

module.exports = router;