import express from "express";
import db from "../config/db.js";
const router = express.Router();

const formatImageUrl = (req, imagePath) => {
  if (!imagePath) return null;
  // If database still has old JSON format ["..."], clean it up
  let cleanPath = imagePath;
  if (typeof imagePath === "string" && imagePath.startsWith("[")) {
    try { cleanPath = JSON.parse(imagePath)[0]; } catch (e) { cleanPath = imagePath; }
  }
  
  const host = req.get("host");
  const protocol = host.includes("localhost") ? "http" : "https";
  return `${protocol}://${host}${cleanPath.startsWith("/") ? "" : "/"}${cleanPath}`;
};

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM projects ORDER BY id DESC");
    const formatted = rows.map(p => ({
      ...p,
      images: formatImageUrl(req, p.images) // Now returns a single string URL
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
