// ==========================================================
// 🌞 Hope Energy Backend Server (Unified Mode)
// ==========================================================
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import helmet from "helmet"; 
import db from "./config/db.js";

// ✅ Unified Route Imports
import adminAuth from "./routes/admin/auth.js";
import adminServices from "./routes/admin/services.js";
import adminPartners from "./routes/admin/partners.js";
import adminTeamMembers from "./routes/admin/team_members.js";
import adminNews from "./routes/admin/news.js";
import adminProjects from "./routes/admin/projects.js";

import contactRoute from "./routes/contact.js";
import aboutRoute from "./routes/aboutRoutes.js";

dotenv.config();
const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: true, credentials: true })); // Simplified for testing
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ==========================================================
// 🌐 API Routes (Mapped to Unified Controllers)
// ==========================================================

// Public Access
app.use("/api/projects", adminProjects); // Points to unified file
app.use("/api/news", adminNews);         // Points to unified file
app.use("/api/services", adminServices);
app.use("/api/team_members", adminTeamMembers);
app.use("/api/contact", contactRoute);
app.use("/api/about", aboutRoute);

// Admin Access (Using same files)
app.use("/api/admin/auth", adminAuth);
app.use("/api/admin/projects", adminProjects);
app.use("/api/admin/news", adminNews);
app.use("/api/admin/services", adminServices);
app.use("/api/admin/team_members", adminTeamMembers);

app.get("/", (req, res) => res.send("🌞 Hope Energy Backend is Live!"));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
