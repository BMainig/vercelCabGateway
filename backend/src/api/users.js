const bcrypt = require("bcryptjs");

module.exports = (app) => {
  const list = async (req, res) => {
    try {
      const db = app.config.db.getPool();

      const [rows] = await db.query(`
        SELECT 
          user_id,
          username,
          user_first_name,
          user_last_name,
          user_mail,
          user_active,
          last_login,
          created_at,
          updated_at
        FROM users
        ORDER BY user_id DESC
      `);

      return res.json({
        success: true,
        data: rows,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao listar usuários.",
        error: error.message,
      });
    }
  };

  const getById = async (req, res) => {
    try {
      const db = app.config.db.getPool();
      const { id } = req.params;

      const [rows] = await db.query(
        `
        SELECT 
          user_id,
          username,
          user_first_name,
          user_last_name,
          user_mail,
          user_active,
          last_login,
          created_at,
          updated_at
        FROM users
        WHERE user_id = ?
        LIMIT 1
        `,
        [id]
      );

      if (!rows.length) {
        return res.status(404).json({
          success: false,
          message: "Usuário não encontrado.",
        });
      }

      return res.json({
        success: true,
        data: rows[0],
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao buscar usuário.",
        error: error.message,
      });
    }
  };

  const create = async (req, res) => {
    try {
      const db = app.config.db.getPool();

      const {
        username,
        user_first_name,
        user_last_name,
        user_mail,
        password,
      } = req.body;

      if (!username || !user_mail || !password) {
        return res.status(400).json({
          success: false,
          message: "Username, e-mail e senha são obrigatórios.",
        });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const [result] = await db.query(
        `
        INSERT INTO users (
          username,
          user_first_name,
          user_last_name,
          user_mail,
          password,
          user_active
        ) VALUES (?, ?, ?, ?, ?, 1)
        `,
        [
          username,
          user_first_name || null,
          user_last_name || null,
          user_mail,
          passwordHash,
        ]
      );

      return res.status(201).json({
        success: true,
        message: "Usuário criado com sucesso.",
        user_id: result.insertId,
      });
    } catch (error) {
      if (error.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
          success: false,
          message: "Username ou e-mail já cadastrado.",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Erro ao criar usuário.",
        error: error.message,
      });
    }
  };

  const update = async (req, res) => {
    try {
      const db = app.config.db.getPool();
      const { id } = req.params;

      const {
        username,
        user_first_name,
        user_last_name,
        user_mail,
        user_active,
      } = req.body;

      await db.query(
        `
        UPDATE users
        SET
          username = COALESCE(?, username),
          user_first_name = ?,
          user_last_name = ?,
          user_mail = COALESCE(?, user_mail),
          user_active = COALESCE(?, user_active)
        WHERE user_id = ?
        `,
        [
          username || null,
          user_first_name || null,
          user_last_name || null,
          user_mail || null,
          user_active ?? null,
          id,
        ]
      );

      return res.json({
        success: true,
        message: "Usuário atualizado com sucesso.",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao atualizar usuário.",
        error: error.message,
      });
    }
  };

  const changePassword = async (req, res) => {
    try {
      const db = app.config.db.getPool();
      const { id } = req.params;
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({
          success: false,
          message: "A nova senha é obrigatória.",
        });
      }

      const passwordHash = await bcrypt.hash(password, 10);

      await db.query(
        `
        UPDATE users
        SET password = ?
        WHERE user_id = ?
        `,
        [passwordHash, id]
      );

      return res.json({
        success: true,
        message: "Senha alterada com sucesso.",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao alterar senha.",
        error: error.message,
      });
    }
  };

  const deactivate = async (req, res) => {
    try {
      const db = app.config.db.getPool();
      const { id } = req.params;

      await db.query(
        `
        UPDATE users
        SET user_active = 0
        WHERE user_id = ?
        `,
        [id]
      );

      return res.json({
        success: true,
        message: "Usuário desativado com sucesso.",
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: "Erro ao desativar usuário.",
        error: error.message,
      });
    }
  };

  return {
    list,
    getById,
    create,
    update,
    changePassword,
    deactivate,
  };
};