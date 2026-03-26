import express from "express";
import db from "../../config/db.js";
import auth from "../../middleware/auth.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

// ✅ 1. Ensure Team upload folder exists (Same as Partner logic)
const uploadDir = path.join(process.cwd(), "uploads/team");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ✅ 2. Use diskStorage (This keeps the .jpg/.png extension)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // This creates a unique name: 17123456789-photo.jpg
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// ✅ 3. Helper to format full image URL (Forced HTTPS for Vercel)
const formatImageURL = (req, imagePath) => {
  if (!imagePath) return null;
  // We use 'https' instead of req.protocol to fix the Vercel Mixed Content error
  return `https://${req.get("host")}${imagePath}`;
};

// ✅ GET all team members
router.get("/", auth, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM team_members ORDER BY id DESC");
    const formatted = rows.map((m) => ({
      ...m,
      image: formatImageURL(req, m.image),
    }));
    res.json(formatted);
  } catch (err) {
    console.error("❌ Error fetching team members:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Add new member (POST)
router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    const { name, position, qualifications } = req.body;
    
    // Logic matches your Partner code now
    const image = req.file ? `/uploads/team/${req.file.filename}` : null;

    if (!name || !position) {
      return res.status(400).json({ message: "Name and position are required" });
    }

    const [result] = await db.query(
      "INSERT INTO team_members (name, position, qualifications, image) VALUES (?, ?, ?, ?)",
      [name, position, qualifications || "", image]
    );

    const [rows] = await db.query("SELECT * FROM team_members WHERE id = ?", [result.insertId]);
    const newMember = rows[0];
    newMember.image = formatImageURL(req, newMember.image);

    res.status(201).json(newMember);
  } catch (err) {
    console.error("❌ Error creating member:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Update member (PUT)
router.put("/:id", auth, upload.single("image"), async (req, res) => {
  try {
    const { name, position, qualifications } = req.body;
    
    // Check if a new file was uploaded, otherwise keep old image string
    let image = req.file ? `/uploads/team/${req.file.filename}` : req.body.image;

    await db.query(
      "UPDATE team_members SET name = ?, position = ?, qualifications = ?, image = ? WHERE id = ?",
      [name, position, qualifications || "", image, req.params.id]
    );

    const [rows] = await db.query("SELECT * FROM team_members WHERE id = ?", [req.params.id]);
    const updated = rows[0];
    updated.image = formatImageURL(req, updated.image);

    res.json(updated);
  } catch (err) {
    console.error("❌ Error updating member:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
