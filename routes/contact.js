// backend/routes/contact.js
import express from "express";
import nodemailer from "nodemailer";
import db from "../config/db.js";
const router = express.Router();

/**
 * TEST ROUTE
 * GET /api/contact
 */
router.get("/", (req, res) => {
  res.json({ message: "✅ Contact API is working!" });
});

/**
 * POST /api/contact
 * Save message to DB and send notification + confirmation email
 */
router.post("/", async (req, res) => {
  try {
    const { name, email, phone, service, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // ✅ Save to database (matching your table fields)
    const [result] = await db.query(
      `INSERT INTO contact_submissions (name, email, phone_number, service_type, details, submission_date)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [name, email, phone || "", service || "", message]
    );

    // ✅ Configure transporter
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // ✅ Admin notification email
    await transporter.sendMail({
      from: `"Hope Energy Website" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_TO || process.env.EMAIL_USER,
      subject: `📬 New Contact Request from ${name}`,
      html: `
        <h2>New Contact Submission</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Phone:</strong> ${phone || "(none)"}</p>
        <p><strong>Service Type:</strong> ${service || "(none)"}</p>
        <p><strong>Message:</strong><br>${message}</p>
        <hr />
        <p>✅ Received on: ${new Date().toLocaleString()}</p>
      `,
    });

    // ✅ Auto-reply to user
    await transporter.sendMail({
      from: `"Hope Energy Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `🌞 Thank You for Contacting Hope Energy`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2 style="color: #0f766e;">Hello ${name},</h2>
          <p>
            Thank you for reaching out to <strong>Hope Energy Electromechanical Work PLC</strong>!
          </p>
          <p>
            We’ve received your message regarding 
            <b>${service || "general inquiry"}</b> and our team will get back to you as soon as possible.
          </p>
          <blockquote style="border-left: 4px solid #10b981; padding-left: 8px; color: #333;">
            “${message}”
          </blockquote>
          <p>
            Best regards,<br />
            <strong>Hope Energy Team</strong><br />
            🌍 Empowering Ethiopia’s Renewable Future
          </p>
        </div>
      `,
    });

    res.json({
      success: true,
      message: "✅ Message sent and confirmation email delivered!",
      insertedId: result.insertId,
    });
  } catch (err) {
    console.error("❌ Contact route error:", err.message);
    res.status(500).json({ error: "Failed to process message" });
  }
});

export default router;
