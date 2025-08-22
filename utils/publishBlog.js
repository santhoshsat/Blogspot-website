// utils/publishBlog.js
const cron = require('node-cron');
const prisma = require('../config/prismaConfig.js')


const publishScheduledBlogs = async () => {
  try {
    const now = new Date();

    const blogsToPublish = await prisma.blog.findMany({
      where: {
        isScheduled: true,
        isPublished: false,
        scheduledTime: {
          lte: now,
        },
      },
    });

    for (const blog of blogsToPublish) {
      await prisma.blog.update({
        where: { id: blog.id },
        data: {
          isPublished: true,
          isScheduled: false,
        },
      });

      console.log(`✅ Blog published: ${blog.title}`);
    }

    if (blogsToPublish.length === 0) {
      console.log('⏳ No blogs to publish at this time.');
    }
  } catch (err) {
    console.error('❌ Error in scheduled blog publishing:', err.message);
  }
};

const startPublishBlogCron = () => {
  cron.schedule('* * * * *', publishScheduledBlogs);
  console.log('🕒 Scheduled blog publishing cron started (every minute)');
};

module.exports = { startPublishBlogCron, publishScheduledBlogs };