import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs"; 
import db from "../config/db.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// ✅ 1. Ensure Projects upload folder exists (Match Partner Logic)
const uploadDir = path.join(process.cwd(), "uploads/projects");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ✅ 2. Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// ✅ Helper to format full image URL (Forces HTTPS for Vercel)
const formatProjectURL = (req, imagePath) => {
  if (!imagePath) return null;
  // If it's already a full URL, return it; otherwise, build the HTTPS link
  if (imagePath.startsWith("http")) return imagePath;
  return `https://${req.get("host")}${imagePath}`;
};

/* ===========================
    🌍 Public Routes
=========================== */

// ➤ Get all projects (public)
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM projects ORDER BY id DESC");
    const formatted = rows.map((p) => ({
      ...p,
      images: formatProjectURL(req, p.images),
    }));
    res.json(formatted);
  } catch (err) {
    console.error("❌ Get projects error:", err);
    res.status(500).json({ message: "Failed to fetch projects" });
  }
});

// ➤ Get single project by ID (public)
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM projects WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: "Project not found" });
    
    const project = rows[0];
    project.images = formatProjectURL(req, project.images);
    
    res.json(project);
  } catch (err) {
    console.error("❌ Get single project error:", err);
    res.status(500).json({ message: "Failed to fetch project" });
  }
});

/* ===========================
    🔐 Admin Protected Routes
=========================== */

// ➕ Add new project
router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    const { title, description } = req.body;
    const imagePath = req.file ? `/uploads/projects/${req.file.filename}` : null;

    const [result] = await db.query(
      "INSERT INTO projects (title, description, images) VALUES (?, ?, ?)",
      [title, description, imagePath]
    );

    res.json({ 
        id: result.insertId, 
        title, 
        description, 
        images: formatProjectURL(req, imagePath) 
    });
  } catch (err) {
    console.error("❌ Add project error:", err);
    res.status(500).json({ message: "Failed to add project" });
  }
});

// ✏️ Update existing project
router.put("/:id", auth, upload.single("image"), async (req, res) => {
  try {
    const { title, description } = req.body;
    // Use new file if uploaded, otherwise use the existing image path from body
    let imagePath = req.file ? `/uploads/projects/${req.file.filename}` : req.body.images;

    await db.query(
      "UPDATE projects SET title = ?, description = ?, images = ? WHERE id = ?",
      [title, description, imagePath, req.params.id]
    );

    const [rows] = await db.query("SELECT * FROM projects WHERE id = ?", [req.params.id]);
    const updated = rows[0];
    updated.images = formatProjectURL(req, updated.images);

    res.json(updated);
  } catch (err) {
    console.error("❌ Update project error:", err);
    res.status(500).json({ message: "Failed to update project" });
  }
});

// 🗑 Delete project
router.delete("/:id", auth, async (req, res) => {
  try {
    await db.query("DELETE FROM projects WHERE id = ?", [req.params.id]);
    res.json({ message: "Project deleted successfully" });
  } catch (err) {
    console.error("❌ Delete project error:", err);
    res.status(500).json({ message: "Failed to delete project" });
  }
});

export default router;
