const nodemailer = require('nodemailer');

/**
 * Send an email
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject 
 * @param {string} options.text - Plain text content (optional)
 * @param {string} options.html - HTML content (optional)
 */
const sendEmail = async (options) => {
  // Create transporter with configuration object
  const smtpConfig = {
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true', // use SSL if secure is true
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  };
  
  const transporter = nodemailer.createTransport(smtpConfig);

  // Define email options
  const mailOptions = {
    from: `${process.env.EMAIL_FROM_NAME} <${process.env.EMAIL_FROM_ADDRESS}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  // Send email
  await transporter.sendMail(mailOptions);
};
module.exports = sendEmail;