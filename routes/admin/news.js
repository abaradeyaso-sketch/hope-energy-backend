import express from "express";
import db from "../../config/db.js";
import auth from "../../middleware/auth.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();
const uploadDir = path.join(process.cwd(), "uploads/news");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

const formatImageURL = (req, imagePath) => {
  if (!imagePath) return null;
  return imagePath.startsWith("http") ? imagePath : `https://${req.get("host")}${imagePath}`;
};

// ✅ GET: Public
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM news ORDER BY id DESC");
    const formatted = rows.map(n => ({
      ...n,
      image_url: formatImageURL(req, n.image_url)
    }));
    res.json(formatted);
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

// ✅ POST & PUT: Protected
router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    const { title, content, author } = req.body;
    const path = req.file ? `/uploads/news/${req.file.filename}` : null;
    const [result] = await db.query(
      "INSERT INTO news (title, content, author, image_url) VALUES (?, ?, ?, ?)",
      [title, content, author, path]
    );
    res.json({ id: result.insertId, image_url: formatImageURL(req, path) });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

router.put("/:id", auth, upload.single("image"), async (req, res) => {
  try {
    const { title, content, author } = req.body;
    let path = req.file ? `/uploads/news/${req.file.filename}` : req.body.image_url;
    await db.query("UPDATE news SET title=?, content=?, author=?, image_url=? WHERE id=?", 
    [title, content, author, path, req.params.id]);
    res.json({ message: "✅ Updated" });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

export default router;
