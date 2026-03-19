import express from "express";
import multer from "multer";
import path from "path";
import db from "../config/db.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// 🖼 Configure file upload for project images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/projects/");
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

/* ===========================
   🌍 Public Routes
=========================== */

// ➤ Get all projects (public)
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM projects ORDER BY id DESC");
    res.json(rows);
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
    res.json(rows[0]);
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

    res.json({ id: result.insertId, title, description, images: imagePath });
  } catch (err) {
    console.error("❌ Add project error:", err);
    res.status(500).json({ message: "Failed to add project" });
  }
});

// ✏️ Update existing project
router.put("/:id", auth, upload.single("image"), async (req, res) => {
  try {
    const { title, description } = req.body;
    let query, params;

    if (req.file) {
      const imagePath = `/uploads/projects/${req.file.filename}`;
      query = "UPDATE projects SET title = ?, description = ?, images = ? WHERE id = ?";
      params = [title, description, imagePath, req.params.id];
    } else {
      query = "UPDATE projects SET title = ?, description = ? WHERE id = ?";
      params = [title, description, req.params.id];
    }

    await db.query(query, params);
    res.json({ message: "Project updated successfully" });
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
