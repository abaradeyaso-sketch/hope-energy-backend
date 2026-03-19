// backend/middleware/auth.js
import jwt from "jsonwebtoken";

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  // ✅ 1. Check for Bearer token
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    // ✅ 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // ✅ 3. Attach decoded user info to request
    req.admin = decoded;
    next();
  } catch (err) {
    console.error("❌ Invalid or expired token:", err.message);
    return res.status(403).json({ message: "Invalid or expired token." });
  }
};

export default verifyToken;
