const sgMail = require("@sendgrid/mail");
require("dotenv").config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

async function sendEmail(to, subject, text) {
  const mailOptions = {
    from: "lusobites.contact@gmail.com",
    to: to,
    subject: subject,
    text: text,
  };

  try {
    await sgMail.send(mailOptions);
    console.log("Email sent successfully");
  } catch (error) {
    console.log("Error:", error);
  }
}

module.exports = { sendEmail };