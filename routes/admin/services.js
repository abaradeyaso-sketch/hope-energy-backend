// backend/routes/admin/services.js
import express from "express";
import multer from "multer";
import path from "path";
import db from "../../config/db.js";
import auth from "../../middleware/auth.js";

const router = express.Router();

// ✅ Configure multer storage for local uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // store images inside backend/uploads/
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage });

// ✅ GET all services
router.get("/", auth, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM services ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    console.error("❌ GET /services:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ POST: Add a new service (with image)
router.post("/", auth, upload.single("image"), async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !description)
      return res.status(400).json({ message: "Title and description are required" });

    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    const [result] = await db.query(
      "INSERT INTO services (title, description, image_url) VALUES (?, ?, ?)",
      [title, description, imagePath]
    );

    res.json({
      id: result.insertId,
      title,
      description,
      image_url: imagePath,
    });
  } catch (err) {
    console.error("❌ POST /services:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ PUT: Update a service
router.put("/:id", auth, upload.single("image"), async (req, res) => {
  try {
    const { title, description } = req.body;
    const imagePath = req.file ? `/uploads/${req.file.filename}` : null;

    if (imagePath) {
      await db.query(
        "UPDATE services SET title=?, description=?, image_url=? WHERE id=?",
        [title, description, imagePath, req.params.id]
      );
    } else {
      await db.query(
        "UPDATE services SET title=?, description=? WHERE id=?",
        [title, description, req.params.id]
      );
    }

    const [rows] = await db.query("SELECT * FROM services WHERE id=?", [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    console.error("❌ PUT /services:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ DELETE: Remove a service
router.delete("/:id", auth, async (req, res) => {
  try {
    await db.query("DELETE FROM services WHERE id = ?", [req.params.id]);
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("❌ DELETE /services:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
