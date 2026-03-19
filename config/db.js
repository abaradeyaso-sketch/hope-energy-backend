import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT) || 4000,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // 🛡️ Parse the SSL string from .env
  ssl: process.env.DB_SSL ? JSON.parse(process.env.DB_SSL) : { rejectUnauthorized: true },
});

export default pool;