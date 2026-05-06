const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

module.exports = {
  login: async (req, res) => {
    try {
      const db = req.app.config.db.getPool();

      const authHeader = req.headers.authorization;

      if (!authHeader) {
        return res.status(401).json({
          success: false,
          message: "Authorization header não informado.",
        });
      }

      if (!authHeader.startsWith("Basic ")) {
        return res.status(401).json({
          success: false,
          message: "Authorization deve ser Basic.",
        });
      }

      const base64Credentials = authHeader.split(" ")[1];

      if (!base64Credentials) {
        return res.status(401).json({
          success: false,
          message: "Credenciais Basic não informadas.",
        });
      }

      const credentials = Buffer.from(base64Credentials, "base64").toString(
        "utf-8"
      );

      const separatorIndex = credentials.indexOf(":");

      if (separatorIndex === -1) {
        return res.status(401).json({
          success: false,
          message: "Credenciais inválidas.",
        });
      }

      const username = credentials.slice(0, separatorIndex).trim();
      const password = credentials.slice(separatorIndex + 1);

      if (!username || !password) {
        return res.status(401).json({
          success: false,
          message: "Usuário e senha são obrigatórios.",
        });
      }

      const [rows] = await db.query(
        `
        SELECT
          user_id,
          username,
          user_first_name,
          user_last_name,
          user_mail,
          password,
          user_active
        FROM users
        WHERE username = ?
           OR user_mail = ?
        LIMIT 1
        `,
        [username, username]
      );

      console.log("AUTH TYPE: Basic");
      console.log("BASIC USER:", username);
      console.log("USER FOUND:", rows.length > 0);
      console.log("USER ACTIVE:", rows[0]?.user_active);

      if (!rows.length) {
        return res.status(401).json({
          success: false,
          message: "Usuário ou senha inválidos.",
        });
      }

      const user = rows[0];

      if (!user.user_active) {
        return res.status(403).json({
          success: false,
          message: "Usuário inativo.",
        });
      }

      const valid = await bcrypt.compare(password, user.password);

      console.log("PASSWORD VALID:", valid);

      if (!valid) {
        return res.status(401).json({
          success: false,
          message: "Usuário ou senha inválidos.",
        });
      }

      const token = jwt.sign(
        {
          user_id: user.user_id,
          username: user.username,
          user_mail: user.user_mail,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.JWT_EXPIRES_IN || "8h",
        }
      );

      await db.query(
        `
        UPDATE users
        SET last_login = NOW()
        WHERE user_id = ?
        `,
        [user.user_id]
      );

      return res.json({
        success: true,
        message: "Login realizado com sucesso.",
        token,
        user: {
          user_id: user.user_id,
          username: user.username,
          user_first_name: user.user_first_name,
          user_last_name: user.user_last_name,
          user_mail: user.user_mail,
        },
      });
    } catch (error) {
      console.error("Erro no login:", error);

      return res.status(500).json({
        success: false,
        message: "Erro interno ao realizar login.",
        error: error.message,
      });
    }
  },

  me: async (req, res) => {
    return res.json({
      success: true,
      user: req.user,
    });
  },
};