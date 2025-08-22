// controllers/uploadController.js
const fs = require('fs');
const path = require('path');
const ImagekitConfig  = require('../config/ImagekitConfig');

const uploadEditorFile = async (req, res) => {
  console.log("Triggered")
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    console.log(req.file)

    // Upload to ImageKit or your CDN
    const fileBuffer = fs.readFileSync(req.file.path);
    const uploadResponse = await ImagekitConfig.upload({
      file: fileBuffer,
      fileName: `editor-${Date.now()}-${req.file.originalname}`,
      folder: '/editor-uploads'
    });
    console.log("Handled file buffer")

    const isImage = req.file.mimetype.startsWith('image/');
    const isVideo = req.file.mimetype.startsWith('video/');
    const isOther = !isImage && !isVideo;

    // Generate optimized URL
    const fileUrl = ImagekitConfig.url({
      path: uploadResponse.filePath,
      transformation: isImage ? [
        { quality: 'auto:low' },
        { format: 'webp' },
        { width: 1200 },
        { progressive: true }
      ] : []
    });
    console.log(fileUrl)
    console.log("Url generated")

    // Clean up temp file
    fs.unlinkSync(req.file.path);
    console.log("temp files cleared")

    // Return in Froala expected format
    res.json({
      link: fileUrl,
      preview: fileUrl,
      type: isImage ? 'image' : isVideo ? 'video' : 'file'
    });

  } catch (error) {
    console.error('Editor file upload failed:', error);
    if (req.file?.path && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'File processing failed',
      details: error.message  });
  }
};

module.exports = { uploadEditorFile };