require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const app = express();
const arcjetMiddleware = require('./middleware/arcjetMiddleware.js');
const port = process.env.PORT || 5000;

const { startPublishBlogCron } = require('./utils/publishBlog');
const { startDraftReminderCron } = require('./utils/remindDrafts');

// ------------------ ROUTE IMPORTS ------------------
const adminRouter = require('./router/adminRouter.js');
const blogRouter = require('./router/blogRouter.js');
const otpRouter = require('./router/otpRouter.js');
const superRouter = require('./router/superadminRouter.js');


// ------------------ MIDDLEWARE ------------------
app.use(cors());
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(arcjetMiddleware);

// Start cron jobs
startPublishBlogCron();
startDraftReminderCron();

// ------------------ STATIC FILES ------------------
app.use(express.static(path.join(__dirname, 'dist')));
// Serve uploaded images from /uploads folder
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ------------------ API ROUTES ------------------
app.use('/api/v1/admin', adminRouter);

app.use('/api/v1/blog', blogRouter);
app.use('/api/v1/otp', otpRouter);
app.use('/api/v1/superadmin', superRouter);

// ------------------ SPA FALLBACK ------------------
app.all('/{*any}', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// ------------------ START SERVER ------------------
app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});