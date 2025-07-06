import nodemailer from "nodemailer";
import multer from "multer";
import { buffer } from "micro";
import dotenv from "dotenv";

dotenv.config();

// Create transport
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

export const handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const boundary = event.headers["content-type"].split("boundary=")[1];
    const rawBody = Buffer.from(event.body, "base64");

    // Use `busboy` or a multipart parser to extract form-data
    const busboy = await import("busboy");
    const bb = busboy.default({ headers: { "content-type": event.headers["content-type"] } });

    const fields = {};
    const files = [];

    return new Promise((resolve, reject) => {
      bb.on("field", (name, val) => (fields[name] = val));
      bb.on("file", (name, file, info) => {
        const buffers = [];
        file.on("data", d => buffers.push(d));
        file.on("end", () => {
          files.push({
            filename: info.filename,
            content: Buffer.concat(buffers),
            contentType: info.mimeType,
          });
        });
      });

      bb.on("finish", async () => {
        const mailOptions = {
          from: process.env.MAIL_USER,
          to: process.env.MAIL_TO,
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
            ...files.map(f => ({
              filename: f.filename,
              content: f.content,
              contentType: f.contentType,
            })),
            {
              filename: "signature.png",
              content: files.find(f => f.filename === "signature.png")?.content,
              cid: "signature",
            },
          ],
        };

        await transporter.sendMail(mailOptions);
        resolve({ statusCode: 200, body: JSON.stringify({ success: true }) });
      });

      bb.end(rawBody);
    });
  } catch (error) {
    console.error("Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: error.message }),
    };
  }
};
