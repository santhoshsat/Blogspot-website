const cron = require('node-cron');
const prisma = require('../config/prismaConfig');
const transporter = require('../config/nodemailConfig.js');
const generateDraftReminderEmail = require('./emailTemplates.js');

// Core logic (used by both cron and route)
const handleRemindDrafts = async () => {
  try {
    const now = new Date();

    // Get all draft blogs
    const drafts = await prisma.blog.findMany({
      where: {
        isDraft: true,
        isPublished: false
      },
      include: {
        admin: true
      }
    });

    // Filter drafts older than 4 days
    const oldDrafts = drafts.filter((draft) => {
      const createdAt = new Date(draft.createdAt);
      const diffInDays = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
      return diffInDays > 4;
    });

    // Group drafts by admin
    const summaryData = oldDrafts.reduce((acc, draft) => {
      const adminId = draft.adminId;
      const existing = acc.find((item) => item.adminId === adminId);
      const draftInfo = { title: draft.title };

      if (existing) {
        existing.drafts.push(draftInfo);
      } else {
        acc.push({
          adminId,
          adminName: draft.admin.userName,
          drafts: [draftInfo]
        });
      }

      return acc;
    }, []);

    // If there are old drafts, send email to SuperAdmin
    if (summaryData.length > 0) {
      const html = generateDraftReminderEmail({ summaryData });

      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: 'jaijayathilak@gmail.com', // replace with actual superadmin email
        subject: '🚨 Pending Blog Drafts Summary',
        html
      });

      console.log('Draft reminder email sent to SuperAdmin.');
      return { success: true, message: 'Reminder emails sent to superadmin.' };
    } else {
      console.log('No pending drafts older than 4 days.');
      return { success: false, message: 'Reminder emails was unable to send to superadmin.' };
    }
  } catch (error) {
    console.error('Error sending draft reminder email:', error.message);
  }
};

// Delete trash older than 7 days
const deleteOldTrash = async () => {
  try {
   const expiryDate = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);

    const result = await prisma.blog.deleteMany({
      where: {
        isTrashed: true,
        trashedAt: { lte: expiryDate }
      }
    });

    console.log(`🗑️ Deleted ${result.count} blogs from trash older than 7 days`);
  } catch (err) {
    console.error('Error deleting old trash:', err);
  }
};

// Express route handler (optional)
const remindDrafts = async (req, res) => {
  await handleRemindDrafts();
};

// Cron job setup
const startDraftReminderCron = () => {
  // Runs daily at 10:00 AM
  cron.schedule('0 10 * * *', remindDrafts);
  console.log('📅 Draft reminder cron scheduled for 10:00 AM daily');

  // Runs daily at midnight for trash cleanup
    cron.schedule('0 0 * * *', deleteOldTrash);
    console.log('📅 Trash auto-delete cron scheduled for midnight daily');
};

module.exports = { startDraftReminderCron };