import express from "express";
import db from "../../config/db.js";
import auth from "../../middleware/auth.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

// ✅ Ensure upload folder exists
const uploadDir = path.join(process.cwd(), "uploads/partners");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ✅ Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

// ✅ Get all partners
router.get("/", auth, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM partners ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    console.error("Error loading partners:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ Add new partner
router.post("/", auth, upload.single("logo"), async (req, res) => {
  try {
    const { name } = req.body;
    const logo = req.file ? `/uploads/partners/${req.file.filename}` : null;

    await db.query("INSERT INTO partners (name, logo) VALUES (?, ?)", [
      name,
      logo,
    ]);

    res.json({ message: "Partner added successfully" });
  } catch (err) {
    console.error("Error adding partner:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ Update partner
router.put("/:id", auth, upload.single("logo"), async (req, res) => {
  try {
    const { name } = req.body;
    const logo = req.file ? `/uploads/partners/${req.file.filename}` : null;

    if (logo) {
      await db.query("UPDATE partners SET name=?, logo=? WHERE id=?", [
        name,
        logo,
        req.params.id,
      ]);
    } else {
      await db.query("UPDATE partners SET name=? WHERE id=?", [
        name,
        req.params.id,
      ]);
    }

    res.json({ message: "Partner updated successfully" });
  } catch (err) {
    console.error("Error updating partner:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

// ✅ Delete partner
router.delete("/:id", auth, async (req, res) => {
  try {
    await db.query("DELETE FROM partners WHERE id=?", [req.params.id]);
    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error("Error deleting partner:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});

export default router;
