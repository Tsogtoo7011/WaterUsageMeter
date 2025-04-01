// test-email.js
require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmailService() {
  console.log('Testing email service with the following configuration:');
  console.log('Host:', process.env.EMAIL_HOST);
  console.log('Port:', process.env.EMAIL_PORT);
  console.log('Secure:', process.env.EMAIL_SECURE);
  console.log('User:', process.env.EMAIL_USER);
  console.log('From Name:', process.env.EMAIL_FROM_NAME);
  console.log('From Address:', process.env.EMAIL_FROM_ADDRESS);

  // Create transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });

  try {
    // Verify connection
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('SMTP connection successful!');

    // Test sending an email
    console.log('Sending test email...');
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME}" <${process.env.EMAIL_FROM_ADDRESS}>`,
      to: process.env.EMAIL_USER, // Send to yourself for testing
      subject: "Email Service Test",
      text: "This is a test email to verify that your email service is working correctly.",
      html: "<h1>Email Test</h1><p>This is a test email to verify that your email service is working correctly.</p>",
    });

    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    return true;
  } catch (error) {
    console.error('Error during email test:', error);
    return false;
  }
}

// Run the test
testEmailService()
  .then(success => {
    if (success) {
      console.log('Email service test passed!');
    } else {
      console.log('Email service test failed!');
    }
    process.exit(0);
  })
  .catch(err => {
    console.error('Unexpected error:', err);
    process.exit(1);
  });