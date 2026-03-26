import express from "express";
import db from "../../config/db.js";
import auth from "../../middleware/auth.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

// ✅ Use diskStorage to keep original extensions and unique names
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../../uploads/news"));
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ✅ Get all news
router.get("/", auth, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM news ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Add new news (with optional image)
router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    const { title, content, author, is_published = 1 } = req.body;
    const image_url = req.file ? `/uploads/news/${req.file.filename}` : null;

    const [result] = await db.query(
      "INSERT INTO news (title, content, author, image_url, is_published) VALUES (?, ?, ?, ?, ?)",
      [title, content, author, image_url, is_published]
    );

    const [rows] = await db.query("SELECT * FROM news WHERE id = ?", [
      result.insertId,
    ]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Get a single news item
router.get("/:id", auth, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM news WHERE id = ?", [
      req.params.id,
    ]);
    res.json(rows[0] || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Update news (optionally update image)
router.put("/:id", auth, upload.single("image"), async (req, res) => {
  try {
    const { title, content, author, is_published = 1 } = req.body;
    let image_url = req.file ? `/uploads/news/${req.file.filename}` : null;

    const query = image_url
      ? "UPDATE news SET title = ?, content = ?, author = ?, image_url = ?, is_published = ? WHERE id = ?"
      : "UPDATE news SET title = ?, content = ?, author = ?, is_published = ? WHERE id = ?";
    const params = image_url
      ? [title, content, author, image_url, is_published, req.params.id]
      : [title, content, author, is_published, req.params.id];

    await db.query(query, params);

    const [rows] = await db.query("SELECT * FROM news WHERE id = ?", [
      req.params.id,
    ]);
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Delete news
router.delete("/:id", auth, async (req, res) => {
  try {
    await db.query("DELETE FROM news WHERE id = ?", [req.params.id]);
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
