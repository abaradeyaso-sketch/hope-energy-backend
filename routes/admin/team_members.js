import express from "express";
import db from "../../config/db.js";
import auth from "../../middleware/auth.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

// ✅ 1. Ensure Team upload folder exists (Matches Partner logic)
const uploadDir = path.join(process.cwd(), "uploads/team");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ✅ 2. Multer configuration (Matches Partner logic)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    // Keeps the extension (.jpg/.png) and adds a timestamp
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// ✅ 3. Helper to format full image URL (Forced HTTPS for Vercel)
const formatImageURL = (req, imagePath) => {
  if (!imagePath) return null;
  // Using https:// directly fixes the Mixed Content error on Vercel
  return `https://${req.get("host")}${imagePath}`;
};

// ✅ Get all team members
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

// ✅ Add new member
router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    const { name, position, qualifications } = req.body;
    const image = req.file ? `/uploads/team/${req.file.filename}` : null;

    if (!name || !position) {
      return res.status(400).json({ message: "Name and position are required" });
    }

    const [result] = await db.query(
      "INSERT INTO team_members (name, position, qualifications, image) VALUES (?, ?, ?, ?)",
      [name, position, qualifications || "", image]
    );

    res.status(201).json({ message: "Member added successfully" });
  } catch (err) {
    console.error("❌ Error creating member:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Update member
router.put("/:id", auth, upload.single("image"), async (req, res) => {
  try {
    const { name, position, qualifications } = req.body;
    // If new file uploaded, use it. Otherwise, use existing image path.
    let image = req.file ? `/uploads/team/${req.file.filename}` : req.body.image;

    await db.query(
      "UPDATE team_members SET name = ?, position = ?, qualifications = ?, image = ? WHERE id = ?",
      [name, position, qualifications || "", image, req.params.id]
    );

    res.json({ message: "Member updated successfully" });
  } catch (err) {
    console.error("❌ Error updating member:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Delete member
router.delete("/:id", auth, async (req, res) => {
  try {
    await db.query("DELETE FROM team_members WHERE id = ?", [req.params.id]);
    res.json({ message: "Member deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
