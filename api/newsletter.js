const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
  .split(',')
  .map((email) => email.trim())
  .filter(Boolean);

function parseBody(req) {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch (error) {
      return {};
    }
  }
  return req.body || {};
}

function stringifyValue(value) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function normalizeFields(body) {
  const normalized = {};
  Object.entries(body || {}).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      normalized[key] = value.map((v) => stringifyValue(v));
    } else {
      normalized[key] = stringifyValue(value);
    }
  });
  return normalized;
}

function validateLengths(fields) {
  let totalLength = 0;
  for (const value of Object.values(fields)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item.length > 5000) {
          return 'Each field must be at most 5000 characters.';
        }
        totalLength += item.length;
      }
    } else {
      if (value.length > 5000) {
        return 'Each field must be at most 5000 characters.';
      }
      totalLength += value.length;
    }
  }
  if (totalLength > 20000) {
    return 'Combined input is too long (max 20000 characters).';
  }
  return null;
}

function findEmail(fields) {
  const emailRegex = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
  for (const [key, value] of Object.entries(fields)) {
    if (key.toLowerCase().includes('email')) {
      if (Array.isArray(value)) {
        const found = value.find((item) => emailRegex.test(item));
        if (found) return found;
      } else if (emailRegex.test(value)) {
        return value;
      }
    }
  }
  for (const value of Object.values(fields)) {
    if (Array.isArray(value)) {
      const found = value.find((item) => emailRegex.test(item));
      if (found) return found;
    } else if (emailRegex.test(value)) {
      return value;
    }
  }
  return null;
}

function formatAdminBody(fields) {
  return Object.entries(fields)
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
    .join('\n');
}

async function sendAdminEmail(subject, fields, replyTo) {
  if (!ADMIN_EMAILS.length) return;
  await resend.emails.send({
    from: 'SAM Life Savers <hello@join.samlifesavers.org>',
    to: ADMIN_EMAILS,
    subject,
    text: formatAdminBody(fields),
    reply_to: replyTo || undefined,
  });
}

async function sendAutoReply(to) {
  const templateId = process.env.TEMPLATE_NEWSLETTER;
  if (!templateId) {
    console.error('[AUTO-REPLY FAILED] TEMPLATE_NEWSLETTER environment variable is not set');
    throw new Error('TEMPLATE_NEWSLETTER environment variable is missing. Please set it in Vercel dashboard.');
  }
  try {
    console.log('[AUTO-REPLY ATTEMPT] Sending newsletter auto-reply');
    console.log(`[AUTO-REPLY ATTEMPT] Template ID: ${templateId}`);
    console.log(`[AUTO-REPLY ATTEMPT] To: ${to}`);
    
    // Try template object format (Resend v3 format)
    let result;
    try {
      result = await resend.emails.send({
        from: 'SAM Life Savers <newsletter@join.samlifesavers.org>',
        to,
        template: {
          id: templateId,
          variables: {} // Empty object if template has no variables
        }
      });
    } catch (templateObjError) {
      // Fallback: try template_id format (older format)
      console.log(`[AUTO-REPLY] Template object format failed, trying template_id format...`);
      result = await resend.emails.send({
        from: 'SAM Life Savers <newsletter@join.samlifesavers.org>',
        to,
        template_id: templateId,
      });
    }
    console.log('[AUTO-REPLY SUCCESS] Newsletter auto-reply sent:', result);
    return result;
  } catch (error) {
    console.error('[AUTO-REPLY FAILED] Resend API error for newsletter');
    console.error(`[AUTO-REPLY FAILED] Template ID used: ${templateId}`);
    console.error('[AUTO-REPLY FAILED] Error object:', error);
    console.error('[AUTO-REPLY FAILED] Error details:', JSON.stringify(error, null, 2));
    
    // Check if it's a Resend API error with response details
    if (error.response) {
      console.error('[AUTO-REPLY FAILED] Resend API response:', JSON.stringify(error.response, null, 2));
    }
    
    // Re-throw with more context
    throw new Error(`Failed to send auto-reply email: ${error.message || 'Template may be empty or not published in Resend. Please check your Resend templates.'}`);
  }
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const body = parseBody(req);
  if (body.company && String(body.company).trim() !== '') {
    return res.status(200).json({ ok: true });
  }

  const fields = normalizeFields(body);
  const validationError = validateLengths(fields);
  if (validationError) {
    return res.status(400).json({ ok: false, error: validationError });
  }

  const submitterEmail = findEmail(fields);
  if (!submitterEmail) {
    return res.status(400).json({ ok: false, error: 'A valid email is required.' });
  }

  const subject = `New Newsletter Signup - ${submitterEmail}`;

  try {
    await sendAdminEmail(subject, fields, submitterEmail);
    await sendAutoReply(submitterEmail);
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Newsletter submission error:', error?.message || error);
    return res.status(500).json({ ok: false, error: 'Failed to send emails.' });
  }
};
