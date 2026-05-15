const fs = require("fs");
const path = require("path");
const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

function normalizeHeader(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[º°]/g, "")
    .replace(/\s+/g, "_");
}

function parseCsvLine(line) {
  const result = [];
  let current = "";
  let insideQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];

    if (char === '"' && insideQuotes && next === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === ";" && !insideQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  result.push(current.trim());

  return result;
}

function parseCsvBuffer(buffer) {
  const content = buffer.toString("utf8").replace(/^\uFEFF/, "");

  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (!lines.length) {
    throw new Error("Arquivo CSV vazio.");
  }

  const headers = parseCsvLine(lines[0]).map(normalizeHeader);

  const requiredHeaders = [
    "centro",
    "deposito",
    "n_do_material",
    "valor",
    "criado_por",
    "range_seriais",
    "item",
  ];

  const missing = requiredHeaders.filter((h) => !headers.includes(h));

  if (missing.length) {
    throw new Error(
      `Cabeçalho inválido. Campos ausentes: ${missing.join(", ")}`
    );
  }

  return lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);

    const row = {};

    headers.forEach((header, i) => {
      row[header] = values[i] || "";
    });

    row.__line = index + 2;

    return row;
  });
}

function expandSerialRange(value) {
  const raw = String(value || "").trim();

  if (!raw) return [];

  const parts = raw
    .split(/[,\|]/)
    .map((p) => p.trim())
    .filter(Boolean);

  const serials = [];

  for (const part of parts) {
    const rangeMatch = part.match(/^(\d+)\s*-\s*(\d+)$/);

    if (rangeMatch) {
      const startRaw = rangeMatch[1];
      const endRaw = rangeMatch[2];

      const start = Number(startRaw);
      const end = Number(endRaw);

      if (!Number.isInteger(start) || !Number.isInteger(end) || end < start) {
        serials.push(part);
        continue;
      }

      const width = Math.max(startRaw.length, endRaw.length);

      for (let n = start; n <= end; n++) {
        serials.push(String(n).padStart(width, "0"));
      }
    } else {
      serials.push(part);
    }
  }

  return Array.from(new Set(serials));
}

function getSafeImportPath(inputPath) {
  const baseDir = process.env.CSV_IMPORT_BASE_DIR;

  if (!baseDir) {
    throw new Error("CSV_IMPORT_BASE_DIR não configurado no .env.");
  }

  const resolvedBase = path.resolve(baseDir);
  const resolvedFile = path.resolve(resolvedBase, inputPath);

  if (!resolvedFile.startsWith(resolvedBase)) {
    throw new Error("Caminho inválido fora do diretório permitido.");
  }

  return resolvedFile;
}

async function processImport({
  db,
  req,
  filename,
  buffer,
  source,
}) {
  const conn = await db.getConnection();

  try {
    const rows = parseCsvBuffer(buffer);

    if (!rows.length) {
      throw new Error("CSV não possui linhas para importar.");
    }

    await conn.beginTransaction();

    let importedRows = 0;
    const errors = [];

    for (const row of rows) {
      const centro = String(row.centro || "").trim();
      const deposito = String(row.deposito || "").trim();
      const materialNumber = String(row.n_do_material || "").trim();
      const expectedQuantity = Number(row.valor || 0);
      const criadoPor = String(row.criado_por || "").trim();
      const serialRange = String(row.range_seriais || "").trim();
      const item = String(row.item || "").trim();

      if (
        !centro ||
        !deposito ||
        !materialNumber ||
        !item ||
        !Number.isInteger(expectedQuantity) ||
        expectedQuantity <= 0
      ) {
        errors.push(
          `Linha ${row.__line}: dados obrigatórios inválidos.`
        );
        continue;
      }

      const serials = expandSerialRange(serialRange);

      if (!serials.length) {
        errors.push(
          `Linha ${row.__line}: range_seriais vazio ou inválido.`
        );
        continue;
      }

      if (serials.length !== expectedQuantity) {
        errors.push(
          `Linha ${row.__line}: quantidade esperada (${expectedQuantity}) diferente da quantidade de seriais (${serials.length}).`
        );
        continue;
      }

      const [result] = await conn.query(
        `
        INSERT INTO purchase_order_items (
          centro,
          deposito,
          material_number,
          expected_quantity,
          criado_por,
          serial_range,
          item,
          status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, 'pending')
        ON DUPLICATE KEY UPDATE
          expected_quantity = VALUES(expected_quantity),
          criado_por = VALUES(criado_por),
          serial_range = VALUES(serial_range),
          status = 'pending',
          updated_at = NOW()
        `,
        [
          centro,
          deposito,
          materialNumber,
          expectedQuantity,
          criadoPor || null,
          serialRange,
          item,
        ]
      );

      let purchaseOrderItemId = result.insertId;

      if (!purchaseOrderItemId) {
        const [existing] = await conn.query(
          `
          SELECT id
          FROM purchase_order_items
          WHERE centro = ?
            AND deposito = ?
            AND material_number = ?
            AND item = ?
          LIMIT 1
          `,
          [centro, deposito, materialNumber, item]
        );

        purchaseOrderItemId = existing[0].id;

        await conn.query(
          `
          DELETE FROM expected_serials
          WHERE purchase_order_item_id = ?
            AND received = 0
          `,
          [purchaseOrderItemId]
        );
      }

      for (const serial of serials) {
        await conn.query(
          `
          INSERT INTO expected_serials (
            purchase_order_item_id,
            serial,
            received
          )
          VALUES (?, ?, 0)
          ON DUPLICATE KEY UPDATE
            purchase_order_item_id = VALUES(purchase_order_item_id)
          `,
          [purchaseOrderItemId, serial]
        );
      }

      importedRows++;
    }

    if (errors.length) {
      await conn.rollback();

      return {
        success: false,
        statusCode: 400,
        message: "CSV possui erros e foi rejeitado.",
        errors,
      };
    }

    const [logResult] = await conn.query(
      `
      INSERT INTO import_logs (
        filename,
        status,
        total_rows,
        imported_rows,
        error_message,
        imported_by
      )
      VALUES (?, 'success', ?, ?, ?, ?)
      `,
      [
        filename,
        rows.length,
        importedRows,
        `Fonte: ${source}`,
        req.user?.user_id || null,
      ]
    );

    await conn.commit();

    return {
      success: true,
      statusCode: 201,
      message: "CSV importado com sucesso.",
      import_id: logResult.insertId,
      filename,
      source,
      total_rows: rows.length,
      imported_rows: importedRows,
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

module.exports = () => ({
  upload,

  importCsvUpload: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "Arquivo CSV não informado. Envie no campo file.",
        });
      }

      const db = req.app.config.db.getPool();

      const result = await processImport({
        db,
        req,
        filename: req.file.originalname,
        buffer: req.file.buffer,
        source: "upload",
      });

      return res.status(result.statusCode).json(result);
    } catch (error) {
      console.error("Erro ao importar CSV por upload:", error);

      return res.status(500).json({
        success: false,
        message: "Erro ao importar CSV por upload.",
        error: error.message,
      });
    }
  },

  importCsvFromPath: async (req, res) => {
    try {
      const { filePath } = req.body;

      if (!filePath) {
        return res.status(400).json({
          success: false,
          message: "Informe filePath no body.",
        });
      }

      const fullPath = getSafeImportPath(filePath);

      if (!fs.existsSync(fullPath)) {
        return res.status(404).json({
          success: false,
          message: "Arquivo CSV não encontrado.",
          path: fullPath,
        });
      }

      const buffer = fs.readFileSync(fullPath);

      const db = req.app.config.db.getPool();

      const result = await processImport({
        db,
        req,
        filename: path.basename(fullPath),
        buffer,
        source: fullPath,
      });

      return res.status(result.statusCode).json(result);
    } catch (error) {
      console.error("Erro ao importar CSV por caminho:", error);

      return res.status(500).json({
        success: false,
        message: "Erro ao importar CSV por caminho.",
        error: error.message,
      });
    }
  },

  importCsvFromDirectory: async (req, res) => {
    try {
      const baseDir = process.env.CSV_IMPORT_BASE_DIR;

      if (!baseDir) {
        return res.status(500).json({
          success: false,
          message:
            "CSV_IMPORT_BASE_DIR não configurado no .env.",
        });
      }

      const files = fs
        .readdirSync(baseDir)
        .filter((file) =>
          file.toLowerCase().endsWith(".csv")
        );

      if (!files.length) {
        return res.json({
          success: true,
          message:
            "Nenhum CSV encontrado para importação.",
          imported: [],
        });
      }

      const db = req.app.config.db.getPool();

      const imported = [];
      const failed = [];

      for (const file of files) {
        try {
          const fullPath = path.join(baseDir, file);

          const buffer = fs.readFileSync(fullPath);

          const result = await processImport({
            db,
            req,
            filename: file,
            buffer,
            source: fullPath,
          });

          if (result.success) {
            imported.push(result);
          } else {
            failed.push({
              filename: file,
              errors: result.errors,
            });
          }
        } catch (error) {
          failed.push({
            filename: file,
            error: error.message,
          });
        }
      }

      return res.json({
        success: failed.length === 0,
        message:
          failed.length === 0
            ? "Importação do diretório concluída com sucesso."
            : "Importação concluída com algumas falhas.",
        imported,
        failed,
      });
    } catch (error) {
      console.error(
        "Erro ao importar CSV do diretório:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Erro ao importar CSV do diretório.",
        error: error.message,
      });
    }
  },

  importFileInternal: async ({
    app,
    user,
    filePath,
  }) => {
    const db = app.config.db.getPool();

    const buffer = fs.readFileSync(filePath);

    return processImport({
      db,
      req: {
        user,
      },
      filename: path.basename(filePath),
      buffer,
      source: filePath,
    });
  },

  importDirectoryInternal: async ({
    app,
    user,
    directoryPath,
  }) => {
    const db = app.config.db.getPool();

    const files = fs
      .readdirSync(directoryPath)
      .filter((file) =>
        file.toLowerCase().endsWith(".csv")
      );

    const imported = [];
    const failed = [];

    for (const file of files) {
      try {
        const fullPath = path.join(directoryPath, file);

        const buffer = fs.readFileSync(fullPath);

        const result = await processImport({
          db,
          req: {
            user,
          },
          filename: file,
          buffer,
          source: fullPath,
        });

        if (result.success) {
          imported.push(result);
        } else {
          failed.push({
            filename: file,
            errors: result.errors,
          });
        }
      } catch (error) {
        failed.push({
          filename: file,
          error: error.message,
        });
      }
    }

    return {
      success: failed.length === 0,
      imported,
      failed,
    };
  },

  listImports: async (req, res) => {
    try {
      const db = req.app.config.db.getPool();

      const [rows] = await db.query(`
        SELECT
          id,
          filename,
          status,
          total_rows,
          imported_rows,
          error_message,
          imported_by,
          created_at
        FROM import_logs
        ORDER BY id DESC
        LIMIT 100
      `);

      return res.json({
        success: true,
        data: rows,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao listar importações.",
        error: error.message,
      });
    }
  },
});