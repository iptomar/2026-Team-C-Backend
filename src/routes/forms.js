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
    return res.status(400).json({
      erro: "html é obrigatório",
    });
  }

  const paginaCompleta = `
    <!DOCTYPE html>
    <html lang="pt">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>${css || ""}</style>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `;

  res.setHeader("Content-Type", "text/html");
  return res.status(200).send(paginaCompleta);
});

// POST /api/forms/:id/validate
router.post("/:id/validate", async (req, res) => {
  const { data } = req.body;

  if (!data || typeof data !== "object") {
    return res.status(400).json({
      erro: "data é obrigatório e deve ser um objecto",
    });
  }

  try {
    const formulario = await prisma.form.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
    });

    if (!formulario) {
      return res.status(404).json({
        erro: "Formulário não encontrado",
      });
    }

    let structure;

    try {
      structure = JSON.parse(formulario.css);
    } catch {
      return res.status(200).json({
        valido: true,
        erros: {},
      });
    }

    if (!structure || !structure.fields) {
      return res.status(200).json({
        valido: true,
        erros: {},
      });
    }

    const erros = {};
    let valido = true;

    for (const field of structure.fields) {
      if (field.type === "title") continue;

      const valor = data[field.id];

      const vazio =
        valor === undefined ||
        valor === null ||
        valor === "" ||
        (Array.isArray(valor) && valor.length === 0);

      if (vazio) {
        erros[field.id] = `O campo "${field.label}" é obrigatório`;
        valido = false;
      }
    }

    return res.status(200).json({
      valido,
      erros,
    });
  } catch (err) {
    return res.status(500).json({
      erro: err.message,
    });
  }
});

// POST /api/forms/:id/submit
router.post("/:id/submit", async (req, res) => {
  const { data, madeById } = req.body;

  if (!data || !madeById) {
    return res.status(400).json({
      erro: "data e madeById são obrigatórios",
    });
  }

  try {
    const formulario = await prisma.form.findUnique({
      where: {
        id: parseInt(req.params.id),
      },
    });

    if (!formulario) {
      return res.status(404).json({
        erro: "Formulário não encontrado",
      });
    }

    if (formulario.archived) {
      return res.status(400).json({
        erro: "Este formulário está arquivado e não aceita submissões",
      });
    }

    let structure;

    try {
      structure = JSON.parse(formulario.css);
    } catch {
      structure = null;
    }

    if (structure && structure.fields) {
      const erros = {};
      let valido = true;

      for (const field of structure.fields) {
        if (field.type === "title") continue;

        const valor = data[field.id];

        const vazio =
          valor === undefined ||
          valor === null ||
          valor === "" ||
          (Array.isArray(valor) && valor.length === 0);

        if (vazio) {
          erros[field.id] = `O campo "${field.label}" é obrigatório`;
          valido = false;
        }
      }

      if (!valido) {
        return res.status(422).json({
          erro: "Existem campos obrigatórios por preencher",
          erros,
        });
      }
    }

    const submissao = await prisma.formsData.create({
      data: {
        data,
        formId: parseInt(req.params.id),
        madeById: parseInt(madeById),
      },
    });

    return res.status(201).json(submissao);
  } catch (err) {
    return res.status(500).json({
      erro: err.message,
    });
  }
});

// POST /api/forms
router.post("/", async (req, res) => {
  const { name, html, css, fields, ownerId } = req.body;

  if (!name || !html || !ownerId) {
    return res.status(400).json({
      erro: "name, html e ownerId são obrigatórios",
    });
  }

  try {
    const novoFormulario = await prisma.form.create({
      data: {
        name,
        html,
        css: css || "",
        fields: fields || [],
        ownerId: parseInt(ownerId),
        archived: false,
      },
    });

    return res.status(201).json(novoFormulario);
  } catch (err) {
    console.error("ERRO CREATE FORM:", err);

    return res.status(500).json({
      erro: err.message,
    });
  }
});

// GET /api/forms
router.get("/", async (req, res) => {
  try {
    const { archived } = req.query;

    const where =
      archived !== undefined
        ? {
            archived: archived === "true",
          }
        : {};

    const formularios = await prisma.form.findMany({
      where,
      orderBy: {
        createdAt: "desc",
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

    return res.status(200).json(formularios);
  } catch (err) {
    return res.status(500).json({
      erro: err.message,
    });
  }
});

// GET /api/forms/:id/export
router.get("/:id/export", async (req, res) => {
  try {
    const id = parseInt(req.params.id);

    if (Number.isNaN(id)) {
      return res.status(400).json({
        erro: "ID inválido",
      });
    }

    const formulario = await prisma.form.findUnique({
      where: {
        id,
      },
    });

    if (!formulario) {
      return res.status(404).json({
        erro: "Formulário não encontrado",
      });
    }

    const doc = new PDFDocument({
      margin: 50,
    });

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

    let fields = [];

    if (Array.isArray(formulario.fields)) {
      fields = formulario.fields;
    } else {
      try {
        const structure = JSON.parse(formulario.css);
        fields = structure.fields || [];
      } catch {
        fields = [];
      }
    }

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

    return res.status(500).json({
      erro: err.message,
    });
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
    return res.status(500).json({
      erro: err.message,
    });
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
        css: css || "",
        fields: fields || [],
      },
    });

    return res.status(200).json(formulario);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({
        erro: "Formulário não encontrado",
      });
    }

    return res.status(500).json({
      erro: err.message,
    });
  }
});

// DELETE /api/forms/:id
router.delete("/:id", async (req, res) => {
  try {
    await prisma.form.delete({
      where: {
        id: parseInt(req.params.id),
      },
    });

    return res.status(200).json({
      mensagem: "Formulário eliminado com sucesso",
    });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({
        erro: "Formulário não encontrado",
      });
    }

    return res.status(500).json({
      erro: err.message,
    });
  }
});

// PATCH /api/forms/:id/archive
router.patch("/:id/archive", async (req, res) => {
  try {
    const formulario = await prisma.form.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        archived: true,
      },
    });

    return res.status(200).json(formulario);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({
        erro: "Formulário não encontrado",
      });
    }

    return res.status(500).json({
      erro: err.message,
    });
  }
});

// PATCH /api/forms/:id/unarchive
router.patch("/:id/unarchive", async (req, res) => {
  try {
    const formulario = await prisma.form.update({
      where: {
        id: parseInt(req.params.id),
      },
      data: {
        archived: false,
      },
    });

    return res.status(200).json(formulario);
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({
        erro: "Formulário não encontrado",
      });
    }

    return res.status(500).json({
      erro: err.message,
    });
  }
});

module.exports = router;