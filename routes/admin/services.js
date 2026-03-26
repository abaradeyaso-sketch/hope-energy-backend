import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import db from "../../config/db.js";
import auth from "../../middleware/auth.js";

const router = express.Router();
const uploadDir = path.join(process.cwd(), "uploads/services");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

const formatImageURL = (req, imagePath) => {
  if (!imagePath) return null;
  return `https://${req.get("host")}${imagePath.startsWith("/") ? imagePath : "/" + imagePath}`;
};

// ✅ GET: PUBLIC (REMOVED 'auth' to fix 401)
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM services ORDER BY id DESC");
    const formatted = rows.map((s) => ({
      ...s,
      image_url: formatImageURL(req, s.image_url),
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ POST, PUT, DELETE: Keep 'auth'
router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    const { title, description } = req.body;
    const path = req.file ? `/uploads/services/${req.file.filename}` : null;
    await db.query("INSERT INTO services (title, description, image_url) VALUES (?, ?, ?)", 
    [title, description, path]);
    res.json({ message: "Service Added" });
  } catch (err) { res.status(500).json({ message: "Error" }); }
});

router.put("/:id", auth, upload.single("image"), async (req, res) => {
  try {
    const { title, description } = req.body;
    let path = req.file ? `/uploads/services/${req.file.filename}` : req.body.image_url;
    await db.query("UPDATE services SET title=?, description=?, image_url=? WHERE id=?", 
    [title, description, path, req.params.id]);
    res.json({ message: "Updated" });
  } catch (err) { res.status(500).json({ message: "Error" }); }
});

router.delete("/:id", auth, async (req, res) => {
  await db.query("DELETE FROM services WHERE id=?", [req.params.id]);
  res.json({ message: "Deleted" });
});

export default router;
