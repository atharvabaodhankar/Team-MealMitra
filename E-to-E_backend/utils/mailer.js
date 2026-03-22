const nodemailer = require("nodemailer");

const emailPort = parseInt(process.env.EMAIL_PORT, 10) || 587;

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: emailPort,
  // Port 465 uses implicit TLS; all other ports (587, 25) use STARTTLS
  secure: emailPort === 465,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

module.exports = transporter;