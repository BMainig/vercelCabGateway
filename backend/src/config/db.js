const mysql = require("mysql2/promise");

let pool;

async function ensureDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  await connection.query(`
    CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`
    CHARACTER SET utf8mb4
    COLLATE utf8mb4_unicode_ci
  `);

  await connection.end();
}

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
  }

  return pool;
}

async function initDatabase() {
  await ensureDatabase();

  const db = getPool();

  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      user_id INT NOT NULL AUTO_INCREMENT,
      username VARCHAR(80) NOT NULL,
      user_first_name VARCHAR(120) NULL,
      user_last_name VARCHAR(120) NULL,
      user_mail VARCHAR(180) NOT NULL,
      password VARCHAR(255) NOT NULL,
      user_active TINYINT NOT NULL DEFAULT 1,
      last_login DATETIME NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (user_id),
      UNIQUE KEY uk_users_username (username),
      UNIQUE KEY uk_users_mail (user_mail)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS user_sessions (
      session_id INT NOT NULL AUTO_INCREMENT,
      user_id INT NOT NULL,
      token_hash VARCHAR(255) NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NULL,
      PRIMARY KEY (session_id),
      KEY idx_user_sessions_user_id (user_id),
      CONSTRAINT fk_user_sessions_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `);
 /* await db.query(`
    INSERT INTO users (
  username,
  user_first_name,
  user_last_name,
  user_mail,
  password,
  user_active
) VALUES (
  'admin',
  'Admin',
  'CabGateway',
  'admin@cabgateway.local',
  '$2b$10$.mKCzzo39Ucr28K2h8oLqenxILsmiBQm9t0xZy0GCalH2cRLZOEli',
  1
);`)*/

  console.log("Tabelas verificadas/criadas com sucesso.");
}

module.exports = () => ({
  getPool,
  initDatabase,
});