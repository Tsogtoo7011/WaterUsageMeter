const crypto = require('crypto');
const sendEmail = require('./emailService');

exports.generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

exports.sendVerificationEmail = async (email, token, firstname) => {
  const encodedToken = encodeURIComponent(token);
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const verificationUrl = `${frontendUrl}/user/verify-email?token=${encodedToken}`;
  
  console.log(`Sending verification email to ${email} with URL: ${verificationUrl}`);
  
  await sendEmail({
    to: email,
    subject: 'Имэйл хаягаа баталгаажуулна уу',
    html: `
      <h1>Имэйл хаягаа баталгаажуулна уу</h1>
      <p>Сайн байна уу, ${firstname}!</p>
      <p>Бүртгэлээ дуусгахын тулд доорх холбоос дээр дарна уу:</p>
      <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px;">Имэйл хаягаа баталгаажуулах</a>
      <p>Энэхүү холбоос нь 24 цагийн дараа хүчингүй болно.</p>
      <p>Хэрэв та бүртгүүлээгүй бол энэ имэйлийг орхигдуулна уу.</p>
    `
  });
};