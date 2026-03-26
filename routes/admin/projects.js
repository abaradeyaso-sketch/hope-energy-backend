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
  // Safety check: handle if DB stored it as a JSON string or regular string
  if (typeof imagePath === "string" && imagePath.startsWith("[")) {
    try {
      const parsed = JSON.parse(imagePath);
      cleanPath = Array.isArray(parsed) ? parsed[0] : imagePath;
    } catch (e) { cleanPath = imagePath; }
  }
  if (!cleanPath || cleanPath === "null") return null;
  return cleanPath.startsWith("http") ? cleanPath : `https://${req.get("host")}${cleanPath.startsWith("/") ? "" : "/"}${cleanPath}`;
};

// ✅ GET: Public (REMOVED auth to fix visibility)
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM projects ORDER BY id DESC");
    const formatted = rows.map(p => ({
      ...p,
      images: formatImageURL(req, p.images || p.image_url)
    }));
    res.json(formatted);
  } catch (err) {
    console.error("❌ Projects GET Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ POST: Admin Only
router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    const { title, description } = req.body;
    const imgPath = req.file ? `/uploads/projects/${req.file.filename}` : null;
    const [result] = await db.query(
      "INSERT INTO projects (title, description, images) VALUES (?, ?, ?)",
      [title, description, JSON.stringify([imgPath])]
    );
    res.json({ id: result.insertId, message: "Project added" });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

// ✅ PUT: Admin Only
router.put("/:id", auth, upload.single("image"), async (req, res) => {
  try {
    const { title, description } = req.body;
    let imgPath = req.file ? `/uploads/projects/${req.file.filename}` : req.body.image_url;
    await db.query("UPDATE projects SET title=?, description=?, images=? WHERE id=?", 
    [title, description, JSON.stringify([imgPath]), req.params.id]);
    res.json({ message: "Updated" });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

router.delete("/:id", auth, async (req, res) => {
  await db.query("DELETE FROM projects WHERE id=?", [req.params.id]);
  res.json({ message: "Deleted" });
});

export default router;
