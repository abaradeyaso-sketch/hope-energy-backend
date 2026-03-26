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

const formatImageURL = (req, imagePath) => {
  if (!imagePath) return null;
  let cleanPath = imagePath;
  try {
    // If stored as ["/uploads/..."] in DB, extract the first string
    if (typeof imagePath === "string" && imagePath.startsWith("[")) {
      cleanPath = JSON.parse(imagePath)[0];
    }
  } catch (e) {}
  
  if (!cleanPath) return null;
  if (cleanPath.startsWith("http")) return cleanPath;
  return `https://${req.get("host")}${cleanPath}`;
};

// ✅ PUBLIC GET: Removed 'auth' so frontend can see projects
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM projects ORDER BY id DESC");
    const projects = rows.map((p) => ({
      ...p,
      images: formatImageURL(req, p.images) 
    }));
    res.json(projects);
  } catch (err) {
    console.error("❌ Projects Error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ ADMIN POST: Keep 'auth'
router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    const { title, description } = req.body;
    const imagePath = req.file ? `/uploads/projects/${req.file.filename}` : req.body.image_url;

    const [result] = await db.query(
      "INSERT INTO projects (title, description, images) VALUES (?, ?, ?)",
      [title, description, JSON.stringify([imagePath])]
    );

    res.json({ id: result.insertId, title, images: formatImageURL(req, imagePath) });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ ADMIN PUT: Keep 'auth'
router.put("/:id", auth, upload.single("image"), async (req, res) => {
  try {
    const { title, description } = req.body;
    let imagePath = req.file ? `/uploads/projects/${req.file.filename}` : req.body.image_url;

    await db.query(
      "UPDATE projects SET title=?, description=?, images=? WHERE id=?",
      [title, description, JSON.stringify([imagePath]), req.params.id]
    );
    res.json({ message: "✅ Project updated" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    await db.query("DELETE FROM projects WHERE id=?", [req.params.id]);
    res.json({ message: "✅ Deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
