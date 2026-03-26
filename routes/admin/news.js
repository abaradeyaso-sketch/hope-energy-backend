import express from "express";
import db from "../../config/db.js";
import auth from "../../middleware/auth.js";
import multer from "multer";
import path from "path";
import fs from "fs"; // Needed to create folders

const router = express.Router();

// ✅ 1. Ensure News upload folder exists (Fixes Render crashes)
const uploadDir = path.join(process.cwd(), "uploads/news");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ✅ 2. Use diskStorage (Partner Logic)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
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

// ✅ 3. Helper to format full image URL (Fixes Vercel/HTTPS issues)
const formatImageURL = (req, imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http")) return imagePath;
  return `https://${req.get("host")}${imagePath}`;
};

// ✅ GET all news
router.get("/", auth, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM news ORDER BY id DESC");
    const formatted = rows.map(n => ({
      ...n,
      image_url: formatImageURL(req, n.image_url)
    }));
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Add new news
router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    const { title, content, author, is_published = 1 } = req.body;
    const image_url = req.file ? `/uploads/news/${req.file.filename}` : null;

    const [result] = await db.query(
      "INSERT INTO news (title, content, author, image_url, is_published) VALUES (?, ?, ?, ?, ?)",
      [title, content, author, image_url, is_published]
    );

    res.json({
      id: result.insertId,
      title,
      content,
      author,
      image_url: formatImageURL(req, image_url),
      is_published
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Update news
router.put("/:id", auth, upload.single("image"), async (req, res) => {
  try {
    const { title, content, author, is_published = 1 } = req.body;
    
    // logic: If a new file is uploaded, use it. Otherwise, keep the old one from req.body.image_url
    let image_url = req.file ? `/uploads/news/${req.file.filename}` : req.body.image_url;

    await db.query(
      "UPDATE news SET title = ?, content = ?, author = ?, image_url = ?, is_published = ? WHERE id = ?",
      [title, content, author, image_url, is_published, req.params.id]
    );

    res.json({ message: "Updated successfully" });
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
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
