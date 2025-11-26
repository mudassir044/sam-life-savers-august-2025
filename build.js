const fs = require('fs');
const path = require('path');

// Create public directory
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Copy all files and directories to public
function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
    fs.readdirSync(src).forEach(childItemName => {
      // Skip node_modules, .git, and public itself
      if (childItemName === 'node_modules' || childItemName === '.git' || childItemName === 'public') {
        return;
      }
      copyRecursiveSync(
        path.join(src, childItemName),
        path.join(dest, childItemName)
      );
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

// Copy everything except build.js, package.json, vercel.json, node_modules, .git, and api
// Note: API routes are handled separately by Vercel and don't need to be in public
const rootFiles = fs.readdirSync(__dirname);
rootFiles.forEach(item => {
  const srcPath = path.join(__dirname, item);
  const destPath = path.join(publicDir, item);
  
  // Skip certain files/directories
  if (item === 'node_modules' || item === '.git' || item === 'public' || 
      item === 'build.js' || item === 'package.json' || item === 'vercel.json' ||
      item === 'api') {
    return;
  }
  
  const stats = fs.statSync(srcPath);
  if (stats.isDirectory()) {
    copyRecursiveSync(srcPath, destPath);
  } else {
    fs.copyFileSync(srcPath, destPath);
  }
});

console.log('Build complete! Files copied to public directory.');

