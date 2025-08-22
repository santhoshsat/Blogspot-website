const express = require('express');
const upload = require('../middleware/multerMiddleware.js');
const {
  getBlogsById,
  createAdmin,
  deleteAdminById,
  getAllAdminProfiles,
  TransferBlogOwnership,
  createSuperAdmin,
  getDashboard, resetPassword, getAllSComments
} = require('../controller/SAdminController');
const {
  getAdminBlogStats,
  getViewsPerMonth,
} = require('../controller/stats_controller.js');
const { SuperAdminAuth } = require('../middleware/authMiddleware.js');

const SuperRouter = express.Router();

SuperRouter.get('/getComments', SuperAdminAuth, getAllSComments);

// 🛡️ Super Admin Creation (no auth needed)
SuperRouter.post('/createSadmin', createSuperAdmin);
SuperRouter.post('/resetPassword', resetPassword);

// 📊 Dashboard & Stats (protected)
SuperRouter.get('/getDashboard', SuperAdminAuth, getDashboard);
SuperRouter.get('/stats/views-per-month', SuperAdminAuth, getViewsPerMonth);
SuperRouter.get('/stats/admin-blog-stats', SuperAdminAuth, getAdminBlogStats);

// 👨‍💼 Admin Management (protected)
SuperRouter.get('/admins', SuperAdminAuth, getAllAdminProfiles);
SuperRouter.post('/admin/create', SuperAdminAuth, upload.single('image'), createAdmin);
SuperRouter.delete('/admin/:adminId', SuperAdminAuth, deleteAdminById);

// 📚 Blog Management (protected)
SuperRouter.get('/admin/:adminId/blogs', SuperAdminAuth, getBlogsById);
SuperRouter.put('/admin/transfer-blog', SuperAdminAuth, TransferBlogOwnership);


module.exports = SuperRouter;