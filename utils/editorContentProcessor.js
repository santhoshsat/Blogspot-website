// utils/editorContentProcessor.js
const { parse } = require('node-html-parser');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const tmp = require('tmp-promise');
const ImagekitConfig  = require('../config/ImagekitConfig')

async function processEditorContent(html) {
    if (!html || !html.includes('blob:')) {
        return html;
    }

    const root = parse(html);
    const imgTags = root.querySelectorAll('img[src^="blob:"]');

    for (const img of imgTags) {
        try {
            const blobUrl = img.getAttribute('src');
            const imageUrl = await uploadImageFromBlob(blobUrl);
            img.setAttribute('src', imageUrl);
        } catch (error) {
            console.error('Failed to process blob image:', error);
            // Remove the problematic image
            img.remove();
        }
    }

    return root.toString();
}

async function uploadImageFromBlob(blobUrl) {
    try {
        // Fetch the blob data
        const response = await axios.get(blobUrl, {
            responseType: 'arraybuffer',
            headers: {
                'Origin': new URL(blobUrl).origin // Some servers require Origin header
            }
        });

        // Get content type and extension
        const contentType = response.headers['content-type'];
        const extension = contentType.split('/')[1] || 'png';

        // Create a temporary file
        const { path: tempFilePath, cleanup } = await tmp.file({
            postfix: `.${extension}`,
            discardDescriptor: true
        });

        try {
            fs.writeFileSync(tempFilePath, response.data);

            // Upload to ImageKit
            const fileBuffer = fs.readFileSync(tempFilePath);
            const uploadResponse = await ImagekitConfig.upload({
                file: fileBuffer,
                fileName: `editor-img-${Date.now()}.${extension}`,
                folder: '/editor-images'
            });

            // Generate optimized URL
            const imageUrl = ImagekitConfig.url({
                path: uploadResponse.filePath,
                transformation: [
                    { quality: 'auto:good' },
                    { format: 'webp' },
                    { width: 1200 },
                    { progressive: true }
                ]
            });

            return imageUrl;
        } finally {
            await cleanup(); // Remove temp file
        }
    } catch (error) {
        console.error('Error uploading blob image:', error);
        throw new Error('Failed to upload editor image');
    }
}

module.exports = { processEditorContent };