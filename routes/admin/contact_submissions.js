import express from "express";
import db from "../../config/db.js";
import auth from "../../middleware/auth.js";

const router = express.Router();

// Get all contact submissions
router.get("/", auth, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM contact_submissions ORDER BY id DESC"
    );
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching contacts:", err.message);
    res.status(500).json({ message: "Server error fetching contacts." });
  }
});

// Delete a contact submission
router.delete("/:id", auth, async (req, res) => {
  try {
    const [existing] = await db.query(
      "SELECT * FROM contact_submissions WHERE id = ?",
      [req.params.id]
    );
    if (existing.length === 0)
      return res.status(404).json({ message: "Contact not found." });

    await db.query("DELETE FROM contact_submissions WHERE id = ?", [
      req.params.id,
    ]);
    res.json({ message: "Contact deleted successfully." });
  } catch (err) {
    console.error("❌ Error deleting contact:", err.message);
    res.status(500).json({ message: "Server error deleting contact." });
  }
});

export default router;
