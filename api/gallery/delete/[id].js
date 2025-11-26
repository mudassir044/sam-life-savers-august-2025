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
    const galleryData = fs.readFileSync(galleryPath, 'utf8');
    const gallery = JSON.parse(galleryData);

    const imageIndex = gallery.findIndex(img => img.id === parseInt(id));
    if (imageIndex === -1) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const image = gallery[imageIndex];
    const imagePath = path.join(process.cwd(), image.image);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    gallery.splice(imageIndex, 1);
    fs.writeFileSync(galleryPath, JSON.stringify(gallery, null, 2));

    return res.status(200).json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Delete error:', error);
    return res.status(500).json({ error: 'Delete failed' });
  }
};
