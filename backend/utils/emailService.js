const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
  // 1. Verify configuration
  const requiredEnvVars = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASSWORD', 'EMAIL_FROM_ADDRESS'];
  for (const varName of requiredEnvVars) {
    if (!process.env[varName]) {
      throw new Error(`Missing required email configuration: ${varName}`);
    }
  }

  // 2. Create transporter with enhanced options
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    },
    // Connection pool options
    pool: true,
    maxConnections: 5,
    maxMessages: 100,
    // Debugging
    logger: true,
    debug: true
  });

  // 3. Verify connection
  try {
    await transporter.verify();
    console.log('SMTP connection verified');
  } catch (error) {
    console.error('SMTP connection failed:', error);
    throw new Error('SMTP connection failed');
  }

  // 4. Prepare email with enhanced options
  const mailOptions = {
    from: `"${process.env.EMAIL_FROM_NAME || 'Water Usage App'}" <${process.env.EMAIL_FROM_ADDRESS}>`,
    to: options.to,
    subject: options.subject,
    text: options.text || stripHtml(options.html),
    html: options.html,
    // Important headers
    headers: {
      'X-Priority': '1',
      'X-Mailer': 'WaterUsageApp/1.0',
      'List-Unsubscribe': `<mailto:unsubscribe@yourdomain.com?subject=Unsubscribe>`
    },
    // Delivery status notifications
    dsn: {
      id: generateMessageId(),
      return: 'headers',
      notify: ['failure', 'delay'],
      recipient: process.env.EMAIL_ADMIN_ADDRESS
    }
  };

  // 5. Send email with retries
  const maxRetries = 3;
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const info = await transporter.sendMail(mailOptions);
      console.log(`Email sent to ${options.to} (attempt ${attempt})`, {
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected
      });
      return info;
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt} failed:`, error);
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 2000 * attempt));
      }
    }
  }

  throw lastError;
};

// Helper function to generate message ID
function generateMessageId() {
  return `<${Date.now()}${Math.random().toString(16).substr(2)}@yourdomain.com>`;
}

// Helper function to strip HTML
function stripHtml(html) {
  return html ? html.replace(/<[^>]*>/g, '') : '';
}

module.exports = sendEmail;