const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const galleryPath = path.join(process.cwd(), 'gallery.json');
    const galleryData = fs.readFileSync(galleryPath, 'utf8');
    const gallery = JSON.parse(galleryData);
    
    return res.status(200).json(gallery);
  } catch (error) {
    console.error('Error reading gallery:', error);
    return res.status(500).json({ error: 'Failed to load gallery' });
  }
};
