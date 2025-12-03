# Google reCAPTCHA Setup

## Configuration

The website uses Google reCAPTCHA v3 (invisible) to protect forms from spam.

### Keys Used:
- **Site Key:** `6LdOXRksAAAAAKVO-YgTTGBhYbbj0CZwDU7TK_OA`
- **Secret Key:** `6LdOXRksAAAAAFz2ntOoUGbilNTAOHe_dl3u5Roy`

### Environment Variable (Optional)

For added security, you can set the secret key as an environment variable in Vercel:

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Add:
   - **Name:** `RECAPTCHA_SECRET_KEY`
   - **Value:** `6LdOXRksAAAAAFz2ntOoUGbilNTAOHe_dl3u5Roy`
   - **Environment:** All (Production, Preview, Development)

If not set, the code will use the default secret key.

## How It Works

1. **Client-side (recaptcha-loader.js):**
   - Loads Google reCAPTCHA v3 script
   - Gets a token when form is submitted
   - Sends token with form data

2. **Server-side (api/forms/submit.js):**
   - Verifies the reCAPTCHA token with Google
   - Only processes form if verification succeeds
   - Blocks spam submissions

## Forms Protected

All forms on these pages are protected:
- Contact.html
- Volunteer-Form.html
- Hope-In-Action.html
- index.html (if forms exist)

## Testing

To test reCAPTCHA:
1. Submit a form normally - it should work
2. If reCAPTCHA fails, you'll see an error message
3. Check browser console for any reCAPTCHA errors

## Troubleshooting

**Error: "reCAPTCHA not loaded"**
- Check internet connection
- Verify the site key is correct
- Check browser console for script loading errors

**Error: "reCAPTCHA verification failed"**
- Verify the secret key is correct
- Check that the domain is registered in Google reCAPTCHA console
- Ensure environment variable is set correctly (if using)

**Forms not submitting:**
- Check browser console for errors
- Verify reCAPTCHA script is loading (check Network tab)
- Make sure both recaptcha-loader.js and form-handler.js are loaded

