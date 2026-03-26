import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs"; // Added for directory checking
import db from "../../config/db.js";
import auth from "../../middleware/auth.js";

const router = express.Router();

// ✅ 1. Ensure upload folder exists (Match Partner Logic)
const uploadDir = path.join(process.cwd(), "uploads/services");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ✅ 2. Configure multer storage (Match Partner Logic)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir); 
  },
  filename: (req, file, cb) => {
    // Standardized unique name used in Partner route
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// ✅ 3. Helper to format full image URL (Fixes Vercel Mixed Content)
const formatImageURL = (req, imagePath) => {
  if (!imagePath) return null;
  // Forces https to ensure Vercel doesn't block the image
  return `https://${req.get("host")}${imagePath}`;
};

// ✅ GET all services
router.get("/", auth, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM services ORDER BY id DESC");
    const formatted = rows.map((s) => ({
      ...s,
      image_url: formatImageURL(req, s.image_url),
    }));
    res.json(formatted);
  } catch (err) {
    console.error("❌ GET /services:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ POST: Add new service
router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    const { title, description } = req.body;
    const imagePath = req.file ? `/uploads/services/${req.file.filename}` : null;

    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required" });
    }

    const [result] = await db.query(
      "INSERT INTO services (title, description, image_url) VALUES (?, ?, ?)",
      [title, description, imagePath]
    );

    res.json({
      id: result.insertId,
      title,
      description,
      image_url: formatImageURL(req, imagePath),
    });
  } catch (err) {
    console.error("❌ POST /services:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ PUT: Update service
router.put("/:id", auth, upload.single("image"), async (req, res) => {
  try {
    const { title, description } = req.body;
    // Use new file if uploaded, otherwise keep the old one from req.body
    let imagePath = req.file ? `/uploads/services/${req.file.filename}` : req.body.image_url;

    await db.query(
      "UPDATE services SET title = ?, description = ?, image_url = ? WHERE id = ?",
      [title, description, imagePath, req.params.id]
    );

    const [rows] = await db.query("SELECT * FROM services WHERE id = ?", [req.params.id]);
    const updated = rows[0];
    updated.image_url = formatImageURL(req, updated.image_url);

    res.json(updated);
  } catch (err) {
    console.error("❌ PUT /services:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ DELETE: Remove service
router.delete("/:id", auth, async (req, res) => {
  try {
    await db.query("DELETE FROM services WHERE id = ?", [req.params.id]);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("❌ DELETE /services:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
