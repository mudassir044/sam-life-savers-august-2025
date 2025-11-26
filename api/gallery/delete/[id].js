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
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!verifyToken(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const { id } = req.query;
    const galleryPath = path.join(process.cwd(), 'gallery.json');
    
    // Read gallery.json (read-only is allowed)
    const galleryData = fs.readFileSync(galleryPath, 'utf8');
    const gallery = JSON.parse(galleryData);

    const imageIndex = gallery.findIndex(img => img.id === parseInt(id));
    if (imageIndex === -1) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const image = gallery[imageIndex];
    
    // Note: File deletion won't work on Vercel (read-only filesystem)
    // Return the image info so it can be removed from Git
    gallery.splice(imageIndex, 1);
    
    // Note: This write will fail on Vercel, but we return the updated data
    try {
      fs.writeFileSync(galleryPath, JSON.stringify(gallery, null, 2));
    } catch (writeError) {
      // Expected on Vercel - return the updated gallery data
      return res.status(200).json({ 
        message: 'Image marked for deletion. Please update gallery.json in Git.',
        updatedGallery: gallery,
        deletedImage: image
      });
    }

    return res.status(200).json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({ error: 'Delete failed: ' + error.message });
  }
};
