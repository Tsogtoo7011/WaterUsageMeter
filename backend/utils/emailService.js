const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  const requiredEnvVars = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASSWORD', 'EMAIL_FROM_ADDRESS'];
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      throw new Error(`Missing required email configuration: ${varName}`);
    }
  }

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },

    pool: true,
    maxConnections: 5,
    maxMessages: 100,

    logger: true,
    debug: true
  });

  try {
    await transporter.verify();
  } catch (error) {
    throw new Error('SMTP connection failed');
  }

  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'Water Usage App'}" <${process.env.EMAIL_FROM_ADDRESS}>`,
    to: options.to,
    subject: options.subject,
    text: options.text || stripHtml(options.html),
    html: options.html,
    headers: {
      'X-Priority': '1',
      'X-Mailer': 'WaterUsageApp/1.0',
      'List-Unsubscribe': `<mailto:unsubscribe@yourdomain.com?subject=Unsubscribe>`
    },
    dsn: {
      id: generateMessageId(),
      return: 'headers',
      notify: ['failure', 'delay'],
      recipient: process.env.EMAIL_ADMIN_ADDRESS
    }
  };

  const maxRetries = 3;
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const info = await transporter.sendMail(mailOptions);
      return info;
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }
  }

  throw lastError;
};

function generateMessageId() {
  return `<${Date.now()}${Math.random().toString(16).substr(2)}@yourdomain.com>`;
}

function stripHtml(html) {
  return html ? html.replace(/<[^>]*>/g, '') : '';
}

module.exports = sendEmail;