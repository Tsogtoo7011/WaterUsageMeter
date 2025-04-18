const crypto = require('crypto');
const nodemailer = require('nodemailer');

exports.generateVerificationToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

exports.sendVerificationEmail = async (email, token, firstname) => {

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
      }
    });

    const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
    const baseUrl = backendUrl.endsWith('/') ? backendUrl.slice(0, -1) : backendUrl;
    const verificationLink = `${baseUrl}/api/verification/verify-email?token=${token}`;
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Имэйл хаяг баталгаажуулах',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Сайн байна уу, ${firstname}!</h2>
          <p>Та бүртгэлээ баталгаажуулахын тулд доорх холбоосыг дарна уу:</p>
          <p><a href="${verificationLink}" style="background-color: #4CAF50; color: white; padding: 10px 15px; text-align: center; text-decoration: none; display: inline-block; border-radius: 5px;">Имэйл баталгаажуулах</a></p>
          <p>Эсвэл доорх холбоосыг хуулж, вэб хөтчид тавьж ашиглана уу:</p>
          <p>${verificationLink}</p>
          <p><strong>Анхааруулга:</strong> Энэ холбоос зөвхөн 30 минутын хугацаанд хүчинтэй.</p>
          <p>Хэрэв та бүртгүүлэх хүсэлт гаргаагүй бол энэ имэйлийг үл тоомсорлоно уу.</p>
          <p>Баярлалаа,<br>Танай Баг</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
};