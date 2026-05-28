const mysql = require("mysql2/promise");

let pool;

function buildSslOption() {
  if (String(process.env.DB_SSL).toLowerCase() === "true") {
    return { rejectUnauthorized: false };
  }
  return undefined;
}

async function ensureDatabase() {
  if (!process.env.DB_NAME) return;

  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      ssl: buildSslOption(),
    });

    await connection.query(`
      CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\`
      CHARACTER SET utf8mb4
      COLLATE utf8mb4_unicode_ci
    `);

    await connection.end();
  } catch (error) {
    console.warn(
      `Nao foi possivel criar o database "${process.env.DB_NAME}" automaticamente (${error.code || error.message}). ` +
        "Assumindo que o database ja existe (comum em MySQL gerenciado gratuito).",
    );
  }
}

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      ssl: buildSslOption(),
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
  await db.query(`
  CREATE TABLE IF NOT EXISTS purchase_order_items (
    id INT NOT NULL AUTO_INCREMENT,
    centro VARCHAR(80) NOT NULL,
    deposito VARCHAR(80) NOT NULL,
    material_number VARCHAR(120) NOT NULL,
    expected_quantity INT NOT NULL DEFAULT 0,
    criado_por VARCHAR(120) NULL,
    serial_range TEXT NULL,
    item VARCHAR(120) NOT NULL,
    status ENUM('pending', 'in_progress', 'complete', 'incomplete', 'accepted', 'rejected') NOT NULL DEFAULT 'pending',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY uk_purchase_order_item (centro, deposito, material_number, item),
    KEY idx_purchase_order_items_status (status),
    KEY idx_purchase_order_items_material (material_number),
    KEY idx_purchase_order_items_item (item)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`);
await db.query(`
  CREATE TABLE IF NOT EXISTS import_logs (
    id INT NOT NULL AUTO_INCREMENT,
    filename VARCHAR(255) NOT NULL,
    status ENUM('success', 'error') NOT NULL,
    total_rows INT NOT NULL DEFAULT 0,
    imported_rows INT NOT NULL DEFAULT 0,
    error_message TEXT NULL,
    imported_by INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`);

await db.query(`
  CREATE TABLE IF NOT EXISTS expected_serials (
    id INT NOT NULL AUTO_INCREMENT,
    purchase_order_item_id INT NOT NULL,
    serial VARCHAR(120) NOT NULL,
    received TINYINT NOT NULL DEFAULT 0,
    received_at DATETIME NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uk_expected_serial (serial),
    KEY idx_expected_serials_order_item (purchase_order_item_id),
    CONSTRAINT fk_expected_serials_order_item
      FOREIGN KEY (purchase_order_item_id)
      REFERENCES purchase_order_items(id)
      ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
`);
await db.query(`
  CREATE TABLE IF NOT EXISTS import_watchers (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(120) NOT NULL,
    mode ENUM('file', 'directory') NOT NULL DEFAULT 'file',
    target_path VARCHAR(500) NOT NULL,
    interval_days INT NOT NULL DEFAULT 0,
    interval_hours INT NOT NULL DEFAULT 0,
    interval_minutes INT NOT NULL DEFAULT 5,
    enabled TINYINT NOT NULL DEFAULT 1,
    last_signature VARCHAR(255) NULL,
    last_checked_at DATETIME NULL,
    last_imported_at DATETIME NULL,
    last_status ENUM('idle', 'success', 'error', 'unchanged') NOT NULL DEFAULT 'idle',
    last_message TEXT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NULL ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_import_watchers_enabled (enabled)
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