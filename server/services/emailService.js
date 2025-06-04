// Service for sending emails (OTP and Google password)
require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS   // App password or real password from .env
  }
});

async function sendOTPEmail(toEmail, otp) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: 'Your OTP Code',
    text: `Your OTP code is ${otp}`
  };
  await transporter.sendMail(mailOptions);
}

async function sendPasswordEmail(toEmail, password) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: 'Your Local Login Password',
    text: `Your temporary password is: ${password}. Please change it after logging in.`
  };
  await transporter.sendMail(mailOptions);
}

module.exports = { sendOTPEmail, sendPasswordEmail };
