import express from "express";
import db from "../config/db.js";
const router = express.Router();

// ✅ Get all services
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT id, title, description, image_url, created_at
      FROM services
      ORDER BY id ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error("❌ Error fetching services:", err.message);
    res.status(500).json({ error: "Failed to fetch services" });
  }
});

// ✅ Get a single service + related services
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [serviceRows] = await db.query(
      `SELECT id, title, description, image_url, created_at 
       FROM services WHERE id = ?`,
      [id]
    );

    if (serviceRows.length === 0) {
      return res.status(404).json({ error: "Service not found" });
    }

    const service = serviceRows[0];

    const [related] = await db.query(
      `SELECT id, title, description, image_url 
       FROM services 
       WHERE id != ? 
       ORDER BY RAND() 
       LIMIT 3`,
      [id]
    );

    res.json({ service, related });
  } catch (err) {
    console.error("❌ Error fetching service detail:", err.message);
    res.status(500).json({ error: "Failed to fetch service detail" });
  }
});

export default router;
