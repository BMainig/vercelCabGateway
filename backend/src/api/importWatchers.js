module.exports = () => ({
  list: async (req, res) => {
    try {
      const db = req.app.config.db.getPool();

      const [rows] = await db.query(`
        SELECT *
        FROM import_watchers
        ORDER BY id DESC
      `);

      return res.json({
        success: true,
        data: rows,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao listar agendamentos.",
        error: error.message,
      });
    }
  },

  create: async (req, res) => {
    try {
      const db = req.app.config.db.getPool();

      const {
        name,
        mode = "file",
        target_path,
        interval_days = 0,
        interval_hours = 0,
        interval_minutes = 5,
        enabled = 1,
      } = req.body;

      if (!name || !target_path) {
        return res.status(400).json({
          success: false,
          message: "name e target_path são obrigatórios.",
        });
      }

      if (!["file", "directory"].includes(mode)) {
        return res.status(400).json({
          success: false,
          message: "mode deve ser file ou directory.",
        });
      }

      const [result] = await db.query(
        `
        INSERT INTO import_watchers (
          name,
          mode,
          target_path,
          interval_days,
          interval_hours,
          interval_minutes,
          enabled
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
        `,
        [
          name,
          mode,
          target_path,
          Number(interval_days || 0),
          Number(interval_hours || 0),
          Number(interval_minutes || 5),
          enabled ? 1 : 0,
        ]
      );

      await req.app.services.importScheduler.start(req.app);

      return res.status(201).json({
        success: true,
        message: "Agendamento criado com sucesso.",
        id: result.insertId,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao criar agendamento.",
        error: error.message,
      });
    }
  },

  update: async (req, res) => {
    try {
      const db = req.app.config.db.getPool();

      const { id } = req.params;

      const {
        name,
        mode,
        target_path,
        interval_days,
        interval_hours,
        interval_minutes,
        enabled,
      } = req.body;

      await db.query(
        `
        UPDATE import_watchers
        SET
          name = COALESCE(?, name),
          mode = COALESCE(?, mode),
          target_path = COALESCE(?, target_path),
          interval_days = COALESCE(?, interval_days),
          interval_hours = COALESCE(?, interval_hours),
          interval_minutes = COALESCE(?, interval_minutes),
          enabled = COALESCE(?, enabled)
        WHERE id = ?
        `,
        [
          name ?? null,
          mode ?? null,
          target_path ?? null,
          interval_days ?? null,
          interval_hours ?? null,
          interval_minutes ?? null,
          enabled ?? null,
          id,
        ]
      );

      await req.app.services.importScheduler.start(req.app);

      return res.json({
        success: true,
        message: "Agendamento atualizado com sucesso.",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao atualizar agendamento.",
        error: error.message,
      });
    }
  },

  runNow: async (req, res) => {
    try {
      const db = req.app.config.db.getPool();
      const { id } = req.params;

      const [rows] = await db.query(
        `
        SELECT *
        FROM import_watchers
        WHERE id = ?
        LIMIT 1
        `,
        [id]
      );

      if (!rows.length) {
        return res.status(404).json({
          success: false,
          message: "Agendamento não encontrado.",
        });
      }

      await req.app.services.importScheduler.start(req.app);

      return res.json({
        success: true,
        message: "Scheduler reiniciado. A verificação será executada conforme intervalo.",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao executar agendamento.",
        error: error.message,
      });
    }
  },

  remove: async (req, res) => {
    try {
      const db = req.app.config.db.getPool();
      const { id } = req.params;

      await db.query(
        `
        DELETE FROM import_watchers
        WHERE id = ?
        `,
        [id]
      );

      await req.app.services.importScheduler.start(req.app);

      return res.json({
        success: true,
        message: "Agendamento removido com sucesso.",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao remover agendamento.",
        error: error.message,
      });
    }
  },
});