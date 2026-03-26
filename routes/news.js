import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs"; 
import db from "../../config/db.js";
import auth from "../../middleware/auth.js";

const router = express.Router();

// ✅ 1. Ensure News upload folder exists (Match Partner Logic)
const uploadDir = path.join(process.cwd(), "uploads/news");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ✅ 2. Configure multer storage (Match Partner Logic)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); 
  },
  filename: (req, file, cb) => {
    // Unique name to prevent overwriting
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// ✅ 3. Helper to format full image URL (Forces HTTPS for Vercel)
const formatImageURL = (req, imagePath) => {
  if (!imagePath) return null;
  // Standardized HTTPS link for Vercel frontend
  return `https://${req.get("host")}${imagePath}`;
};

// ✅ GET all news (Admin view)
router.get("/", auth, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM news ORDER BY publish_date DESC");
    const formatted = rows.map((n) => ({
      ...n,
      image_url: formatImageURL(req, n.image_url),
    }));
    res.json(formatted);
  } catch (err) {
    console.error("❌ GET /admin/news:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ POST: Create news item
router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    const { title, content, author, is_published } = req.body;
    
    // Save the relative path to the database
    const imagePath = req.file ? `/uploads/news/${req.file.filename}` : null;

    if (!title || !content) {
      return res.status(400).json({ message: "Title and content are required" });
    }

    const [result] = await db.query(
      "INSERT INTO news (title, content, author, image_url, is_published) VALUES (?, ?, ?, ?, ?)",
      [title, content, author || "Admin", imagePath, is_published || 1]
    );

    res.json({
      id: result.insertId,
      message: "News created successfully",
      image_url: formatImageURL(req, imagePath),
    });
  } catch (err) {
    console.error("❌ POST /admin/news:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ PUT: Update news item
router.put("/:id", auth, upload.single("image"), async (req, res) => {
  try {
    const { title, content, author, is_published } = req.body;
    
    // If a new file is uploaded, use it. Otherwise, keep existing.
    let imagePath = req.file ? `/uploads/news/${req.file.filename}` : req.body.image_url;

    await db.query(
      "UPDATE news SET title=?, content=?, author=?, image_url=?, is_published=? WHERE id=?",
      [title, content, author, imagePath, is_published, req.params.id]
    );

    res.json({ message: "News updated successfully" });
  } catch (err) {
    console.error("❌ PUT /admin/news:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ DELETE: Remove news
router.delete("/:id", auth, async (req, res) => {
  try {
    await db.query("DELETE FROM news WHERE id = ?", [req.params.id]);
    res.json({ message: "News deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
