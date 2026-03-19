import express from "express";
import bcrypt from "bcrypt";
import db from "../config/db.js";
import verifyToken from "../middleware/auth.js";

const router = express.Router();

// ✅ Get current admin profile
router.get("/me", verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, username FROM admins WHERE id = ?",
      [req.admin.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Admin not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error("❌ Error fetching profile:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

// ✅ Update username or password
router.put("/update_profile", verifyToken, async (req, res) => {
  const { username, currentPassword, newPassword } = req.body;

  try {
    // 1️⃣ Fetch admin by ID
    const [rows] = await db.query("SELECT * FROM admins WHERE id = ?", [req.admin.id]);
    if (rows.length === 0) return res.status(404).json({ message: "Admin not found" });

    const admin = rows[0];

    // 2️⃣ Check current password
    const isMatch = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!isMatch) return res.status(400).json({ message: "Current password is incorrect" });

    // 3️⃣ Hash new password
    const hash = await bcrypt.hash(newPassword, 10);

    // 4️⃣ Update username + password
    await db.query(
      "UPDATE admins SET username = ?, password_hash = ? WHERE id = ?",
      [username || admin.username, hash, req.admin.id]
    );

    res.json({ message: "Profile updated successfully!" });
  } catch (err) {
    console.error("❌ Error updating admin:", err.message);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
