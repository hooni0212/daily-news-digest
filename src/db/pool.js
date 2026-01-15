const mysql = require("mysql2/promise");

let pool;

/**
 * MySQL connection pool singleton
 */
function getPool() {
  if (pool) return pool;

  const {
    DB_HOST = "127.0.0.1",
    DB_PORT = "3306",
    DB_USER = "root",
    DB_PASSWORD = "",
    DB_NAME = "daily_news_digest",
  } = process.env;

  pool = mysql.createPool({
    host: DB_HOST,
    port: Number(DB_PORT),
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    // MySQL JSON/utf8mb4
    charset: "utf8mb4",
  });

  return pool;
}

module.exports = { getPool };
