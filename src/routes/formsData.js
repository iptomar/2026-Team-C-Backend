const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const authMiddleware = require('../middleware/authMiddleware');
require('dotenv').config();

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// GET /api/submissions
router.get('/', authMiddleware, async (req, res) => {
  try {
    const submissions = await prisma.formsData.findMany({
      where: { madeById: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        form: { select: { id: true, name: true } }
      }
    });
    return res.status(200).json(submissions);
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
});

// GET /api/submissions/:id
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const submission = await prisma.formsData.findUnique({
      where: { id: parseInt(req.params.id) },
      include: { form: { select: { id: true, name: true } } }
    });

    if (!submission) return res.status(404).json({ erro: 'Preenchimento não encontrado' });
    if (submission.madeById !== req.user.id) return res.status(403).json({ erro: 'Sem permissão' });

    return res.status(200).json(submission);
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
});

// POST /api/submissions
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { formId, answers, isDraft } = req.body;

    if (!formId) return res.status(400).json({ erro: 'formId é obrigatório' });

    const submission = await prisma.formsData.create({
      data: {
        formId: parseInt(formId),
        madeById: req.user.id,
        data: { answers, isDraft },
      }
    });

    return res.status(201).json(submission);
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
});

// PUT /api/submissions/:id
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const { answers, isDraft } = req.body;

    const existing = await prisma.formsData.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!existing) return res.status(404).json({ erro: 'Preenchimento não encontrado' });
    if (existing.madeById !== req.user.id) return res.status(403).json({ erro: 'Sem permissão' });

    const submission = await prisma.formsData.update({
      where: { id: parseInt(req.params.id) },
      data: { data: { answers, isDraft } }
    });

    return res.status(200).json(submission);
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
});

// DELETE /api/submissions/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const submission = await prisma.formsData.findUnique({
      where: { id: parseInt(req.params.id) }
    });

    if (!submission) return res.status(404).json({ erro: 'Preenchimento não encontrado' });
    if (submission.madeById !== req.user.id) return res.status(403).json({ erro: 'Sem permissão' });

    await prisma.formsData.delete({ where: { id: parseInt(req.params.id) } });
    return res.status(200).json({ mensagem: 'Eliminado com sucesso' });
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
});

module.exports = router;