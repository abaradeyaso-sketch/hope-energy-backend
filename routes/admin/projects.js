import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import db from "../../config/db.js";
import auth from "../../middleware/auth.js";

const router = express.Router();

const uploadDir = path.join(process.cwd(), "uploads/projects");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// ✅ SAFE URL HELPER: Fixes 500 error and Mixed Content
const formatImageURL = (req, imagePath) => {
  if (!imagePath) return null;
  let cleanPath = imagePath;

  // Try to parse if it's a JSON string, otherwise use as is
  if (typeof imagePath === "string" && imagePath.startsWith("[")) {
    try {
      const parsed = JSON.parse(imagePath);
      cleanPath = Array.isArray(parsed) ? parsed[0] : imagePath;
    } catch (e) {
      cleanPath = imagePath;
    }
  }

  if (!cleanPath || cleanPath === "null") return null;
  if (cleanPath.startsWith("http")) return cleanPath;
  
  const host = req.get("host");
  // Force HTTPS for Render/Vercel environments
  return `https://${host}${cleanPath.startsWith("/") ? cleanPath : "/" + cleanPath}`;
};

// ✅ GET: PUBLIC (Fixes 401/Data Zero)
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM projects ORDER BY id DESC");
    const formatted = rows.map((p) => ({
      ...p,
      images: formatImageURL(req, p.images || p.image_url) 
    }));
    res.json(formatted);
  } catch (err) {
    console.error("❌ Projects GET Error:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ POST: ADMIN
router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    const { title, description } = req.body;
    const imagePath = req.file ? `/uploads/projects/${req.file.filename}` : null;
    const [result] = await db.query(
      "INSERT INTO projects (title, description, images) VALUES (?, ?, ?)",
      [title, description, JSON.stringify([imagePath])]
    );
    res.json({ id: result.insertId, message: "Success" });
  } catch (err) {
    res.status(500).json({ message: "Error" });
  }
});

// ✅ PUT: ADMIN
router.put("/:id", auth, upload.single("image"), async (req, res) => {
  try {
    const { title, description } = req.body;
    let path = req.file ? `/uploads/projects/${req.file.filename}` : req.body.image_url;
    await db.query("UPDATE projects SET title=?, description=?, images=? WHERE id=?", 
    [title, description, JSON.stringify([path]), req.params.id]);
    res.json({ message: "Updated" });
  } catch (err) { res.status(500).json({ message: "Error" }); }
});

router.delete("/:id", auth, async (req, res) => {
  await db.query("DELETE FROM projects WHERE id=?", [req.params.id]);
  res.json({ message: "Deleted" });
});

export default router;
