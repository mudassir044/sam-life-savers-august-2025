# Admin Portal Setup Guide

## 🚀 Quick Start

### 1. Access the Admin Portal
Navigate to: `https://your-domain.vercel.app/admin/login.html`

**Default Credentials:**
- Username: `admin`
- Password: `samlife2025`

⚠️ **IMPORTANT:** Change the default password in production!

### 2. Setting Up Environment Variables (Recommended)

For better security, set environment variables in Vercel:

1. Go to your Vercel project settings
2. Navigate to "Environment Variables"
3. Add:
   - `ADMIN_USERNAME` = your desired username
   - `ADMIN_PASSWORD` = your secure password

### 3. Installing Dependencies

Before deploying, install the required package:

```bash
npm install
```

This will install `formidable` for handling file uploads.

### 4. Deploy to Vercel

```bash
vercel deploy
```

Or push to your connected Git repository.

## 📸 Using the Gallery Admin

### Uploading Images:
1. Login to `/admin/login.html`
2. Go to the dashboard
3. Click "Select Image" and choose your photo
4. Enter a title and description (optional)
5. Click "Upload Image"
6. The image will automatically appear in the gallery on your homepage!

### Deleting Images:
1. In the dashboard, find the image you want to delete
2. Click the "×" button in the top-right corner
3. Confirm deletion

## 🔒 Security Notes

- The current authentication is basic. For production, consider:
  - Using Vercel's authentication
  - Implementing JWT tokens with expiration
  - Adding rate limiting
  - Using environment variables for credentials

## 📁 File Structure

```
├── admin/
│   ├── login.html          # Admin login page
│   └── dashboard.html      # Gallery management dashboard
├── api/
│   ├── auth/
│   │   └── login.js        # Authentication endpoint
│   └── gallery/
│       ├── list.js         # Get all gallery images
│       ├── upload.js       # Upload new image
│       └── delete/[id].js  # Delete image
├── gallery.json            # Gallery data storage
└── js/
    └── gallery-loader.js   # Dynamic gallery loader
```

## 🛠️ Troubleshooting

### Images not uploading?
- Check that the `images/` folder exists and is writable
- Verify file size is under 10MB
- Check Vercel function logs

### Gallery not loading on homepage?
- Ensure `gallery.json` exists and is valid JSON
- Check browser console for errors
- Verify the API endpoint `/api/gallery/list` is accessible

### Can't login?
- Check environment variables are set correctly
- Verify the password matches what's in the code or env vars

## 📝 Notes

- Images are stored in the `images/` directory
- Gallery data is stored in `gallery.json`
- Maximum file size: 10MB per image
- Supported formats: All image formats (JPEG, PNG, GIF, etc.)

