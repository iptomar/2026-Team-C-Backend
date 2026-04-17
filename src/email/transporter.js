const nodemailer = require("nodemailer");
require('dotenv').config()

async function sendEmail(to, subject, text) {
  const transporter = nodemailer.createTransport({
  service: "gmail",
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: "lusobites.contact@gmail.com",
    pass: process.env.GOOGLE_APP_PASSWORD, // The 16-character App Password
  },
  });

  // Configure the mailoptions object
  const mailOptions = {
    from: 'lusobites.contact@gmail.com',
    to: to,
    subject: subject,
    text: text
  };

  // Send the email
  transporter.sendMail(mailOptions, function(error, info){
    if (error) {
      console.log('Error:', error);
    } else {
      console.log('Email sent: ', info.response);
    }
  });
  }


module.exports = {sendEmail};