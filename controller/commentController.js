const prisma = require('../config/prismaConfig.js')

const addComment = async (req, res) => {
    try {
        const { blog, name, content } = req.body;

        const newComment = await prisma.comment.create({ 
            data: { 
                name, content,
                blog: { connect: { id: parseInt(blog) } }
            }
        })

        if(!newComment)  return res.status(500).json({ success: false, message: 'Failed to save data to the database'  })
        
        return res.status(201).json({
            success: true,
            message: 'Data saved to database successfully',
        })

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message })
    }
}

const getBlogComments = async (req, res) => {
  try {
    const { blogId } = req.params;

    const comments = await prisma.comment.findMany({
      where: {
        blogId: parseInt(blogId),
        isApproved: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return res.status(200).json({
      success: true,
      message: 'Comments retrieved successfully',
      data: comments,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
    addComment, getBlogComments
}