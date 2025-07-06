// server.js
import express from "express";
import nodemailer from "nodemailer";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

// Setup __dirname for ES Module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: "5mb" }));
app.use(express.static(path.join(__dirname, "public")));

// Handle form submission
app.post("/send-email", async (req, res) => {
  const { firstName, lastName, idNumber, gender, phone, program, signature } =
    req.body;

  try {
    // Nodemailer setup (use Gmail with App Password)
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER, // your Gmail
        pass: process.env.EMAIL_PASS, // your App Password
      },
    });

    // Email content
    const mailOptions = {
      from: `"טופס הרשמה" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_RECEIVER, // ✅ this is who will receive the form
      subject: "📝 טופס הרשמה חדש - מכללת אופק טירה",
      html: `
        <h2>📋 פרטי טופס</h2>
        <p><strong>שם פרטי:</strong> ${firstName}</p>
        <p><strong>שם משפחה:</strong> ${lastName}</p>
        <p><strong>ת.ז:</strong> ${idNumber}</p>
        <p><strong>מין:</strong> ${gender}</p>
        <p><strong>טלפון:</strong> ${phone}</p>
        <p><strong>מסלול:</strong> ${program}</p>
        <p><strong>חתימה:</strong></p>
        <img src="${signature}" width="300" style="border: 1px solid #ccc;" />
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.json({ success: true, message: "Email sent successfully" });
  } catch (error) {
    console.error("❌ Failed to send email:", error);
    res.status(500).json({ success: false, message: "Failed to send email" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
