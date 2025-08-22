// utils/fileUtils.js
const fs = require('fs');
const path = require('path');

/**
 * Deletes a file if it's a local upload
 * @param {string} fileUrl - Path stored in DB (e.g., "/uploads/abc.png")
 */
function deleteIfLocalPath(fileUrl) {
  if (!fileUrl) return;

  // Only delete if path starts with /uploads/
  if (fileUrl.startsWith('/uploads/')) {
    const fullPath = path.join(process.cwd(), fileUrl);

    fs.unlink(fullPath, (err) => {
      if (err) {
        console.warn('Failed to delete file:', fullPath, err.message);
      } else {
        console.log('Deleted old file:', fullPath);
      }
    });
  }
}

module.exports = { deleteIfLocalPath };