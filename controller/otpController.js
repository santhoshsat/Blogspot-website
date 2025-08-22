const randomString = require('randomstring')
const prisma = require('../config/prismaConfig.js')
const transporter = require('../config/nodemailConfig.js')
const { generateOTPEmailTemplate } = require('../utils/genOTPTemp.js')

let otpCache2 = {
    adminEmail: '',
    generatedOTP: null,
    expiresAt: '',
};

const sendOtp = async (req, res) => {
  try {
    const { email, logInusr, role } = req.body;
    const { IPAdd, browser, device, location, os, Date: Dates, Time: Times } = logInusr;

    const user = role === 'Admin'
      ? await prisma.admin.findUnique({ where: { userEmail: email } })
      : await prisma.superAdmin.findUnique({ where: { email } });
    console.log("founded db data")
    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Invalid credentials' });
    }
    console.log("user also valid")

    // Generate OTP
    const generateOTP = randomString.generate({ length: 6, charset: 'numeric' });
    console.log("otp generted")

    otpCache2 = {
      generatedOTP: generateOTP,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
      adminEmail: user.userEmail || user.email,
    };
    console.log("otp2 generted")

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'OTP Verification',
      html: generateOTPEmailTemplate({
        otp: generateOTP,
        email,
        ipAddress: IPAdd,
        location,
        userAgent: device,
        browser,
        os,
        currdate: Dates,
        currTime: Times,
      }),
    };
    console.log("mail options generted")

    const info = await transporter.sendMail(mailOptions);
    console.log(info)
    if (!info) {
      return res.status(400).json({ success: false, message: 'Error while sending OTP to email' });
    }

    return res.status(200).json({ success: true, message: 'OTP sent to mail successfully' });

  } catch (error) {
    console.log(error?.message || error)
    return res.status(500).json({ success: false, message: error.message || error });
  }
};

const verifyOtp = async (req, res) => {
  try {
    const { email, otp, role } = req.body;
    const { adminEmail, generatedOTP, expiresAt } = otpCache2;

    const user = role === 'Admin'
      ? await prisma.admin.findUnique({ where: { userEmail: email } })
      : await prisma.superAdmin.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Invalid credentials' });
    }

    if (!email || !otp) {
      return res.status(400).json({ success: false, message: 'Email and OTP are required' });
    }

    if (Date.now() > expiresAt) {
      return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
    }

    if (adminEmail !== email) {
      return res.status(400).json({ success: false, message: 'Email mismatch. Please request a new OTP.' });
    }

    if (generatedOTP === otp) {
      return res.status(200).json({ success: true, message: 'OTP verified successfully!' });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid OTP. Please try again.' });
    }

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || error });
  }
};

module.exports = {
    sendOtp, verifyOtp
}