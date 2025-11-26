const fs = require('fs');
const path = require('path');
const { list } = require('@vercel/blob');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let gallery = [];
    
    // Priority 1: Try to read from Vercel Blob first (most up-to-date)
    if (process.env.BLOB_READ_WRITE_TOKEN) {
      try {
        // List blobs to find gallery.json - try both exact name and with prefix
        const { blobs } = await list({
          prefix: '',
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        
        if (blobs && blobs.length > 0) {
          // Get the gallery.json blob - check both pathname and url
          const galleryBlob = blobs.find(b => 
            b.pathname === 'gallery.json' || 
            b.pathname.endsWith('/gallery.json') ||
            b.url.includes('gallery.json')
          );
          
          if (galleryBlob) {
            const response = await fetch(galleryBlob.url);
            if (response.ok) {
              const galleryData = await response.text();
              gallery = JSON.parse(galleryData);
              // If we got data from Blob, return it (it's the most up-to-date)
              if (gallery && Array.isArray(gallery)) {
                return res.status(200).json(gallery);
              }
            }
          }
        }
      } catch (blobError) {
        console.error('Error reading from Blob:', blobError);
        // Fall through to try local file
      }
    }
    
    // Priority 2: Fall back to local file if Blob doesn't have data
    try {
      const galleryPath = path.join(process.cwd(), 'gallery.json');
      const galleryData = fs.readFileSync(galleryPath, 'utf8');
      gallery = JSON.parse(galleryData);
      // Return local file data (might be older, but better than nothing)
      if (gallery && Array.isArray(gallery)) {
        return res.status(200).json(gallery);
      }
    } catch (localError) {
      // Local file doesn't exist or is invalid, return empty array
    }
    
    // Return empty array if nothing found
    return res.status(200).json([]);
  } catch (error) {
    console.error('Error reading gallery:', error);
    return res.status(500).json({ error: 'Failed to load gallery' });
  }
};
