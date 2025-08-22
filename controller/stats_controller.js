const prisma = require('../config/prismaConfig.js')

// Get total views by month
const getViewsPerMonth = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();

    const blogs = await prisma.blog.findMany({
      where: {
        createdAt: {
          gte: new Date(`${currentYear}-01-01T00:00:00Z`),
          lte: new Date(`${currentYear}-12-31T23:59:59Z`)
        }
      },
      select: {
        createdAt: true,
        views: true
      }
    });

    const monthlyViews = Array(12).fill(0);

    blogs.forEach(blog => {
      const month = new Date(blog.createdAt).getMonth(); // 0 = Jan
      monthlyViews[month] += blog.views;
    });

    const result = monthlyViews.map((views, index) => ({
      _id: index + 1,
      totalViews: views
    }));

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error('Error in getViewsPerMonth:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Pie chart: blogs per admin
const getAdminBlogStats = async (req, res) => {
  try {
    const stats = await prisma.admin.findMany({
      select: {
        id: true,
        userName: true,
        blogs: {
          where: {
            isPublished: true
          },
          select: {
            id: true
          }
        }
      }
    });

    const result = stats.map(admin => ({
      adminName: admin.userName || `Admin ${admin.id}`,
      totalBlogs: admin.blogs.length
    }));

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error('Error in getAdminBlogStats:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Vertical bar chart: yearly views per admin
const getAdminViewsPerYear = async (req, res) => {
  try {
    const adminId  = req.user?.id || req.user?._id
    const currentYear = new Date().getFullYear();

    const blogs = await prisma.blog.findMany({
      where: {
        adminId: adminId,
        isPublished: true,
        createdAt: {
          gte: new Date(`${currentYear}-01-01T00:00:00Z`),
          lte: new Date(`${currentYear}-12-31T23:59:59Z`)
        }
      },
      select: {
        views: true,
        createdAt: true
      }
    });

    const monthlyViews = Array(12).fill(0); // Jan to Dec

    blogs.forEach(blog => {
      const month = new Date(blog.createdAt).getMonth(); // 0–11
      monthlyViews[month] += blog.views;
    });

    const result = monthlyViews.map((views, index) => ({
      month: index + 1, // 1 = Jan
      totalViews: views
    }));

    res.status(200).json({ success: true, data: result });
  } catch (err) {
    console.error('Error in getAdminViewsPerYear:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

module.exports = {
  getViewsPerMonth,
  getAdminBlogStats,
  getAdminViewsPerYear: getAdminViewsPerYear
};