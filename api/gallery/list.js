const fs = require('fs');
const path = require('path');
const { list } = require('@vercel/blob');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Try to read from local file first
    const galleryPath = path.join(process.cwd(), 'gallery.json');
    let gallery = [];
    
    try {
      const galleryData = fs.readFileSync(galleryPath, 'utf8');
      gallery = JSON.parse(galleryData);
      // If we have data from local file, return it
      if (gallery && gallery.length > 0) {
        return res.status(200).json(gallery);
      }
    } catch (localError) {
      // Local file doesn't exist or is empty, continue to try Blob
    }
    
    // If local file is empty or doesn't exist, try to read from Vercel Blob
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        // List blobs to find gallery.json
        const { blobs } = await list({
          prefix: 'gallery.json',
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        
        if (blobs && blobs.length > 0) {
          // Get the gallery.json blob
          const galleryBlob = blobs.find(b => b.pathname === 'gallery.json');
          if (galleryBlob) {
            const response = await fetch(galleryBlob.url);
            const galleryData = await response.text();
            gallery = JSON.parse(galleryData);
            return res.status(200).json(gallery);
          }
        }
      } catch (blobError) {
        console.error('Error reading from Blob:', blobError);
        // Fall through to return empty array
      }
    }
    
    // Return empty array if nothing found
    return res.status(200).json([]);
  } catch (error) {
    console.error('Error reading gallery:', error);
    return res.status(500).json({ error: 'Failed to load gallery' });
  }
};
