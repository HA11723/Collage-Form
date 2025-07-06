import nodemailer from "nodemailer";
import { buffer } from "micro";
import dotenv from "dotenv";

dotenv.config();

// Setup Gmail transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const contentType = event.headers["content-type"];
    const boundary = contentType.split("boundary=")[1];
    const rawBody = Buffer.from(event.body, "base64");

    const busboy = (await import("busboy")).default;
    const bb = busboy({ headers: { "content-type": contentType } });

    const fields = {};
    const files = [];

    return new Promise((resolve, reject) => {
      bb.on("field", (name, val) => (fields[name] = val));

      bb.on("file", (name, file, info) => {
        const buffers = [];
        file.on("data", (data) => buffers.push(data));
        file.on("end", () => {
          files.push({
            filename: info.filename,
            content: Buffer.concat(buffers),
            contentType: info.mimeType,
          });
        });
      });

      bb.on("finish", async () => {
        // Find the signature file
        const signatureFile = files.find((f) => f.filename === "signature.png");

        if (!signatureFile) {
          return resolve({
            statusCode: 400,
            body: JSON.stringify({ success: false, error: "Missing signature" }),
          });
        }

        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: process.env.EMAIL_RECEIVER,
          subject: "הרשמה חדשה למכללת אופק טירה",
          html: `
            <p><strong>שם פרטי:</strong> ${fields.firstName}</p>
            <p><strong>שם משפחה:</strong> ${fields.lastName}</p>
            <p><strong>תעודת זהות:</strong> ${fields.idNumber}</p>
            <p><strong>מין:</strong> ${fields.gender}</p>
            <p><strong>טלפון:</strong> ${fields.phone}</p>
            <p><strong>מסלול:</strong> ${fields.program}</p>
            <p><strong>חתימה:</strong><br><img src="cid:signature" width="200"/></p>
          `,
          attachments: [
            // All other files except the signature
            ...files.filter(f => f.filename !== "signature.png").map(f => ({
              filename: f.filename,
              content: f.content,
              contentType: f.contentType,
            })),
            // Signature file (inline)
            {
              filename: "signature.png",
              content: signatureFile.content,
              contentType: signatureFile.contentType,
              cid: "signature",
            },
          ],
        };

        await transporter.sendMail(mailOptions);
        resolve({
          statusCode: 200,
          body: JSON.stringify({ success: true }),
        });
      });

      bb.end(rawBody);
    });
  } catch (err) {
    console.error("❌ Error sending email:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: err.message }),
    };
  }
};
