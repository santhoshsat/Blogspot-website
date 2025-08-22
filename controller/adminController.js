const jwt = require('jsonwebtoken')
const fs = require('fs')
const bcrypt = require('bcrypt')
const ImagekitConfig = require('../config/ImagekitConfig.js')
const prisma = require('../config/prismaConfig.js')

const adminLogin = async (req, res) => {
    try {
        const { email, password, role } = req.body;

        const user = role==='Admin' ? await prisma.admin.findUnique({ where: { userEmail: email } }) : await prisma.superAdmin.findUnique({ where: { email: email } });

        if (!user) {
            return res.status(401).json({ success: false, message: 'Unauthorized: Invalid credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Unauthorized: Invalid credentials' });
        }

        const token = jwt.sign({email: user.userEmail, role: user?.role, _id:user?.id,
             userImg: user?.profilePic, name: user?.userName, phone: user?.phoneNumber, location: user?.address }, process.env.JWT_SECRET, { expiresIn: '1d' })
        return res.status(200).json({ success: true, token, user: user.email || user.userEmail, role: user?.role, message: `Welcome ${role}`, userId: user._id, data: user })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

const updateProfile = async (req, res) => {
  try {
    const adminId = req.user?._id || req.user?.id; // from authMiddleware
    const { userName, phoneNumber, address } = req.body;

    console.log("Uploaded File:", req.file);
    console.log("Form Data:", req.body);

    // Get current admin data
    const existingAdmin = await prisma.admin.findUnique({
      where: { id: Number(adminId) },
    });

    if (!existingAdmin) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    let image = existingAdmin.profilePic; // keep old image by default

    // If a new image file is uploaded
    if (req.file) {
      const profilePicUrl = req.file.path;
      console.log("Profile url was", profilePicUrl);

      const fileBuffer = fs.readFileSync(profilePicUrl);

      const responsefromImagekit = await ImagekitConfig.upload({
        file: fileBuffer,
        fileName: req.file.originalname,
        folder: "/Updatedprofile",
      });

      const optimizedImageUrl = ImagekitConfig.url({
        path: responsefromImagekit.filePath,
        transformation: [
          { quality: "auto:low" },
          { format: "webp" },
          { width: 1280 },
          { progressive: true },
        ],
      });

      image = optimizedImageUrl; // overwrite with new one
    }

    // Update in database
    const updatedAdmin = await prisma.admin.update({
      where: { id: Number(adminId) },
      data: {
        userName,
        phoneNumber,
        address,
        profilePic: image, // keep old if no new upload
      },
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedAdmin,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({
      success: false,
      message: error?.message || "Something went wrong",
    });
  }
};

const getAllBlogsAdmin = async (req, res) => {
    try {
        const adminId = req.user._id || req.user.id
        const blogs = await prisma.blog.findMany({ where: { adminId: adminId, isTrash: false, isDraft: false }, orderBy: { createdAt: 'desc' } })
        return res.status(200).json({
            success: true,
            message: 'Admin Blogs retrieved',
            data: blogs
        })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

const getAllComments = async (req, res) => {
    try {
        const adminId = req.user?._id || req.user?.id;

        const comments = await prisma.comment.findMany({
            where: {
                blog: {
                    adminId: adminId
                }
            },
            include: {
                blog: {
                    select: {
                        id: true,
                        title: true,
                        slug: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

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

const getDashboard = async (req, res) => {
    try {
        const adminId = req.user?._id || req.user?.id; // supports both cases
        
        const recentBlogs = await prisma.blog.findMany({
            where: { isTrash: false, isDraft: false, isPublished: true },
            orderBy: { createdAt: 'desc' },
            take: 5,
        });
        const blogs = await prisma.blog.count({ where: { adminId: Number(adminId), isTrash: false, isDraft: false, isPublished: true } });
        const comments = await prisma.comment.count({ where: { isApproved: true } });
        const drafts = await prisma.blog.count({ where: { adminId: Number(adminId), isDraft: true, isTrash: false } });

        const dashboardData = {
            blogs, comments, drafts, recentBlogs
        }
        return res.status(200).json({ success: true, data: dashboardData })
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

const deleteCommentsById = async (req, res) => {
    try {
        const { id } = req.params;

        const delData = await prisma.comment.delete({ where: { id: Number(id) } })
        
        return res.status(200).json({ success: true, message: 'Comment deleted successfully' })

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

const approveCommentsById = async (req, res) => {
    try {
        const { id } = req.params;

        const approveCmtData = await prisma.comment.update({
            where: { id: Number(id) },
            data: { isApproved: true },
        });
        
        return res.status(200).json({ success: true, message: 'Comment approved successfully' })

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

const verifySluglify = async (req, res) => {
  try {
    const { slug } = req.body;
    if (!slug) return res.status(400).json({ success: false, message: "Slug is required" });

    const existing = await prisma.blog.findUnique({
      where: { slug }
    });

    if (existing) {
      return res.status(200).json({ success: false, message: 'Slug already exists' });
    }

    return res.status(200).json({ success: true, message: 'Slug is available and ready to use.' });

  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};


module.exports = {
    adminLogin, getAllBlogsAdmin, 
    getAllComments, getDashboard,
    deleteCommentsById, approveCommentsById,
    updateProfile, verifySluglify
}