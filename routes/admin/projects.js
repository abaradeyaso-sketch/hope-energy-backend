import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import db from "../../config/db.js";
import auth from "../../middleware/auth.js";

const router = express.Router();

// Match Partner logic: use process.cwd()
const uploadDir = path.join(process.cwd(), "uploads/projects");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_"));
  },
});
const upload = multer({ storage });

// POST: Save as direct string
router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    const { title, description } = req.body;
    const imagePath = req.file ? `/uploads/projects/${req.file.filename}` : null;

    // NO MORE JSON.stringify here!
    await db.query(
      "INSERT INTO projects (title, description, images) VALUES (?, ?, ?)",
      [title, description, imagePath] 
    );
    res.json({ message: "Project created" });
  } catch (err) {
    res.status(500).json({ message: "Error" });
  }
});

// PUT: Update as direct string
router.put("/:id", auth, upload.single("image"), async (req, res) => {
  try {
    const { title, description } = req.body;
    let imagePath = req.file ? `/uploads/projects/${req.file.filename}` : req.body.image_url;

    await db.query(
      "UPDATE projects SET title=?, description=?, images=? WHERE id=?",
      [title, description, imagePath, req.params.id]
    );
    res.json({ message: "Project updated" });
  } catch (err) {
    res.status(500).json({ message: "Error" });
  }
});

export default router;
