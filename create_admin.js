// backend/scripts/create_admin.js
import bcrypt from "bcrypt";
import dotenv from "dotenv";
// Corrected path for db.js - createAdmin.js is in 'backend/scripts', so it needs to go up one level to 'backend' then into 'config'
import db from "./config/db.js";

dotenv.config();

const username = process.argv[2] || "admin";
const password = process.argv[3] || "HopeAdmin123";
const saltRounds = parseInt(process.env.ADMIN_PASSWORD_SALT_ROUNDS || "10", 10);

const createAdmin = async () => {
  try {
    const [rows] = await db.query("SELECT * FROM admins WHERE username = ?", [username]);
    const hash = await bcrypt.hash(password, saltRounds);

    if (rows.length > 0) {
      console.log(`⚙️  Admin "${username}" already exists — updating password...`);
      await db.query("UPDATE admins SET password_hash = ? WHERE username = ?", [hash, username]);
    } else {
      await db.query("INSERT INTO admins (username, password_hash) VALUES (?, ?)", [username, hash]);
      console.log(`✅ Admin user "${username}" created successfully!`);
    }

    console.log(`🔑 Username: ${username}`);
    console.log(`🔐 Password: ${password}`);
  } catch (err) {
    console.error("❌ Error creating admin:", err.message);
  } finally {
    process.exit(0);
  }
};

createAdmin();