const express = require('express');
const router = express.Router();
const { Pool } = require('pg'); 
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const authMiddleware = require('../middleware/authMiddleware');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL }); 
const adapter = new PrismaPg(pool);                                    
const prisma = new PrismaClient({ adapter });

// GET /api/formsData
router.get('/', authMiddleware, async (req, res) => {
  try {
    const formsData = await prisma.formsData.findMany({
      where: { madeById: req.user.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        form: { select: { id: true, name: true } }
      }
    });
    return res.status(200).json(formsData);
  } catch (err) {
    console.error('GET /formsData error:', err);
    return res.status(500).json({ erro: err.message });
  }
});

// GET /api/formsData/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const formData = await prisma.formsData.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { form: { select: { id: true, name: true } } }
    });

    if (!formData) return res.status(404).json({ erro: 'Preenchimento não encontrado' });
    if (formData.madeById !== req.user.userId) return res.status(403).json({ erro: 'Sem permissão' });

    return res.status(200).json(formData);
  } catch (err) {
    console.error('GET /formsData/:id error:', err);
    return res.status(500).json({ erro: err.message });
  }
});

// POST /api/formsData
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { formId, answers, isDraft } = req.body;

    if (!formId) return res.status(400).json({ erro: 'formId é obrigatório' });

    const formData = await prisma.formsData.create({
      data: {
        formId: parseInt(formId),
        madeById: req.user.userId,
        data: { answers, isDraft },
      }
    });

    return res.status(201).json(formData);
  } catch (err) {
    console.error('POST /formsData error:', err);
    return res.status(500).json({ erro: err.message });
  }
});

// PUT /api/formsData/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { answers, isDraft } = req.body;

    const existingFormData = await prisma.formsData.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!existingFormData) return res.status(404).json({ erro: 'Preenchimento não encontrado' });
    if (existingFormData.madeById !== req.user.userId) return res.status(403).json({ erro: 'Sem permissão' });

    const formData = await prisma.formsData.update({
      where: { id: parseInt(req.params.id) },
      data: { data: { answers, isDraft } }
    });

    return res.status(200).json(formData);
  } catch (err) {
    console.error('PUT /formsData/:id error:', err);
    return res.status(500).json({ erro: err.message });
  }
});

// DELETE /api/formsData/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const formData = await prisma.formsData.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!formData) return res.status(404).json({ erro: 'Preenchimento não encontrado' });
    if (formData.madeById !== req.user.userId) return res.status(403).json({ erro: 'Sem permissão' });

    await prisma.formsData.delete({ where: { id: parseInt(req.params.id) } });
    return res.status(200).json({ mensagem: 'Eliminado com sucesso' });
  } catch (err) {
    console.error('DELETE /formsData/:id error:', err);
    return res.status(500).json({ erro: err.message });
  }
});

module.exports = router;