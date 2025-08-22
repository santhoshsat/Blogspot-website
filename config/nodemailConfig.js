const envPath = process.env.NODE_ENV === 'production'? '' : '.env.development.local'

require('dotenv').config({ path: envPath });
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

module.exports = transporter

// const mailOptions = {
//   from: process.env.EMAIL_FROM,
//   to: process.env.EMAIL_TO,
//   subject: 'Test Email from Your Server',
//   text: 'Hello! This is a test email sent from a custom Node.js project.',
//   html: '<h2>Hello!</h2><p>This is a <strong>test email</strong> sent using your server.</p>',
// };

// transporter.sendMail(mailOptions, (error, info) => {
//   if (error) {
//     console.error('❌ Error sending email:', error);
//   } else {
//     console.log('✅ Email sent:', info.response);
//   }
// });
