const { Resend } = require('resend');

module.exports = async (req, res) => {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  try {
    // Parse JSON body
    let body;
    if (typeof req.body === 'string') {
      body = JSON.parse(req.body);
    } else {
      body = req.body || {};
    }

    // Honeypot check
    if (body.company && body.company.trim() !== '') {
      return res.status(200).json({ ok: true });
    }

    // Find submitter email (case-insensitive check)
    const emailKeys = ['email', 'Email', 'emailAddress', 'EmailAddress', 'e-mail', 'E-mail'];
    let submitterEmail = null;
    for (const key of emailKeys) {
      if (body[key]) {
        submitterEmail = body[key];
        break;
      }
    }

    if (!submitterEmail) {
      return res.status(400).json({ ok: false, error: 'Email is required' });
    }

    // Validation: max 5000 chars per field, max 20000 total
    let totalLength = 0;
    for (const [key, value] of Object.entries(body)) {
      if (key === 'company') continue; // Skip honeypot
      const strValue = Array.isArray(value) ? value.join(', ') : String(value);
      if (strValue.length > 5000) {
        return res.status(400).json({ ok: false, error: `Field ${key} exceeds maximum length` });
      }
      totalLength += strValue.length;
    }
    if (totalLength > 20000) {
      return res.status(400).json({ ok: false, error: 'Total data exceeds maximum length' });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(e => e);

    // Send admin notification
    await resend.emails.send({
      from: 'SAM Life Savers <hello@join.samlifesavers.org>',
      to: adminEmails,
      replyTo: submitterEmail,
      subject: `Newsletter Signup - ${submitterEmail}`,
      text: `Newsletter signup from: ${submitterEmail}`,
    });

    // Send auto-reply
    await resend.emails.send({
      from: 'SAM Life Savers <newsletter@join.samlifesavers.org>',
      to: submitterEmail,
      templateId: process.env.TEMPLATE_NEWSLETTER,
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Newsletter API error:', error);
    return res.status(500).json({ ok: false, error: error.message || 'Internal server error' });
  }
};

