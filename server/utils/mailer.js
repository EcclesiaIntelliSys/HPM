// mailer.js
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.TITAN_HOST,
  port: Number(process.env.TITAN_PORT),
  secure: false,
  auth: {
    user: process.env.TITAN_USER,
    pass: process.env.TITAN_PASS,
  },
});

transporter.verify((error, success) => {
  if (error) {
    console.error("SMTP connection failed:", error);
  } else {
    console.log("SMTP connection successful");
  }
});

module.exports = transporter;
