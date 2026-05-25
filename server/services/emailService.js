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

async function sendOrderConfirmationEmail(toEmail, order) {
  const itemsList = order.items
    .map(
      item =>
        `- ${item.quantity}x ${item.product && item.product.name ? item.product.name : 'Product'} (${item.size || 'N/A'}/${item.color || 'N/A'}) - ₹${item.price}`
    )
    .join('\n');

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: toEmail,
    subject: `Order Confirmation - #${order._id.toString().slice(-6).toUpperCase()}`,
    text: `Hi,

Thank you for your order! Your payment was successful and we are processing your order.

Order Details:
Order ID: ${order._id}
Delivery Address: ${order.address}
Contact Number: ${order.phone}
Total Paid: ₹${order.totalAmount.toFixed(2)}

Items:
${itemsList}

If you have any questions, feel free to reply to this email.

Best regards,
WOT (World of Tshirts) Team`
  };
  await transporter.sendMail(mailOptions);
}

module.exports = { sendOTPEmail, sendPasswordEmail, sendOrderConfirmationEmail };
