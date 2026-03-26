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

// ✅ 3. Safety-First Helper for URLs
const formatImageURL = (req, imagePath) => {
  if (!imagePath) return null;
  
  let cleanPath = imagePath;

  // Safety Check: If it's a JSON string, parse it. If not, keep it as is.
  if (typeof imagePath === "string" && imagePath.startsWith("[")) {
    try {
      const parsed = JSON.parse(imagePath);
      cleanPath = Array.isArray(parsed) ? parsed[0] : imagePath;
    } catch (e) {
      cleanPath = imagePath; // Fallback if parsing fails
    }
  }

  if (!cleanPath) return null;
  if (cleanPath.startsWith("http")) return cleanPath;
  
  // Ensure the path starts with a /
  const finalPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
  return `https://${req.get("host")}${finalPath}`;
};

// ✅ GET all projects (Public Access)
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM projects ORDER BY id DESC");
    
    // Safety Check: Ensure 'images' or 'image_url' column exists
    const projects = rows.map((p) => {
      // Logic to handle both possible column names: 'images' or 'image_url'
      const rawPath = p.images || p.image_url || null;
      return {
        ...p,
        images: formatImageURL(req, rawPath)
      };
    });
    
    res.json(projects);
  } catch (err) {
    console.error("❌ Database Error in GET /projects:", err.message);
    res.status(500).json({ message: "Server error fetching projects", error: err.message });
  }
});

// ✅ POST new project
router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    const { title, description } = req.body;
    const imagePath = req.file ? `/uploads/projects/${req.file.filename}` : null;

    // We store as a JSON string to keep your current DB format
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
    console.error("❌ POST Error:", err.message);
    res.status(500).json({ message: "Server error adding project" });
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
    res.status(500).json({ message: "Server error updating project" });
  }
});

// ✅ DELETE project
router.delete("/:id", auth, async (req, res) => {
  try {
    await db.query("DELETE FROM projects WHERE id=?", [req.params.id]);
    res.json({ message: "✅ Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error deleting project" });
  }
});

export default router;
