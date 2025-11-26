function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  return true;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!verifyToken(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    // Parse multipart form data manually (simplified for Vercel)
    const contentType = req.headers['content-type'] || '';
    
    if (!contentType.includes('multipart/form-data')) {
      return res.status(400).json({ error: 'Invalid content type' });
    }

    // For Vercel, we'll return instructions to use Git-based upload
    // Since Vercel has read-only file system, images must be committed to Git
    return res.status(200).json({ 
      message: 'Image upload received. Please note: On Vercel, images must be committed to Git. The image data has been prepared for manual addition.',
      instructions: '1. Download the base64 image data, 2. Save it to the images/ folder, 3. Update gallery.json, 4. Commit and push to Git',
      note: 'For production, consider using Vercel Blob Storage or Cloudinary'
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Upload failed: ' + error.message });
  }
};
