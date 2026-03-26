import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import db from "../../config/db.js";
import auth from "../../middleware/auth.js";

const router = express.Router();
const uploadDir = path.join(process.cwd(), "uploads/projects");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, "_")),
});
const upload = multer({ storage });

const formatImageURL = (req, imagePath) => {
  if (!imagePath) return null;
  let cleanPath = imagePath;
  try {
    if (typeof imagePath === "string" && imagePath.startsWith("[")) {
      cleanPath = JSON.parse(imagePath)[0];
    }
  } catch (e) {}
  if (!cleanPath) return null;
  return cleanPath.startsWith("http") ? cleanPath : `https://${req.get("host")}${cleanPath}`;
};

// ✅ GET: Public (No auth middleware)
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM projects ORDER BY id DESC");
    const formatted = rows.map(p => ({
      ...p,
      images: formatImageURL(req, p.images) 
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ POST, PUT, DELETE: Admin Protected
router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    const { title, description } = req.body;
    const path = req.file ? `/uploads/projects/${req.file.filename}` : null;
    const [result] = await db.query(
      "INSERT INTO projects (title, description, images) VALUES (?, ?, ?)",
      [title, description, JSON.stringify([path])]
    );
    res.json({ id: result.insertId, title, images: formatImageURL(req, path) });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

router.put("/:id", auth, upload.single("image"), async (req, res) => {
  try {
    const { title, description } = req.body;
    let path = req.file ? `/uploads/projects/${req.file.filename}` : req.body.image_url;
    await db.query("UPDATE projects SET title=?, description=?, images=? WHERE id=?", 
    [title, description, JSON.stringify([path]), req.params.id]);
    res.json({ message: "✅ Updated" });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

router.delete("/:id", auth, async (req, res) => {
  await db.query("DELETE FROM projects WHERE id=?", [req.params.id]);
  res.json({ message: "✅ Deleted" });
});

export default router;
