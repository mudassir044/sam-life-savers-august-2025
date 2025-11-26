const { list } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const debug = {
    hasToken: !!process.env.BLOB_READ_WRITE_TOKEN,
    localFile: null,
    blobFiles: [],
    errors: []
  };

  // Check local file
  try {
    const galleryPath = path.join(process.cwd(), 'gallery.json');
    if (fs.existsSync(galleryPath)) {
      const data = fs.readFileSync(galleryPath, 'utf8');
      debug.localFile = {
        exists: true,
        size: data.length,
        parsed: JSON.parse(data)
      };
    } else {
      debug.localFile = { exists: false };
    }
  } catch (e) {
    debug.localFile = { error: e.message };
  }

  // Check Blob storage
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { blobs } = await list({
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });
      debug.blobFiles = blobs.map(b => ({
        pathname: b.pathname,
        url: b.url,
        size: b.size
      }));
    } catch (e) {
      debug.errors.push('Blob list error: ' + e.message);
    }
  } else {
    debug.errors.push('No BLOB_READ_WRITE_TOKEN set');
  }

  return res.status(200).json(debug);
};

