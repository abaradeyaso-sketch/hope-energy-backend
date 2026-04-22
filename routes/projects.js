import express from "express";
import multer from "multer";
import path from "path";
import db from "../config/db.js";
import auth from "../middleware/auth.js";

const router = express.Router();

// 🖼 Configure file upload
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

/**
 * Helper function to format response
 * Ensures the image path is always absolute and uses the correct protocol
 */
const formatProjectResponse = (req, project) => {
  if (project.images && !project.images.startsWith('http')) {
    // req.protocol will be 'https' on Render if 'trust proxy' is enabled in server.js
    const protocol = req.protocol === 'http' && req.get('x-forwarded-proto') 
                     ? 'https' 
                     : req.protocol;
    
    project.images = `${protocol}://${req.get('host')}${project.images}`;
  }
  return project;
};

/* ===========================
    🌍 Public Routes
=========================== */

// ➤ Get all projects
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM projects ORDER BY id DESC");
    // Map through rows to fix image URLs dynamically
    const formattedRows = rows.map(row => formatProjectResponse(req, row));
    res.json(formattedRows);
  } catch (err) {
    console.error("❌ Get projects error:", err);
    res.status(500).json({ message: "Failed to fetch projects" });
  }
});

// ➤ Get single project by ID
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM projects WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: "Project not found" });
    
    const formattedProject = formatProjectResponse(req, rows[0]);
    res.json(formattedProject);
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
    // Store only the relative path in the database
    const imagePath = req.file ? `/uploads/projects/${req.file.filename}` : null;

    const [result] = await db.query(
      "INSERT INTO projects (title, description, images) VALUES (?, ?, ?)",
      [title, description, imagePath]
    );

    const newProject = { id: result.insertId, title, description, images: imagePath };
    res.json(formatProjectResponse(req, newProject));
  } catch (err) {
    console.error("❌ Add project error:", err);
    res.status(500).json({ message: "Failed to add project" });
  }
});

// ✏️ Update existing project
router.put("/:id", auth, upload.single("image"), async (req, res) => {
  try {
    const { title, description } = req.body;
    let query, params, imagePath;

    if (req.file) {
      imagePath = `/uploads/projects/${req.file.filename}`;
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
