// backend/routes/admin/about_info.js
import express from "express";
import db from "../../config/db.js";
import auth from "../../middleware/auth.js";
const router = express.Router();

// ✅ GET all about info (admin panel)
router.get("/", auth, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM about_info ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    console.error("❌ GET /about_info:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ POST new record
router.post("/", auth, async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || !description)
      return res.status(400).json({ message: "Title and description required" });

    const [result] = await db.query(
      "INSERT INTO about_info (title, description) VALUES (?, ?)",
      [title, description]
    );
    const [rows] = await db.query("SELECT * FROM about_info WHERE id = ?", [result.insertId]);
    res.json(rows[0]);
  } catch (err) {
    console.error("❌ POST /about_info:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ PUT update record
router.put("/:id", auth, async (req, res) => {
  try {
    const { title, description } = req.body;
    await db.query(
      "UPDATE about_info SET title = ?, description = ? WHERE id = ?",
      [title, description, req.params.id]
    );
    const [rows] = await db.query("SELECT * FROM about_info WHERE id = ?", [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    console.error("❌ PUT /about_info:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ DELETE record
router.delete("/:id", auth, async (req, res) => {
  try {
    await db.query("DELETE FROM about_info WHERE id = ?", [req.params.id]);
    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("❌ DELETE /about_info:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
