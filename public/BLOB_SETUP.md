# Vercel Blob Storage Setup

## Quick Setup Guide

To enable image uploads to Vercel Blob Storage, you need to configure the `BLOB_READ_WRITE_TOKEN` environment variable.

### Step 1: Get Your Blob Token

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to your project
3. Go to **Settings** → **Storage** → **Blob**
4. If you don't have a Blob store yet:
   - Click "Create Blob Store"
   - Give it a name (e.g., "sam-life-savers-gallery")
   - Click "Create"
5. Copy the **Read-Write Token** (starts with `vercel_blob_rw_...`)

### Step 2: Add Environment Variable

1. In your Vercel project, go to **Settings** → **Environment Variables**
2. Click **Add New**
3. Add:
   - **Name:** `BLOB_READ_WRITE_TOKEN`
   - **Value:** Paste your token (the one starting with `vercel_blob_rw_...`)
   - **Environment:** Select all (Production, Preview, Development)
4. Click **Save**

### Step 3: Redeploy

After adding the environment variable, you need to redeploy:

1. Go to **Deployments** tab
2. Click the three dots (⋯) on the latest deployment
3. Click **Redeploy**

Or simply push a new commit to trigger a new deployment.

### Alternative: Use Without Blob Storage

If you prefer not to use Vercel Blob Storage, you can:

1. Upload images manually to your repository's `images/` folder
2. Update `gallery.json` manually with the image paths
3. Commit and push the changes

The gallery will still work, but you'll need to update it via Git instead of the admin dashboard.

## Troubleshooting

**Error: "No token found"**
- Make sure `BLOB_READ_WRITE_TOKEN` is set in Vercel environment variables
- Make sure you redeployed after adding the variable
- Check that the token is correct (starts with `vercel_blob_rw_`)

**Error: "Unauthorized"**
- Check that your admin login credentials are correct
- Default username: `admin`
- Default password: `samlife2025`
- You can change these by setting `ADMIN_USERNAME` and `ADMIN_PASSWORD` environment variables

