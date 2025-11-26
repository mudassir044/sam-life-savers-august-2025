const fs = require('fs');
const path = require('path');
const { list, get } = require('@vercel/blob');

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
        // List all blobs to find gallery.json
        const { blobs } = await list({
          token: process.env.BLOB_READ_WRITE_TOKEN,
        });
        
        console.log('Found blobs:', blobs?.length || 0);
        
        if (blobs && blobs.length > 0) {
          // Find gallery.json - check various possible pathname formats
          const galleryBlob = blobs.find(b => {
            const pathname = b.pathname || '';
            return pathname === 'gallery.json' || 
                   pathname.endsWith('/gallery.json') ||
                   pathname.includes('gallery.json');
          });
          
          if (galleryBlob) {
            console.log('Found gallery.json in Blob:', galleryBlob.url);
            const response = await fetch(galleryBlob.url);
            if (response.ok) {
              const galleryData = await response.text();
              gallery = JSON.parse(galleryData);
              console.log('Loaded gallery from Blob:', gallery.length, 'images');
              // If we got data from Blob, return it (it's the most up-to-date)
              if (gallery && Array.isArray(gallery)) {
                return res.status(200).json(gallery);
              }
            } else {
              console.error('Failed to fetch gallery.json from Blob URL:', response.status);
            }
          } else {
            console.log('gallery.json not found in Blob. Available blobs:', blobs.map(b => b.pathname));
          }
        } else {
          console.log('No blobs found in storage');
        }
      } catch (blobError) {
        console.error('Error reading from Blob:', blobError.message);
        // Fall through to try local file
      }
    } else {
      console.log('BLOB_READ_WRITE_TOKEN not set');
    }
    
    // Priority 2: Fall back to local file if Blob doesn't have data
    try {
      const galleryPath = path.join(process.cwd(), 'gallery.json');
      if (fs.existsSync(galleryPath)) {
        const galleryData = fs.readFileSync(galleryPath, 'utf8');
        gallery = JSON.parse(galleryData);
        console.log('Loaded gallery from local file:', gallery.length, 'images');
        // Return local file data (might be older, but better than nothing)
        if (gallery && Array.isArray(gallery)) {
          return res.status(200).json(gallery);
        }
      } else {
        console.log('Local gallery.json does not exist');
      }
    } catch (localError) {
      console.error('Error reading local file:', localError.message);
      // Local file doesn't exist or is invalid, return empty array
    }
    
    // Return empty array if nothing found
    console.log('Returning empty gallery');
    return res.status(200).json([]);
  } catch (error) {
    console.error('Error reading gallery:', error);
    return res.status(500).json({ error: 'Failed to load gallery: ' + error.message });
  }
};
