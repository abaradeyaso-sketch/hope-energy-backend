import express from "express";
import db from "../../config/db.js";
import auth from "../../middleware/auth.js";

const router = express.Router();

/**
 * 🔹 Get all testimonials
 */
router.get("/", auth, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM testimonials ORDER BY id DESC");
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching testimonials:", err.message);
    res.status(500).json({ message: "Server error while fetching testimonials." });
  }
});

/**
 * 🔹 Get a single testimonial by ID
 */
router.get("/:id", auth, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM testimonials WHERE id = ?", [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ message: "Testimonial not found." });
    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Error fetching testimonial:", err.message);
    res.status(500).json({ message: "Server error while fetching testimonial." });
  }
});

/**
 * 🔹 Create a new testimonial
 */
router.post("/", auth, async (req, res) => {
  try {
    const { title, text, author, icon } = req.body;

    if (!title || !text || !author) {
      return res.status(400).json({ message: "Title, text, and author are required." });
    }

    const [result] = await db.query(
      "INSERT INTO testimonials (title, text, author, icon) VALUES (?, ?, ?, ?)",
      [title, text, author, icon || null]
    );

    const [rows] = await db.query("SELECT * FROM testimonials WHERE id = ?", [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error("❌ Error creating testimonial:", err.message);
    res.status(500).json({ message: "Server error while creating testimonial." });
  }
});

/**
 * 🔹 Update an existing testimonial
 */
router.put("/:id", auth, async (req, res) => {
  try {
    const { title, text, author, icon } = req.body;

    if (!title || !text || !author) {
      return res.status(400).json({ message: "Title, text, and author are required." });
    }

    const [existing] = await db.query("SELECT * FROM testimonials WHERE id = ?", [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: "Testimonial not found." });
    }

    await db.query(
      "UPDATE testimonials SET title = ?, text = ?, author = ?, icon = ? WHERE id = ?",
      [title, text, author, icon || null, req.params.id]
    );

    const [rows] = await db.query("SELECT * FROM testimonials WHERE id = ?", [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Error updating testimonial:", err.message);
    res.status(500).json({ message: "Server error while updating testimonial." });
  }
});

/**
 * 🔹 Delete a testimonial by ID
 */
router.delete("/:id", auth, async (req, res) => {
  try {
    const [existing] = await db.query("SELECT * FROM testimonials WHERE id = ?", [req.params.id]);
    if (existing.length === 0) {
      return res.status(404).json({ message: "Testimonial not found." });
    }

    await db.query("DELETE FROM testimonials WHERE id = ?", [req.params.id]);
    res.json({ message: "Testimonial deleted successfully." });
  } catch (err) {
    console.error("❌ Error deleting testimonial:", err.message);
    res.status(500).json({ message: "Server error while deleting testimonial." });
  }
});

export default router;
