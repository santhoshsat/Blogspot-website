const bcrypt = require('bcrypt')
const fs = require('fs')
const ImagekitConfig = require('../config/ImagekitConfig.js')

const prisma = require('../config/prismaConfig.js')

const getBlogsById = async (req, res) => {
    try {
        const { adminId } = req.params;

        // chk the admin exists?
        const existingAdmin = await prisma.admin.findUnique({ where: { id: Number(adminId) } });
        if(!existingAdmin) return res.status(404).json({ success: false, message: 'Admin not found' })

        const blogs = await prisma.blog.findMany({
            where: { adminId: Number(adminId) },
            include: { admin: { select: { userEmail: true } } },
        });
        if(blogs.length==0) return res.status(200).json({ success: true, message: 'No blogs posted' })

        return res.status(200).json({ success: true, message: 'Blogs retrieved successfully', data: blogs })

    } catch (error) {
        return res.status(500).json({ success: false, message: error || error?.message || 'Failed to fetch their data' })
    }
}

const getDashboard = async (req, res) => {
    try {
        const recentBlogs = await prisma.blog.findMany({  where: { isPublished: true, isDraft: false, isTrash: false } ,orderBy: { createdAt: 'desc' }, take: 5 });
        const blogs = await prisma.blog.count({ where: { isPublished: true, isDraft: false, isTrash: false } });
        const comments = await prisma.comment.count({ where: { isApproved: true } });
        const unApprovedComments = await prisma.comment.count({ where: { isApproved: false } });
        const drafts = await prisma.blog.count({ where: { isPublished: false } });

        const dashboardData = {
            blogs, comments, drafts, recentBlogs, unApprovedComments
        }

        return res.status(200).json({ success: true, data: dashboardData })

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

const createAdmin = async (req, res) => {
    try {
        const { name, email, password, address, phone } = JSON.parse(req.body.AdminData) || req.body;
        const imageFile = req.file;

        if(!email || !password) return res.status(300).json({ success: false, message: 'Email or password field is missing, please fill it out' })
        // chk exiting user
        const exitingUsr = await prisma.admin.findUnique({ where: { userEmail: email } })
        if(exitingUsr) return res.status(200).json({ success: false, message: 'user already present' })
        // hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const fileBuffer = fs.readFileSync(imageFile.path)
        // upload Image to imagekit
        const responsefromImagekit = await ImagekitConfig.upload({
            file: fileBuffer,
            fileName: imageFile.originalname,
            folder: '/adminProfile'
        })

        // optimize Image via imagekit
        const optimizedImageUrl = ImagekitConfig.url({
            path: responsefromImagekit.filePath,
            transformation: [
                { quality: 'auto:low' },       // compresses more than 'auto'
                { format: 'webp' },            // highly compressed modern format
                { width: 1280 },               // limit width
                { progressive: true }          // for JPEG (makes large images load gradually)
            ]
        })
        const image = optimizedImageUrl;

        // create a new user
        await prisma.admin.create({ data: { userEmail: email, password: hashedPassword, userName: name, 
            address: address, phoneNumber: phone, profilePic: image } })
        return res.status(200).json({ success: true, message: 'new admin created successfully' })
    } catch (error) {
        return res.status(500).json({ success: false, message: error || error?.message || 'something went wrong' })
    }
}

const createSuperAdmin = async (req, res) => {
    try {
        const { email, password, SuperadminName } = req.body;
        if(!email || !password) return res.status(300).json({ success: false, message: 'Email or password field is missing, please fill it out' })
        
        // chk exiting user
        const exitingUsr = await prisma.superAdmin.findUnique({ where: { email: email } })
        if(exitingUsr) return res.status(200).json({ success: false, message: 'user already present' })

        // hash the password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // create a new user
        const user = await prisma.superAdmin.create({ data: { email: email, password: hashedPassword, userName: SuperadminName } })
        return res.status(200).json({ success: true, message: 'new Super admin created successfully' })
        
    } catch (error) {
        return res.status(500).json({ success: false, message: error || error?.message || 'something went wrong' })
    }
}

const deleteAdminById = async (req, res) => {
  try {
    const { adminId } = req.params;

    if (!adminId) {
      return res.status(400).json({ success: false, message: 'Admin Id is not present' });
    }

    const numericAdminId = Number(adminId);

    const existingAdmin = await prisma.admin.findUnique({ where: { id: numericAdminId } });

    if (!existingAdmin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    await prisma.admin.delete({ where: { id: numericAdminId } });

    await prisma.blog.deleteMany({ where: { adminId: numericAdminId } });

    return res.status(200).json({ success: true, message: `Successfully deleted admin ${existingAdmin.userName}` });

  } catch (error) {
    const handleError = error.message && error.message.includes('Foreign key constraint');
    return res.status(500).json({ success: false, message: handleError ? 'first delete the related blogs, then delete the admin' :'Failed to delete admin' });
  }
}

const getAllAdminProfiles = async (req, res) => {
    try {
        const getAdmins = await prisma.admin.findMany();

        if(getAdmins.length == 0) return res.status(200).json({ success: true, message: 'No admin present' })
        
        return res.status(200).json({ success: true, message: 'Data retrieved successfully', data: getAdmins })
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Something went wrong while retrieving Admin data from db' })
    }
}

const TransferBlogOwnership = async (req, res) => {
    try {
        const { fromAdminEmail, toAdminEmail, blogId } = req.body
        
        if(!fromAdminEmail || !toAdminEmail) return res.status(400).json({ success: false, message: 'Both fromAdminId and toAdminId are required.' })
        
        // chk both admin's id
        const fromAdmin = await prisma.admin.findUnique({ where: { userEmail: fromAdminEmail } });
        const toAdmin = await prisma.admin.findUnique({ where: { userEmail: toAdminEmail } });

        if (!fromAdmin || !toAdmin) {
            return res.status(404).json({ message: 'One or both admins not found.' });
        }

        const blog = await prisma.blog.findUnique({ where: { id: Number(blogId) } });

        if (!blog) {
            return res.status(404).json({ message: 'Blog not found.' });
        }

        // Ensure the blog actually belongs to the fromAdmin
        if (!blog || blog.adminId !== fromAdmin.id) {
            return res.status(403).json({ message: 'This blog does not belong to the specified fromAdmin.' });
        }

        // Transfer ownership to the new admin
        await prisma.blog.update({
            where: { id: Number(blogId) },
            data: { adminId: toAdmin.id },
        });

        return res.status(200).json({
            success: true,
            message: 'Blog successfully transferred to another admin.',
        });

    } catch (error) {
        return res.status(500).json({ success: false, message: 'Error while transfering Data' })
    }
}

const resetSuperAdminPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) return res.status(400).json({ success: false, message: 'Email and new password required' });

    const superAdmin = await prisma.superAdmin.findUnique({ where: { email } });
    if (!superAdmin) return res.status(404).json({ success: false, message: 'Super Admin not found' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.superAdmin.update({
      where: { email },
      data: { password: hashedPassword },
    });

    return res.status(200).json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

const getAllSComments = async (req, res) => {
    try {
        const comments = await prisma.comment.findMany({ where: { isApproved: false } });
        console.log(comments)
        if(!comments) return res.status(404).json({ success: false, message: 'No comments' })

        return res.status(200).json({
            success: true,
            message: 'Comments retrieved successfully',
            data: comments
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    getBlogsById, createAdmin,
    deleteAdminById,
    getAllAdminProfiles, TransferBlogOwnership,
    createSuperAdmin, getDashboard, resetPassword: resetSuperAdminPassword, getAllSComments
}