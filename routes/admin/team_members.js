import express from "express";
import db from "../../config/db.js";
import auth from "../../middleware/auth.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Setup image upload folder
const upload = multer({
  dest: path.join(__dirname, "../../uploads/team/"),
  limits: { fileSize: 10 * 1024 * 1024 },
});

// ✅ Helper to format full image URL
const formatImageURL = (req, imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("/uploads")) {
    return `${req.protocol}://${req.get("host")}${imagePath}`;
  } else if (imagePath.startsWith("team/")) {
    return `${req.protocol}://${req.get("host")}/uploads/${imagePath}`;
  }
  return imagePath;
};

// ✅ Get all team members (Admin)
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
    let image = req.file
      ? `/uploads/team/${req.file.filename}`
      : req.body.image || null;

    if (!name || !position) {
      return res.status(400).json({ message: "Name and position are required" });
    }

    const [result] = await db.query(
      "INSERT INTO team_members (name, position, qualifications, image) VALUES (?, ?, ?, ?)",
      [name, position, qualifications || "", image]
    );

    const [rows] = await db.query("SELECT * FROM team_members WHERE id = ?", [
      result.insertId,
    ]);

    const newMember = rows[0];
    newMember.image = formatImageURL(req, newMember.image);

    res.status(201).json(newMember);
  } catch (err) {
    console.error("❌ Error creating member:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Update member
router.put("/:id", auth, upload.single("image"), async (req, res) => {
  try {
    const { name, position, qualifications } = req.body;
    let image = req.file
      ? `/uploads/team/${req.file.filename}`
      : req.body.image || null;

    if (!name || !position) {
      return res.status(400).json({ message: "Name and position are required" });
    }

    await db.query(
      "UPDATE team_members SET name = ?, position = ?, qualifications = ?, image = ? WHERE id = ?",
      [name, position, qualifications || "", image, req.params.id]
    );

    const [rows] = await db.query("SELECT * FROM team_members WHERE id = ?", [
      req.params.id,
    ]);
    const updated = rows[0];
    updated.image = formatImageURL(req, updated.image);

    res.json(updated);
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
    console.error("❌ Error deleting member:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
