// 📁 netlify/functions/sendEmail.js
import nodemailer from "nodemailer";

export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method Not Allowed",
    };
  }

  try {
    const data = JSON.parse(event.body);
    const { firstName, lastName, idNumber, gender, phone, program, signature } =
      data;

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `\u05D8\u05D5\u05E4\u05E1 \u05D4\u05E8\u05E9\u05DE\u05D4 <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_RECEIVER,
      subject:
        "\uD83D\uDCDD \u05D8\u05D5\u05E4\u05E1 \u05D4\u05E8\u05E9\u05DE\u05D4 \u05D7\u05D3\u05E9 - \u05DE\u05DB\u05DC\u05DC\u05EA \u05D0\u05D5\u05E4\u05E7 \u05D8\u05D9\u05E8\u05D4",
      html: `
        <h2>\uD83D\uDCCB \u05E4\u05E8\u05D8\u05D9 \u05D8\u05D5\u05E4\u05E1</h2>
        <p><strong>\u05E9\u05DD \u05E4\u05E8\u05D8\u05D9:</strong> ${firstName}</p>
        <p><strong>\u05E9\u05DD \u05DE\u05E9\u05E4\u05D7\u05D4:</strong> ${lastName}</p>
        <p><strong>\u05EA.\u05D6:</strong> ${idNumber}</p>
        <p><strong>\u05DE\u05D9\u05DF:</strong> ${gender}</p>
        <p><strong>\u05D8\u05DC\u05E4\u05D5\u05DF:</strong> ${phone}</p>
        <p><strong>\u05DE\u05E1\u05DC\u05D5\u05DC:</strong> ${program}</p>
        <p><strong>\u05D7\u05EA\u05D9\u05DE\u05D4:</strong></p>
        <img src="${signature}" width="300" style="border: 1px solid #ccc;" />
      `,
    };

    await transporter.sendMail(mailOptions);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, message: "Email sent" }),
    };
  } catch (error) {
    console.error("Error sending email:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: "Server error" }),
    };
  }
}
