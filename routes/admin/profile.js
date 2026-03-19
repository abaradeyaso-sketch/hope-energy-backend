// backend/routes/admin/profile.js
import express from "express";
import bcrypt from "bcrypt";
import db from "../../config/db.js";
import verifyToken from "../../middleware/auth.js";

const router = express.Router();

/**
 * PUT /api/admin/profile/update
 * Update admin username and/or password
 */
router.put("/update", verifyToken, async (req, res) => {
  try {
    const { username, currentPassword, newPassword } = req.body;

    // 1️⃣ Fetch admin by ID from token
    const [rows] = await db.query("SELECT * FROM admins WHERE id = ?", [req.admin.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: "Admin not found." });
    }

    const admin = rows[0];

    // 2️⃣ Verify current password
    const isMatch = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect." });
    }

    // 3️⃣ Prepare updates
    const updates = [];
    const values = [];

    if (username && username !== admin.username) {
      updates.push("username = ?");
      values.push(username);
    }

    if (newPassword) {
      const saltRounds = parseInt(process.env.ADMIN_PASSWORD_SALT_ROUNDS || "10", 10);
      const hashed = await bcrypt.hash(newPassword, saltRounds);
      updates.push("password_hash = ?");
      values.push(hashed);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "No changes detected." });
    }

    // 4️⃣ Save updates
    values.push(req.admin.id);
    await db.query(`UPDATE admins SET ${updates.join(", ")} WHERE id = ?`, values);

    res.json({ message: "✅ Profile updated successfully!" });
  } catch (err) {
    console.error("❌ Error updating admin profile:", err.message);
    res.status(500).json({ message: "Server error updating profile." });
  }
});

export default router;
