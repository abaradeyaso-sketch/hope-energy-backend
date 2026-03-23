import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

// 🚀 Database Configuration
const poolConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: parseInt(process.env.DB_PORT, 10) || 4000,
  
  // 🛡️ TiDB Cloud Production SSL Requirements
  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  },

  // ⚡ Pool Management (Performance)
  waitForConnections: true,
  connectionLimit: 10,    // Max 10 simultaneous connections
  maxIdle: 10,            // Max idle connections, the default value is the same as `connectionLimit`
  idleTimeout: 60000,     // Idle connections timeout, in milliseconds (1 minute)
  queueLimit: 0,
  enableKeepAlive: true,  // Keeps the connection from dropping
  keepAliveInitialDelay: 10000
};

// Create the pool
const pool = mysql.createPool(poolConfig);

// 🧠 Immediate Connection Test & Feedback
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log("-----------------------------------------");
    console.log("✅ SUCCESS: Connected to TiDB Cloud!");
    console.log(`🌐 Host: ${poolConfig.host}`);
    console.log("-----------------------------------------");
    connection.release(); // Important: release the connection back to the pool
  } catch (err) {
    console.error("-----------------------------------------");
    console.error("❌ ERROR: Database Connection Failed!");
    console.error(`Reason: ${err.message}`);
    console.log("-----------------------------------------");
  }
})();

export default pool;
