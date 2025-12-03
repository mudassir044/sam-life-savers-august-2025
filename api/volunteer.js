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
  return resend.emails.send({
    from: 'SAM Life Savers <hello@join.samlifesavers.org>',
    to: ADMIN_EMAILS,
    subject,
    text: formatAdminBody(fields),
    reply_to: replyTo || undefined,
  });
}

function resolveTemplate() {
  const templateId = process.env.TEMPLATE_VOLUNTEER;
  if (!templateId) {
    const error = new Error('Missing TEMPLATE_VOLUNTEER env var');
    error.envName = 'TEMPLATE_VOLUNTEER';
    throw error;
  }
  return templateId;
}

async function sendAutoReply(templateId, to) {
  return resend.emails.send({
    from: 'SAM Life Savers <hello@join.samlifesavers.org>',
    to,
    template_id: templateId,
  });
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

  const subject = `New Volunteer Application - ${submitterEmail}`;

  let templateId;
  try {
    templateId = resolveTemplate();
  } catch (error) {
    console.error('Volunteer template error:', error?.message || error, error?.response);
    return res
      .status(500)
      .json({ ok: false, error: `Missing ${error?.envName || 'template'} env var` });
  }

  try {
    await sendAdminEmail(subject, fields, submitterEmail);
  } catch (error) {
    console.error('Volunteer admin email error:', error?.message || error, error?.response);
    return res.status(500).json({ ok: false, error: 'Failed to send admin notification.' });
  }

  try {
    await sendAutoReply(templateId, submitterEmail);
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Volunteer auto-reply error:', error?.message || error, error?.response);
    return res
      .status(502)
      .json({ ok: false, error: `Auto-reply failed: ${error?.message || 'Unknown error'}` });
  }
};
