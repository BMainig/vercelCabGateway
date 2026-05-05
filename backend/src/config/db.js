import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

let pool;

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
    });
  }
  return pool;
}

async function testConnection() {
  const conn = await getPool().getConnection();
  try {
    await conn.ping();
    console.log("Banco conectado");
  } finally {
    conn.release();
  }
}

// 🔥 EXPORT PADRÃO CONSIGN
export default () => ({
  getPool,
  testConnection,
});