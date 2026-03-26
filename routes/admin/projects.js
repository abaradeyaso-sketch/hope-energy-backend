import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import db from "../../config/db.js";
import auth from "../../middleware/auth.js";

const router = express.Router();

// ✅ 1. Use process.cwd() to match Partner logic exactly
const uploadDir = path.join(process.cwd(), "uploads/projects");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ✅ 2. Multer Setup (Same as Partners)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname.replace(/\s+/g, "_");
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// ✅ 3. Helper to force HTTPS (Solves your Mixed Content error)
const formatImageUrl = (req, imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("http")) return imagePath.replace("http://", "https://");
  
  const host = req.get("host");
  const protocol = host.includes("localhost") ? "http" : "https";
  return `${protocol}://${host}${imagePath.startsWith("/") ? "" : "/"}${imagePath}`;
};

// --- ROUTES ---

// ✅ GET all projects (Public/Admin)
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM projects ORDER BY id DESC");
    
    // Map rows to include the full URL (No JSON.parse needed anymore!)
    const formatted = rows.map((p) => ({
      ...p,
      // We use 'images' as the key, but it's now a direct string URL
      displayImage: formatImageUrl(req, p.images) 
    }));
    
    res.json(formatted);
  } catch (err) {
    console.error("❌ Error fetching projects:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ POST new project (Direct String)
router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    const { title, description } = req.body;
    
    // Save as a direct string path
    const imagePath = req.file ? `/uploads/projects/${req.file.filename}` : null;

    await db.query(
      "INSERT INTO projects (title, description, images) VALUES (?, ?, ?)",
      [title, description, imagePath] // 👈 Removed JSON.stringify()
    );

    res.json({ message: "Project created successfully" });
  } catch (err) {
    console.error("🔥 Error creating project:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ PUT update project (Direct String)
router.put("/:id", auth, upload.single("image"), async (req, res) => {
  try {
    const { title, description } = req.body;
    let imagePath = req.file ? `/uploads/projects/${req.file.filename}` : req.body.image_url;

    // Direct String Update
    await db.query(
      "UPDATE projects SET title=?, description=?, images=? WHERE id=?",
      [title, description, imagePath, req.params.id] // 👈 Removed JSON.stringify()
    );

    res.json({ message: "Project updated successfully" });
  } catch (err) {
    console.error("❌ Error updating project:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ DELETE project
router.delete("/:id", auth, async (req, res) => {
  try {
    await db.query("DELETE FROM projects WHERE id=?", [req.params.id]);
    res.json({ message: "✅ Deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
