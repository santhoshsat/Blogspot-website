const fs = require('fs')
const slugify = require('slugify')
const ImagekitConfig = require('../config/ImagekitConfig.js')
const { processEditorContent } = require('../utils/editorContentProcessor')

const prisma = require('../config/prismaConfig.js')
const transporter = require('../config/nodemailConfig.js')
const { generateNewBlogEmail } = require('../utils/genOTPTemp.js')

const addBlog = async (req, res) => {
  try {
        const { title, subtitle, description, category,
                isPublished, faqs, isScheduled, scheduledTime, theme, slug } = JSON.parse(req.body.blog);
        console.log(JSON.parse(req.body.blog))
        console.log("crossed 0.5%")
        const adminId = req.user?._id || req.user?.id;
        console.log("crossed 0")
        const imageFile = req.file;
        const existingImage = req.body?.image;
        console.log("crossed 1")

        // Validate required fields
        if (!title || !category || (!imageFile && !existingImage)) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }
        console.log("crossed 1")

        // Handle image upload
        let image;
        if (existingImage && existingImage.includes('imagekit')) {
            image = existingImage;
        } else if (imageFile) {
            const fileBuffer = fs.readFileSync(imageFile.path);
            const uploadResponse = await ImagekitConfig.upload({
                file: fileBuffer,
                fileName: imageFile.originalname,
                folder: '/blogs'
            });

            image = ImagekitConfig.url({
                path: uploadResponse.filePath,
                transformation: [
                    { quality: 'auto:low' },
                    { format: 'webp' },
                    { width: 1280 },
                    { progressive: true }
                ]
            });

            // Clean up temp file
            fs.unlinkSync(imageFile.path);
        } else {
            return res.status(400).json({ success: false, message: 'No valid image provided' });
        }
        console.log("crossed 3")

        const filteredFaqs = faqs?.map(faq => ({
          question: faq.question,
          answer: faq.answer
        }));
        console.log("crossed 4")

        // Create blog in database
        const blog = await prisma.blog.create({ 
            data: { 
                title, 
                subTitle: subtitle, 
                description,
                slug: slug,
                categorySlug: slugify(category, { lower: true, strict: true }),
                image,
                imageAlt: title,
                isPublished,
                faqs: { create: filteredFaqs },
                adminId: adminId,
                theme: theme,
                isScheduled,
                scheduledTime: isScheduled ? new Date(scheduledTime) : null,
                category: category              
              }
        });
        console.log("crossed 5")

        return res.status(201).json({
            success: true,
            message: 'Blog added successfully',
            data: blog
        });
    } catch (error) {
        console.error("Error adding blog:", error);
        
        // Clean up uploaded files if something failed
        if (req.file?.path && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }

        return res.status(500).json({ 
            success: false,
            message: error.message || 'Something went wrong'
        });
    }
};

const getAllBlog = async (req, res) => {
    try {
        const blogs = await prisma.blog.findMany({ where: { isPublished: true, isDraft: false, isTrash: false } })

        if(blogs.lenght === 0) {
            return res.status(200).json({ 
                success: true,
                message: 'No blog posts found',
                totalData: 0,
                data: []
            })
        }

        return res.status(200).json({
            success: true,
            totalData: blogs.length,
            message: 'All blogs retrieved successfully',
            data: blogs
        })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

const getBlogBySlug = async (req, res) => {
    try {
        const { category, slug } = req.params;

        // Find and increment views in one query
        const blog = await prisma.blog.updateMany({ 
          where: { categorySlug: category, slug: slug },
          data: { views: { increment: 1 } }
        })

        const updatedBlog = await prisma.blog.findFirst({
          where: {
            categorySlug: category,
            slug: slug,
          },
        });

        if (!updatedBlog) return res.status(404).json({ success: true, message: 'Blog not found' });

        return res.status(200).json({
            success: true,
            message: 'Blog retrieved successfully',
            data: updatedBlog
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

const getBlogbyId = async (req, res) => {
    try {
        const { blogId } = req.params;

        const blog = await prisma.blog.findUnique({
          where: { id: parseInt(blogId) },
          include: { faqs: true }
        });

        if(!blog) {
            return res.status(404).json({ success: true, message: 'Blog not found' })
        }

        return res.status(200).json({
            success: true,
            message: 'Blog retrieved successfully',
            data: blog
        })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

const deleteBlogbyId = async (req, res) => {
    try {
        const { delBlog } = req.params;
        const blogId = parseInt(delBlog);

        await prisma.faq.deleteMany({
          where: { blogId: blogId },
        });

        await prisma.comment.deleteMany({
          where: { blogId: blogId },
        });

        const blog = await prisma.blog.delete({ where: { id: parseInt(delBlog) } });
        // del all comments associated with blog
        await prisma.comment.deleteMany({ where: { blogId: parseInt(delBlog) }});

        return res.status(200).json({
            success: true,
            message: 'Blog deleted successfully',
        })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

const togglePublish = async (req, res) => {
    try {
        const { id } = req.params;

        const existing = await prisma.blog.findUnique({ where: { id: parseInt(id) } })

        if(!existing) return res.status(404).json({ success: false, message: 'Blog not found' })

        const wasPublished = existing.isPublished
        
        const updatedBlog = await prisma.blog.update({
          where: { id: parseInt(id) },
          data: { isPublished: !wasPublished }
        })

        // send email only if blog is published
        if(!wasPublished && updatedBlog.isPublished) {
            const subscribers = await prisma.subscribe.findMany();
            const emails = subscribers.map(sub => sub.email);
            const { title, categorySlug, slug } = updatedBlog;
            
            const mailOptions = {
                from: process.env.EMAIL_FROM,
                subject: 'New Blog Published',
                html: generateNewBlogEmail({ blogTitle: title, blogSummary:"Check our blogspot to read the content", categorySlug: categorySlug, slug: slug }),
            }

            await transporter.verify((err, success) => {
              if (err) {
                console.error("SMTP config issue:", err);
              } else {
                console.log("SMTP ready to send emails");
              } if (success) { console.log("success", success) }
            });

            await Promise.all(
                emails.map( async (email) => {
                  try {
                    await transporter.sendMail({ ...mailOptions, to: email });
                    // console.log(`Email sent to: ${email}`);
                  } catch (error) {
                    null
                    // console.error("Failed to send email", error?.message || error)
                  }
                })
            )
        }
        return res.status(200).json({ success: true, message: 'Blog status updated' })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

const subscribeForNewBlog = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        // check if email is already subscribed
        const existingSubEmail = await prisma.subscribe.findUnique({ where: { email: email } })
        if (existingSubEmail) {
            return res.status(400).json({ success: false, message: 'Email already subscribed' });
        }
        await prisma.subscribe.create({ data: { email } });

        return res.status(200).json({ success: true, message: 'Subscribed successfully' });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

const saveDraftBlog = async (req, res) => {
  try {
    const parsedBlog = req.body.blog ? typeof req.body.blog === 'string' ? JSON.parse(req.body.blog) : req.body.blog : req.body;

    const {  blogId, title, subtitle, description, category, isScheduled, scheduledTime, faqs, theme, slug } = parsedBlog;
    console.log("from draft", parsedBlog)
    const adminId = req.user?._id || req.user?.id
    const imageFile = req.file;
    console.log("From draft",imageFile)

    if (!title || !description || !category) return res.status(400).json({ success: false, message: 'Missing required fields' });

    let categorySlug = slugify(category, { lower: true, strict: true, remove: /[*+~.()'"!:@]/g });

    let image = '';
    let imageAlt = '';

    if (imageFile) {
      const fileBuffer = fs.readFileSync(imageFile.path);
      const responsefromImagekit = await ImagekitConfig.upload({
        file: fileBuffer,
        fileName: imageFile.originalname,
        folder: '/blogs/drafts',
      });
      image = await ImagekitConfig.url({
        path: responsefromImagekit.filePath,
        transformation: [
          { quality: 'auto:low' },
          { format: 'webp' },
          { width: 1280 },
          { progressive: true },
        ],
      });
      imageAlt = imageFile.originalname;
      await fs.unlinkSync(imageFile.path);
    }

    const blogData = {
      title,
      subTitle: subtitle,
      description,
      category,
      categorySlug,
      slug,
      isPublished: false,
      isScheduled: isScheduled || false,
      scheduledTime: isScheduled ? new Date(scheduledTime) : null,
      isDraft: true,
      theme,
      isTrash: false,
      adminId: parseInt(adminId),
      ...(image && { image, imageAlt })
    };

    // Add image only if uploaded
    if (image) {
      blogData.image = image;
      blogData.imageAlt = imageAlt;
    }

    let draft;

    if (blogId) {
      await prisma.faq.deleteMany({ where: { blogId: parseInt(blogId) } });
      draft = await prisma.blog.update({ 
        where: { id: parseInt(blogId) },
        data: { ...blogData, faqs: { create: faqs || [] } },
        include: { faqs: true }
       })
    } else {
      draft = await prisma.blog.create({ 
        data: { ...blogData, faqs: { create: faqs || [] } },
        include: { faqs: true }
      })
    }

    return res.status(200).json({ success: true, message: 'Draft saved successfully', blogId: draft._id });
  } catch (error) {
      // Clean up uploaded files if something failed
      if (req.file?.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
      }
      return res.status(500).json({ success: false, message: error.message });
    }
};

const getUserDrafts = async (req, res) => {
  try {
    const authorId = req.user._id || req.user.id;

    const drafts = await prisma.blog.findMany({ where: { adminId: parseInt(authorId), isDraft: true, isTrash: false, isPublished: false } })

    return res.status(200).json({ success: true, message: "Retrived successfully", data: drafts });
  } catch (err) {
    return res.status(500).json({ success: true, error: 'Failed to get drafts' });
  }
};

// Move a blog to trash
const MoveToTrash = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user?._id || req.user?.id;

    // Fetch the blog (single doc)
    const blog = await prisma.blog.findFirst({ where: { id: parseInt(id), adminId: parseInt(adminId) } });
    if (!blog) return res.status(404).json({ success: false, message: 'No blog found' })

    // Update trash status
    const updatedBlog = await prisma.blog.update({
      where: { id: parseInt(id) },
      data: {
        isTrash: !blog.isTrash, isDraft: blog.isTrash, isPublished: false
      }
    })

    return res.status(200).json({ success: true, message: updatedBlog.isTrash ? 'Blog moved to trash' : 'Blog restored from trash', });
  } catch (error) {
    return res.status(500).json({ success: false, message: error?.message || error });
  }
};

// Get all trashed blogs
const getRetriveFromTrash = async (req, res) => {
  try {
    const adminId = req.user._id || req.user.id;

    const trashedBlogs = await prisma.blog.findMany({ where: { isTrash: true, adminId: parseInt(adminId) } })
    if (!trashedBlogs || trashedBlogs.length === 0) return res.status(200).json({ success: true, message: 'No trashed blogs found' })

    return res.status(200).json({ success: true, message: 'Successfully retrieved trashed blogs', data: trashedBlogs });
  } catch (error) {
    return res.status(500).json({ success: false, message: error?.message || error });
  }
};

const getAuthorName = async (req, res) => {
  try {
    const blogId = req.params.blogId;

    // chk blog is exists?
    const blog = await prisma.blog.findUnique({ where: { id: parseInt(blogId) } })
    if(!blog) return res.status(404).json({ success: true, message: 'No blog Found' })
    
    // chk admin
    const admin = await prisma.admin.findUnique({ where: { id: blog.adminId } })
    if(!admin) return res.status(404).json({ success: true, message: "No admin Found" })
    
    return res.status(200).json({ success: true, data: admin.userName })
  } catch (error) {
    return res.status(500).json({ success: false, message: "Something went wrong" })
  }
}

const fetchFaqs = async (req, res) => {
  try {
    const {blogId} = req.params
    const blog = await prisma.faq.findMany({ where: { blogId: Number(blogId) } })
    if(!blog) return res.status(404).json({ success: false, message: "No blog found" })
    return res.status(200).json({ success: true, data: blog })
  } catch (error) {
    return res.status(500).json({ success: false, message: error?.message })
  }
}

module.exports = {
    addBlog, getAllBlog, 
    deleteBlogbyId,
    togglePublish,
    subscribeForNewBlog,
    getBlogbyId, getBlogBySlug, getUserDrafts, saveDraftBlog,
    MoveToTrash, getRetriveFromTrash, getAuthorName, fetchFaqs
}