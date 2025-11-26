const { generateSignedUrl } = require('@vercel/blob');

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

    const { filename, contentType } = body;

    if (!filename) {
      return res.status(400).json({ error: 'Filename is required' });
    }

    // Generate a unique filename
    const timestamp = Date.now();
    const ext = filename.split('.').pop() || 'jpg';
    const blobFilename = `gallery/${timestamp}-${filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

    // Generate signed URL for client-side upload
    // Note: This requires BLOB_READ_WRITE_TOKEN, but we'll use a simpler approach
    // Instead, we'll use the client-side @vercel/blob SDK directly
    
    // For now, return instructions to use client-side upload
    return res.status(200).json({ 
      message: 'Use client-side Vercel Blob upload',
      filename: blobFilename,
      note: 'Client will upload directly using @vercel/blob SDK'
    });
  } catch (error) {
    console.error('Get upload URL error:', error);
    return res.status(500).json({ error: error.message });
  }
};
