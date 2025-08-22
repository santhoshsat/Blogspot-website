// otp routes

const express = require('express')
const { sendOtp, verifyOtp } = require('../controller/otpController.js')

const otpRoutes = express.Router()

otpRoutes.post('/reqOTP', sendOtp)
otpRoutes.post('/verifyOTP', verifyOtp)

module.exports = otpRoutes;