const { put } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');

function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  return true;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!verifyToken(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    let body;
    if (typeof req.body === 'string') {
      body = JSON.parse(req.body);
    } else {
      body = req.body || {};
    }

    const { imageUrl, title, description, fileData, filename, contentType } = body;

    let finalImageUrl = imageUrl;

    // If file data is provided, upload to Vercel Blob
    if (fileData && filename) {
      const timestamp = Date.now();
      const ext = filename.split('.').pop() || 'jpg';
      const blobFilename = `gallery/${timestamp}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      
      // Convert base64 to buffer
      let fileBuffer;
      if (fileData.startsWith('data:')) {
        const base64Data = fileData.split(',')[1];
        fileBuffer = Buffer.from(base64Data, 'base64');
      } else {
        fileBuffer = Buffer.from(fileData, 'base64');
      }

      // Upload to Vercel Blob with token from environment
      const blob = await put(blobFilename, fileBuffer, {
        access: 'public',
        contentType: contentType || 'image/jpeg',
        token: process.env.BLOB_READ_WRITE_TOKEN, // Use token from environment
      });

      finalImageUrl = blob.url;
    }

    if (!finalImageUrl) {
      return res.status(400).json({ error: 'Image URL or file data is required' });
    }

    // Read gallery.json
    const galleryPath = path.join(process.cwd(), 'gallery.json');
    let gallery = [];
    
    try {
      const galleryData = fs.readFileSync(galleryPath, 'utf8');
      gallery = JSON.parse(galleryData);
    } catch (e) {
      gallery = [];
    }

    // Add new image to gallery
    const newImage = {
      id: gallery.length > 0 ? Math.max(...gallery.map(img => img.id)) + 1 : 1,
      image: finalImageUrl, // Use finalImageUrl (the Vercel Blob URL)
      title: title || 'Untitled',
      description: description || '',
      width: 1920,
      height: 1080
    };

    gallery.push(newImage);

    const galleryJsonString = JSON.stringify(gallery, null, 2);

    // Always save to Blob if token is available (for Vercel production)
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        // Save gallery.json to Blob - this will overwrite any existing one
        const galleryBlob = await put('gallery.json', galleryJsonString, {
          access: 'public',
          contentType: 'application/json',
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        
        console.log('Saved gallery.json to Blob:', galleryBlob.url);
        
        // Also try to save locally if possible (for local dev)
        try {
          fs.writeFileSync(galleryPath, galleryJsonString);
        } catch (localError) {
          // Ignore local save errors on Vercel
        }
        
        return res.status(200).json({ 
          message: 'Image uploaded successfully! Gallery updated in Vercel Blob.',
          image: newImage,
          galleryUrl: galleryBlob.url,
          gallery: gallery // Return full gallery for immediate display
        });
      } catch (blobError) {
        console.error('Error saving to Blob:', blobError);
        // If Blob storage fails, try local save and return data
        try {
          fs.writeFileSync(galleryPath, galleryJsonString);
          return res.status(200).json({ 
            message: 'Image uploaded successfully (saved locally).',
            image: newImage,
            gallery: gallery
          });
        } catch (localError) {
          // Both failed - return data for manual update
          return res.status(200).json({ 
            message: 'Image uploaded to Vercel Blob, but gallery.json update failed. Please update manually.',
            image: newImage,
            updatedGallery: gallery,
            error: blobError.message
          });
        }
      }
    } else {
      // No Blob token - try local save only
      try {
        fs.writeFileSync(galleryPath, galleryJsonString);
        return res.status(200).json({ 
          message: 'Image uploaded successfully',
          image: newImage,
          gallery: gallery
        });
      } catch (localError) {
        return res.status(200).json({ 
          message: 'Image uploaded, but gallery.json could not be saved. Please set BLOB_READ_WRITE_TOKEN.',
          image: newImage,
          updatedGallery: gallery
        });
      }
    }
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Upload failed: ' + error.message });
  }
};
