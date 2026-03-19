// backend/routes/news.js
import express from "express";
import db from "../config/db.js";

const router = express.Router();

// ✅ GET all published news
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, title, content, image_url, author, publish_date FROM news WHERE is_published = 1 ORDER BY publish_date DESC"
    );

    const updatedRows = rows.map((n) => {
      let imageUrl = n.image_url;

      try {
        // ✅ Parse stored JSON-like array
        if (typeof imageUrl === "string" && imageUrl.startsWith("[")) {
          const arr = JSON.parse(imageUrl);
          imageUrl = arr[0];
        }
      } catch {}

      // ✅ Serve backend uploads correctly
      if (imageUrl && imageUrl.startsWith("/uploads/")) {
        imageUrl = `${req.protocol}://${req.get("host")}${imageUrl}`;
      }

      return { ...n, image_url: imageUrl };
    });

    res.json(updatedRows);
  } catch (error) {
    console.error("❌ Error fetching news:", error);
    res.status(500).json({ error: "Failed to fetch news" });
  }
});

// ✅ GET a single published news item by ID
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, title, content, image_url, author, publish_date FROM news WHERE id = ? AND is_published = 1",
      [req.params.id]
    );

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: "News not found" });
    }

    let n = rows[0];
    let imageUrl = n.image_url;

    try {
      if (typeof imageUrl === "string" && imageUrl.startsWith("[")) {
        const arr = JSON.parse(imageUrl);
        imageUrl = arr[0];
      }
    } catch {}

    if (imageUrl && imageUrl.startsWith("/uploads/")) {
      imageUrl = `${req.protocol}://${req.get("host")}${imageUrl}`;
    }

    n.image_url = imageUrl;

    res.json(n);
  } catch (error) {
    console.error("❌ Error fetching news detail:", error);
    res.status(500).json({ error: "Failed to fetch news detail" });
  }
});

export default router;
