import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import db from "../../config/db.js";
import auth from "../../middleware/auth.js";
import { fileURLToPath } from "url";

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure upload directory exists
const uploadDir = path.join(__dirname, "../../uploads/projects");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// GET all projects
router.get("/", auth, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM projects ORDER BY id DESC");
    const projects = rows.map((p) => {
      let images = p.images;
      try {
        if (typeof images === "string" && images.startsWith("[")) {
          images = JSON.parse(images);
        } else if (typeof images === "string") {
          images = [images];
        }
      } catch {
        images = [images];
      }
      return { ...p, images };
    });
    res.json(projects);
  } catch (err) {
    console.error("❌ Error fetching projects:", err);
    res.status(500).json({ message: "Server error while fetching projects" });
  }
});

// POST new project
router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !description)
      return res.status(400).json({ message: "Title and description required." });

    let imagePath = null;
    if (req.file) imagePath = `/uploads/projects/${req.file.filename}`;
    else if (req.body.image_url?.startsWith("/assets/")) imagePath = req.body.image_url;

    const [result] = await db.query(
      "INSERT INTO projects (title, description, images) VALUES (?, ?, ?)",
      [title, description, JSON.stringify([imagePath])]
    );

    res.json({
      id: result.insertId,
      title,
      description,
      images: [imagePath],
    });
  } catch (err) {
    console.error("🔥 Error creating project:", err);
    res.status(500).json({ message: "Server error while saving project" });
  }
});

// PUT update project
router.put("/:id", auth, upload.single("image"), async (req, res) => {
  try {
    const { title, description } = req.body;
    let imagePath = null;

    if (req.file) imagePath = `/uploads/projects/${req.file.filename}`;
    else if (req.body.image_url?.startsWith("/assets/"))
      imagePath = req.body.image_url;

    if (imagePath) {
      await db.query(
        "UPDATE projects SET title=?, description=?, images=? WHERE id=?",
        [title, description, JSON.stringify([imagePath]), req.params.id]
      );
    } else {
      await db.query(
        "UPDATE projects SET title=?, description=? WHERE id=?",
        [title, description, req.params.id]
      );
    }

    const [rows] = await db.query("SELECT * FROM projects WHERE id=?", [req.params.id]);
    let updated = rows[0];
    if (updated.images && typeof updated.images === "string") {
      try {
        updated.images = JSON.parse(updated.images);
      } catch {
        updated.images = [updated.images];
      }
    }

    res.json(updated);
  } catch (err) {
    console.error("❌ Error updating project:", err);
    res.status(500).json({ message: "Server error while updating project" });
  }
});

// DELETE project
router.delete("/:id", auth, async (req, res) => {
  try {
    await db.query("DELETE FROM projects WHERE id=?", [req.params.id]);
    res.json({ message: "✅ Deleted successfully" });
  } catch (err) {
    console.error("❌ Error deleting project:", err);
    res.status(500).json({ message: "Server error while deleting project" });
  }
});

export default router;
