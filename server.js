// ==========================================================
// 🌞 Hope Energy Backend Server (Production Optimized)
// ==========================================================

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";
import helmet from "helmet"; // Added for extra security headers
import db from "./config/db.js";
import verifyToken from "./middleware/auth.js";

// ✅ Route Imports
import projectsRoute from "./routes/projects.js";
import newsRoute from "./routes/news.js";
import contactRoute from "./routes/contact.js";
import servicesRoute from "./routes/services.js";
import aboutRoute from "./routes/aboutRoutes.js";

import adminAuth from "./routes/admin/auth.js";
import adminServices from "./routes/admin/services.js";
import adminPartners from "./routes/admin/partners.js";
import adminTeamMembers from "./routes/admin/team_members.js";
import adminTestimonials from "./routes/admin/testimonials.js";
import adminAboutInfo from "./routes/admin/about_info.js";
import adminContactSubmissions from "./routes/admin/contact_submissions.js";
import adminNews from "./routes/admin/news.js";
import adminProjects from "./routes/admin/projects.js";

// ==========================================================
// ⚙️ Configuration & Middleware
// ==========================================================
dotenv.config();
const app = express();

// 🛡️ Security: Helmet helps secure Express apps by setting various HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: false, // Required to serve images from /uploads
}));

// 🌍 Dynamic CORS: Allow local dev AND your future Vercel URL
const allowedOrigins = [
  "http://localhost:5173", // Vite default
  "http://localhost:3000",
  process.env.FRONTEND_URL  // You will set this in Render Dashboard later
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true
}));

app.use(express.json());

// ==========================================================
// 📂 Static File Serving
// ==========================================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ==========================================================
// 🧠 Database Connectivity Check
// ==========================================================
const checkConnection = async () => {
  try {
    const [rows] = await db.query("SELECT 1");
    console.log("✅ TiDB Cloud connected successfully!");
  } catch (err) {
    console.error("❌ Database connection failed. Retrying in 5s...", err.message);
    setTimeout(checkConnection, 5000);
  }
};
checkConnection();

// ==========================================================
// 🌐 API Routes (Public & Admin)
// ==========================================================
app.use("/api/projects", projectsRoute);
app.use("/api/news", newsRoute);
app.use("/api/contact", contactRoute);
app.use("/api/services", servicesRoute);
app.use("/api/about", aboutRoute);

app.use("/api/admin/auth", adminAuth);
app.use("/api/admin/services", adminServices);
app.use("/api/admin/partners", adminPartners);
app.use("/api/admin/team_members", adminTeamMembers);
app.use("/api/admin/testimonials", adminTestimonials);
app.use("/api/admin/about_info", adminAboutInfo);
app.use("/api/admin/contact_submissions", adminContactSubmissions);
app.use("/api/admin/news", adminNews);
app.use("/api/admin/projects", adminProjects);

// ==========================================================
// 👤 Admin Profile Management
// ==========================================================
app.get("/api/admin/me", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id, username FROM admins WHERE id = ?", [req.admin.id]);
    if (rows.length === 0) return res.status(404).json({ message: "Admin not found." });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Server error loading admin info." });
  }
});

app.put("/api/admin/update_profile", verifyToken, async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;
    const [rows] = await db.query("SELECT * FROM admins WHERE id = ?", [req.admin.id]);
    if (rows.length === 0) return res.status(404).json({ message: "Admin not found." });
    
    const admin = rows[0];
    const valid = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!valid) return res.status(400).json({ message: "Current password is incorrect." });

    const updates = [];
    const values = [];

    if (username && username !== admin.username) {
      updates.push("username = ?");
      values.push(username);
    }
    if (newPassword) {
      const saltRounds = parseInt(process.env.ADMIN_PASSWORD_SALT_ROUNDS || "10", 10);
      const hashed = await bcrypt.hash(newPassword, saltRounds);
      updates.push("password_hash = ?");
      values.push(hashed);
    }

    if (updates.length === 0) return res.status(400).json({ message: "No changes detected." });

    values.push(req.admin.id);
    await db.query(`UPDATE admins SET ${updates.join(", ")} WHERE id = ?`, values);
    res.json({ message: "✅ Profile updated successfully!" });
  } catch (err) {
    res.status(500).json({ message: "Server error updating profile." });
  }
});

app.get("/", (req, res) => {
  res.send("🌞 Hope Energy Backend is Live!");
});

// ==========================================================
// 🚀 Start Server
// ==========================================================
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});