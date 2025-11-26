const fs = require('fs');
const path = require('path');
const formidable = require('formidable');

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
    const form = formidable({
      uploadDir: path.join(process.cwd(), 'images'),
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024,
    });

    const [fields, files] = await form.parse(req);
    
    const imageFile = files.image?.[0];
    if (!imageFile) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const timestamp = Date.now();
    const originalName = imageFile.originalFilename || 'image';
    const ext = path.extname(originalName);
    const newFilename = `gallery-${timestamp}${ext}`;
    const newPath = path.join(process.cwd(), 'images', newFilename);

    fs.renameSync(imageFile.filepath, newPath);

    const galleryPath = path.join(process.cwd(), 'gallery.json');
    const galleryData = fs.readFileSync(galleryPath, 'utf8');
    const gallery = JSON.parse(galleryData);

    const imageUrl = `images/${newFilename}`;
    const title = fields.title?.[0] || 'Untitled';
    const description = fields.description?.[0] || '';

    const newImage = {
      id: gallery.length > 0 ? Math.max(...gallery.map(img => img.id)) + 1 : 1,
      image: imageUrl,
      title: title,
      description: description,
      width: 1920,
      height: 1080
    };

    gallery.push(newImage);
    fs.writeFileSync(galleryPath, JSON.stringify(gallery, null, 2));

    return res.status(200).json({ 
      message: 'Image uploaded successfully',
      image: newImage
    });
  } catch (error) {
    console.error('Upload error:', error);
    return res.status(500).json({ error: 'Upload failed' });
  }
};
