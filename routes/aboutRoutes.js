import express from "express";
import db from "../config/db.js";
const router = express.Router();

// ✅ Helper for full image URLs
const formatImageURL = (req, imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith("/uploads")) {
    return `${req.protocol}://${req.get("host")}${imagePath}`;
  } else if (imagePath.startsWith("team/")) {
    return `${req.protocol}://${req.get("host")}/uploads/${imagePath}`;
  }
  return imagePath;
};

/* === 1. About info (Hope Energy, Vision, Mission, Goals) === */
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM about_info ORDER BY id ASC");

    const aboutData = {
      description:
        rows.find((r) => r.title.toLowerCase().includes("hope energy"))
          ?.description || "",
      vision:
        rows.find(
          (r) =>
            r.title.toLowerCase().includes("vision") ||
            r.title.toLowerCase().includes("vission")
        )?.description || "",
      mission:
        rows.find((r) => r.title.toLowerCase().includes("mission"))
          ?.description || "",
      goals:
        rows.find((r) => r.title.toLowerCase().includes("goal"))
          ?.description || "",
      extras: rows
        .filter(
          (r) =>
            !r.title.toLowerCase().includes("hope energy") &&
            !r.title.toLowerCase().includes("mission") &&
            !r.title.toLowerCase().includes("vision") &&
            !r.title.toLowerCase().includes("vission") &&
            !r.title.toLowerCase().includes("goal")
        )
        .map((r) => ({
          title: r.title,
          description: r.description,
        })),
    };

    res.json(aboutData);
  } catch (err) {
    console.error("❌ Error fetching about info:", err.message);
    res.status(500).json({ error: "Database error" });
  }
});

/* === 2. Team members === */
router.get("/team", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM team_members ORDER BY id ASC");
    const formatted = rows.map((m) => ({
      ...m,
      image: formatImageURL(req, m.image),
    }));
    res.json(formatted);
  } catch (err) {
    console.error("❌ Error fetching team:", err.message);
    res.status(500).json({ error: "Database error" });
  }
});

/* === 3. Partners === */
router.get("/partners", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM partners ORDER BY id ASC");
    const formatted = rows.map((p) => ({
      ...p,
      logo: formatImageURL(req, p.logo),
    }));
    res.json(formatted);
  } catch (err) {
    console.error("❌ Error fetching partners:", err.message);
    res.status(500).json({ error: "Database error" });
  }
});

/* === 4. Testimonials === */
router.get("/testimonials", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM testimonials ORDER BY id DESC");
    const formatted = rows.map((t) => ({
      ...t,
      image: formatImageURL(req, t.image),
    }));
    res.json(formatted);
  } catch (err) {
    console.error("❌ Error fetching testimonials:", err.message);
    res.status(500).json({ error: "Database error" });
  }
});

export default router;
