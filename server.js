// ==========================================================
// 🌞 Hope Energy Backend Server (Full Corrected Version)
// ==========================================================

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet"; 
import db from "./config/db.js";

// ✅ Route Imports
import projectsRoute from "./routes/admin/projects.js"; // Unified
import newsRoute from "./routes/admin/news.js";         // Unified
import contactRoute from "./routes/contact.js";
import servicesRoute from "./routes/admin/services.js"; // Unified
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

dotenv.config();
const app = express();

// ==========================================================
// 🛡️ Middleware
// ==========================================================
app.use(helmet({
  crossOriginResourcePolicy: false, 
}));

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://hope-energy-frontend-rho.vercel.app"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || origin === process.env.FRONTEND_URL) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json());

// ==========================================================
// 📂 Static File Pathing
// ==========================================================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ==========================================================
// 🧠 Database Connectivity (TiDB Cloud)
// ==========================================================
const checkConnection = async () => {
  try {
    await db.query("SELECT 1");
    console.log("✅ TiDB Cloud connected successfully!");
  } catch (err) {
    console.error("❌ TiDB Connection Error:", err.message);
    setTimeout(checkConnection, 5000);
  }
};
checkConnection();

// ==========================================================
// 🌐 API Routes (Unified for Public & Admin)
// ==========================================================

// Public & Admin Routes (Pointing to the same logic files)
app.use("/api/projects", projectsRoute);
app.use("/api/news", newsRoute);
app.use("/api/contact", contactRoute);
app.use("/api/services", servicesRoute);
app.use("/api/about", aboutRoute);

app.use("/api/admin/auth", adminAuth);
app.use("/api/admin/services", servicesRoute);
app.use("/api/admin/partners", adminPartners);
app.use("/api/admin/team_members", adminTeamMembers);
app.use("/api/admin/testimonials", adminTestimonials);
app.use("/api/admin/about_info", adminAboutInfo);
app.use("/api/admin/contact_submissions", adminContactSubmissions);
app.use("/api/admin/news", newsRoute);
app.use("/api/admin/projects", projectsRoute);

app.get("/", (req, res) => {
  res.send("🌞 Hope Energy Backend is Live!");
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
