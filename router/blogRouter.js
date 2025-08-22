const express = require('express')
const upload = require('../middleware/multerMiddleware.js')
const { AdminAuth } = require('../middleware/authMiddleware.js')

const BlogRoutes = express.Router()
const { getAllBlog, addBlog, deleteBlogbyId, 
    subscribeForNewBlog, getUserDrafts, saveDraftBlog,
    togglePublish, getBlogbyId, getBlogBySlug, MoveToTrash, getRetriveFromTrash,
    getAuthorName, fetchFaqs
} = require('../controller/blogController.js')

const { addComment, getBlogComments } = require('../controller/commentController.js')

// blog routes
BlogRoutes.post('/addBlog', AdminAuth, upload.single('image'), addBlog)
BlogRoutes.get('/getBlog/:blogId', AdminAuth, getBlogbyId)
BlogRoutes.delete('/del/:delBlog', AdminAuth, deleteBlogbyId)
BlogRoutes.put('/toggle-publish/:id', AdminAuth, togglePublish)
BlogRoutes.get('/getFaq/:blogId', fetchFaqs)

BlogRoutes.get('/allBlogs', getAllBlog)
BlogRoutes.get('/blogBySlug/:category/:slug', getBlogBySlug)
BlogRoutes.get('/getAuthorName/:blogId', getAuthorName)

// comments routes
BlogRoutes.get('/getComments/:blogId', getBlogComments)
BlogRoutes.post('/addComment', addComment)

// subscribe routes
BlogRoutes.post('/subscribe', subscribeForNewBlog)

// Drafts
BlogRoutes.post('/createDraft', upload.single('image'), AdminAuth, saveDraftBlog)
BlogRoutes.get('/getDraft', AdminAuth, getUserDrafts)

// Trash
BlogRoutes.put('/moveToTrash/:id', AdminAuth, MoveToTrash)
BlogRoutes.get('/getFromTrash', AdminAuth, getRetriveFromTrash)

module.exports = BlogRoutes;