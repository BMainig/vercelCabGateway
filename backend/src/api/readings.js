module.exports = {
  listPending: async (req, res) => {
    try {
      const db = req.app.config.db.getPool();

      const q = String(req.query.q || "").trim();
      const centro = String(req.query.centro || "").trim();
      const deposito = String(req.query.deposito || "").trim();

      const limit = Math.min(
        Math.max(parseInt(req.query.limit || "50", 10), 1),
        200
      );

      const offset = Math.max(parseInt(req.query.offset || "0", 10), 0);

      const where = [`status = 'pending'`];
      const params = [];

      if (q) {
        where.push(`
          (
            centro LIKE ?
            OR deposito LIKE ?
            OR material_number LIKE ?
            OR item LIKE ?
            OR criado_por LIKE ?
          )
        `);

        const like = `%${q}%`;
        params.push(like, like, like, like, like);
      }

      if (centro) {
        where.push(`centro = ?`);
        params.push(centro);
      }

      if (deposito) {
        where.push(`deposito = ?`);
        params.push(deposito);
      }

      const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

      const [countRows] = await db.query(
        `
        SELECT COUNT(*) AS total
        FROM purchase_order_items
        ${whereSql}
        `,
        params
      );

      const [rows] = await db.query(
        `
        SELECT
          id,
          centro,
          deposito,
          material_number,
          expected_quantity,
          criado_por,
          serial_range,
          item,
          status,
          created_at,
          updated_at
        FROM purchase_order_items
        ${whereSql}
        ORDER BY created_at DESC, id DESC
        LIMIT ? OFFSET ?
        `,
        [...params, limit, offset]
      );

      return res.json({
        success: true,
        data: rows,
        pagination: {
          total: countRows[0].total,
          limit,
          offset,
          has_more: offset + rows.length < countRows[0].total,
        },
      });
    } catch (error) {
      console.error("Erro ao listar leituras pendentes:", error);

      return res.status(500).json({
        success: false,
        message: "Erro ao listar leituras pendentes.",
        error: error.message,
      });
    }
  },
};