import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import db from "../../config/db.js";
import auth from "../../middleware/auth.js";

const router = express.Router();

// ✅ 1. Folder Management
const uploadDir = path.join(process.cwd(), "uploads/projects");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ✅ 2. Multer Setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// ✅ 3. Helper for HTTPS URLs
const formatImageURL = (req, imagePath) => {
  if (!imagePath) return null;
  // Handle if path is stored as a JSON string array
  let cleanPath = imagePath;
  try {
    if (typeof imagePath === "string" && imagePath.startsWith("[")) {
      cleanPath = JSON.parse(imagePath)[0];
    }
  } catch (e) {}
  
  if (cleanPath.startsWith("http")) return cleanPath;
  return `https://${req.get("host")}${cleanPath}`;
};

// ✅ GET all projects (Removed 'auth' so public can see)
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM projects ORDER BY id DESC");
    const projects = rows.map((p) => ({
      ...p,
      images: formatImageURL(req, p.images) 
    }));
    res.json(projects);
  } catch (err) {
    console.error("❌ Error fetching projects:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ POST new project
router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    const { title, description } = req.body;
    const imagePath = req.file ? `/uploads/projects/${req.file.filename}` : null;

    const [result] = await db.query(
      "INSERT INTO projects (title, description, images) VALUES (?, ?, ?)",
      [title, description, JSON.stringify([imagePath])]
    );

    res.json({
      id: result.insertId,
      title,
      description,
      images: formatImageURL(req, imagePath),
    });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ PUT update project
router.put("/:id", auth, upload.single("image"), async (req, res) => {
  try {
    const { title, description } = req.body;
    let imagePath = req.file ? `/uploads/projects/${req.file.filename}` : req.body.image_url;

    await db.query(
      "UPDATE projects SET title=?, description=?, images=? WHERE id=?",
      [title, description, JSON.stringify([imagePath]), req.params.id]
    );

    res.json({ message: "✅ Project updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    await db.query("DELETE FROM projects WHERE id=?", [req.params.id]);
    res.json({ message: "✅ Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
