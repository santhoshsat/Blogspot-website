const generateOTPEmailTemplate = ({ email, otp, currdate, currTime, 
  location, userAgent, ipAddress, browser, os }) => {

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Your OTP Code</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background-color: #f6f8fa;
        color: #333;
        padding: 20px;
      }
      .container {
        max-width: 600px;
        margin: auto;
        background-color: #ffffff;
        padding: 30px;
        border-radius: 10px;
        box-shadow: 0px 4px 12px rgba(0, 0, 0, 0.1);
      }
      .otp-code {
        font-size: 32px;
        font-weight: bold;
        color: #2e7d32;
        margin: 20px 0;
      }
      .details {
        font-size: 14px;
        line-height: 1.6;
        color: #555;
      }
      .footer {
        margin-top: 30px;
        font-size: 12px;
        color: #888;
        text-align: center;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>Hello,</h2>
      <p>OTP for admin panel is:</p>
      <div class="otp-code">${otp}</div>
      <p class="details">
        <strong>Email:</strong> ${email}<br>
        <strong>IpV6:</strong> ${ipAddress}<br>
        <strong>Location:</strong> ${location}<br>
        <strong>User Agent:</strong> ${userAgent}<br>
        <strong>Time:</strong> ${currTime}<br>
        <strong>Date:</strong> ${currdate}<br>
        <strong>Browser:</strong> ${browser}<br>
        <strong>OS:</strong> ${os}
      </p>
      <p>If you did not initiate this request, please secure your account immediately.</p>
      <div class="footer">
        This OTP is valid for 5 minutes. Do not share it with anyone.<br>
        &copy; ${new Date().getFullYear()} Your Company
      </div>
    </div>
  </body>
  </html>
  `;
}

const generateNewBlogEmail = ({ blogTitle, blogSummary, categorySlug, slug }) => {
  return `
  <!DOCTYPE html>
  <html lang="en" style="margin: 0; padding: 0;">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>New Blog Notification</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        color: #333;
        background-color: #f7f7f7;
        margin: 0;
        padding: 0;
      }
      .container {
        max-width: 600px;
        margin: 40px auto;
        background-color: #ffffff;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        overflow: hidden;
      }
      .header {
        background-color: #004aad;
        color: #ffffff;
        padding: 20px 30px;
        text-align: center;
      }
      .content {
        padding: 30px;
      }
      .content h2 {
        color: #004aad;
      }
      .content p {
        line-height: 1.6;
      }
      .cta-button {
        display: inline-block;
        margin-top: 20px;
        padding: 12px 24px;
        background-color: #004aad;
        color: #ffffff !important;
        text-decoration: none;
        border-radius: 4px;
        font-weight: bold;
      }
      .footer {
        text-align: center;
        padding: 20px;
        font-size: 12px;
        color: #777;
        background-color: #f1f1f1;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>New Blog Posted</h1>
      </div>
      <div class="content">
        <h2>${blogTitle}</h2>
        <p>${blogSummary}</p>
        <a href="https://www.cospixaretechnologies.in/blog/${categorySlug}/${slug}" class="cta-button">Read Full Blog</a>
      </div>
      <div class="footer">
        You are receiving this email because you subscribed to ${'Cospixare-Technologies Blog'}.<br>
      </div>
    </div>
  </body>
  </html>
  `;
}


module.exports = {
  generateOTPEmailTemplate,
  generateNewBlogEmail
};