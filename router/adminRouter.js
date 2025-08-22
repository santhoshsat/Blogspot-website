// admin router

const express = require('express')
const upload = require('../middleware/multerMiddleware.js')
const { uploadEditorFile } = require('../controller/uploadController.js')
const { adminLogin, approveCommentsById, deleteCommentsById,
    getAllBlogsAdmin, getAllComments, getDashboard, verifySluglify, updateProfile
 } = require('../controller/adminController.js')
const { getAdminViewsPerYear } = require('../controller/stats_controller.js')

const { AdminAuth, authorizeRoles } = require('../middleware/authMiddleware.js')

const adminRoutes = express.Router()

adminRoutes.post('/login', adminLogin)

adminRoutes.get('/dashboard', AdminAuth, getDashboard)
adminRoutes.get('/stats-per-year', AdminAuth, getAdminViewsPerYear)
adminRoutes.get('/comments', AdminAuth, getAllComments)
adminRoutes.get('/blogs', AdminAuth, getAllBlogsAdmin)

adminRoutes.post('/editor-image', upload.single('file'), uploadEditorFile);
adminRoutes.post('/verifyslug', AdminAuth, verifySluglify);
adminRoutes.put('/updateProfile', AdminAuth, upload.single('file'), updateProfile);

adminRoutes.delete('/delComment/:id', AdminAuth, deleteCommentsById)
adminRoutes.put('/approveComment/:id', AdminAuth, approveCommentsById)

module.exports = adminRoutes;