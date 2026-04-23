const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
require('dotenv').config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const allowedFieldTypes = [
  'text',
  'textarea',
  'number',
  'email',
  'checkbox',
  'radio',
  'select',
  'date',
  'upload',
  'stars',
  'title',
];

function validateFieldTypes(fields) {
  if (!Array.isArray(fields)) {
    return 'fields tem de ser um array';
  }

  for (const field of fields) {
    if (!field || typeof field !== 'object') {
      return 'Cada campo tem de ser um objeto válido';
    }

    if (!field.type) {
      return `Campo sem type (id: ${field.id || 'desconhecido'})`;
    }

    if (!allowedFieldTypes.includes(field.type)) {
      return `Tipo de campo inválido: ${field.type}`;
    }
  }

  return null;
}

// POST /api/forms
router.post('/forms', async (req, res) => {
  const { name, html, css, ownerId, fields } = req.body;

if (
  name === undefined ||
  html === undefined ||
  css === undefined ||
  ownerId === undefined ||
  fields === undefined
) {
  return res.status(400).json({
    erro: 'name, html, css, ownerId e fields são obrigatórios',
  });
}

  const typeError = validateFieldTypes(fields);
  if (typeError) {
    return res.status(400).json({ erro: typeError });
  }

  try {
    const novoFormulario = await prisma.form.create({
      data: {
        name,
        html,
        css,
        fields,
        ownerId: parseInt(ownerId),
        archived: false,
      },
    });

    return res.status(201).json(novoFormulario);
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
});

// GET /api/forms
router.get('/forms', async (req, res) => {
  try {
    const { archived } = req.query;

    const where =
      archived !== undefined
        ? { archived: archived === 'true' }
        : {};

    const formularios = await prisma.form.findMany({
      where,
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
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
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
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
  const { name, html, css, fields } = req.body;

  if (fields !== undefined) {
    const typeError = validateFieldTypes(fields);
    if (typeError) {
      return res.status(400).json({ erro: typeError });
    }
  }

  try {
    const formulario = await prisma.form.update({
      where: { id: parseInt(req.params.id) },
      data: {
        name,
        html,
        css,
        ...(fields !== undefined && { fields }),
      },
    });

    return res.status(200).json(formulario);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ erro: 'Formulário não encontrado' });
    }
    return res.status(500).json({ erro: err.message });
  }
});

// DELETE /api/forms/:id
router.delete('/forms/:id', async (req, res) => {
  try {
    await prisma.form.delete({
      where: { id: parseInt(req.params.id) },
    });

    return res
      .status(200)
      .json({ mensagem: 'Formulário eliminado com sucesso' });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ erro: 'Formulário não encontrado' });
    }
    return res.status(500).json({ erro: err.message });
  }
});

// PATCH /api/forms/:id/archive
router.patch('/forms/:id/archive', async (req, res) => {
  try {
    const formulario = await prisma.form.update({
      where: { id: parseInt(req.params.id) },
      data: { archived: true },
    });

    return res.status(200).json(formulario);
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ erro: 'Formulário não encontrado' });
    }
    return res.status(500).json({ erro: err.message });
  }
});

// PATCH /api/forms/:id/unarchive
router.patch('/forms/:id/unarchive', async (req, res) => {
  try {
    const formulario = await prisma.form.update({
      where: { id: parseInt(req.params.id) },
      data: { archived: false },
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