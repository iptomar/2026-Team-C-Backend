const express = require("express");
const router = express.Router();
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const PDFDocument = require("pdfkit");
require("dotenv").config();

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

// POST /api/forms/preview
router.post("/preview", (req, res) => {
  const { html, css } = req.body;

  if (!html) {
    return res.status(400).json({ erro: "html é obrigatório" });
  }

  const paginaCompleta = `
    <!DOCTYPE html>
    <html lang="pt">
      <head>
        <meta charset="UTF-8" />
        <style>${css || ""}</style>
      </head>
      <body>${html}</body>
    </html>
  `;

  res.setHeader("Content-Type", "text/html");
  return res.status(200).send(paginaCompleta);
});

// POST /api/forms
router.post("/", async (req, res) => {
  const { name, html, css, fields, ownerId } = req.body;

  if (!name || !html || !css || !ownerId) {
    return res.status(400).json({
      erro: "name, html, css e ownerId são obrigatórios",
    });
  }

  try {
    const novoFormulario = await prisma.form.create({
      data: {
        name,
        html,
        css,
        fields: fields || [],
        ownerId: parseInt(ownerId),
        archived: false,
      },
    });

    return res.status(201).json(novoFormulario);
  } catch (err) {
    console.error("ERRO CREATE FORM:", err);
    return res.status(500).json({ erro: err.message });
  }
});

// GET /api/forms
router.get("/", async (req, res) => {
  try {
    const formularios = await prisma.form.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return res.status(200).json(formularios);
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
});

// GET /api/forms/:id/export
router.get("/:id/export", async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({ erro: "ID inválido" });
    }

    const formulario = await prisma.form.findUnique({
      where: { id },
    });

    if (!formulario) {
      return res.status(404).json({
        erro: "Formulário não encontrado",
      });
    }

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="formulario-${id}.pdf"`
    );

    doc.pipe(res);

    doc.fontSize(22).text(formulario.name || "Formulário", {
      align: "center",
    });

    doc.moveDown();

    doc
      .fontSize(12)
      .text(
        `Criado em: ${new Date(formulario.createdAt).toLocaleDateString(
          "pt-PT"
        )}`
      );

    doc.moveDown();

    const fields = formulario.fields || [];

    if (fields.length === 0) {
      doc.fontSize(12).text("Sem campos.");
    } else {
      fields.forEach((field, index) => {
        doc.fontSize(14).text(`${index + 1}. ${field.label || "Campo"}`);
        doc.fontSize(11).text(`Tipo: ${field.type || "N/A"}`);

        if (field.placeholder) {
          doc.text(`Placeholder: ${field.placeholder}`);
        }

        doc.moveDown();
      });
    }

    doc.end();
  } catch (err) {
    console.error("ERRO EXPORT PDF:", err);
    return res.status(500).json({ erro: err.message });
  }
});

// GET /api/forms/:id
router.get("/:id", async (req, res) => {
  try {
    const formulario = await prisma.form.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!formulario) {
      return res.status(404).json({
        erro: "Formulário não encontrado",
      });
    }

    return res.status(200).json(formulario);
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
});

// PUT /api/forms/:id
router.put("/:id", async (req, res) => {
  const { name, html, css, fields } = req.body;

  try {
    const formulario = await prisma.form.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        name,
        html,
        css,
        fields: fields || [],
      },
    });

    return res.status(200).json(formulario);
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
});

// PATCH /api/forms/:id/archive
router.patch("/:id/archive", async (req, res) => {
  try {
    const formulario = await prisma.form.update({
      where: { id: parseInt(req.params.id) },
      data: { archived: true },
    });

    return res.status(200).json(formulario);
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
});

// PATCH /api/forms/:id/unarchive
router.patch("/:id/unarchive", async (req, res) => {
  try {
    const formulario = await prisma.form.update({
      where: { id: parseInt(req.params.id) },
      data: { archived: false },
    });

    return res.status(200).json(formulario);
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
});

// DELETE /api/forms/:id
router.delete("/:id", async (req, res) => {
  try {
    await prisma.form.delete({
      where: { id: parseInt(req.params.id) },
    });

    return res.status(200).json({
      mensagem: "Formulário eliminado com sucesso",
    });
  } catch (err) {
    return res.status(500).json({ erro: err.message });
  }
});

module.exports = router;