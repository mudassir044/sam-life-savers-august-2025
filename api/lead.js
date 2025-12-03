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

    // Detect intent from payload values (case-insensitive)
    const payloadStr = JSON.stringify(body).toLowerCase();
    let intent = 'collaborate';
    let templateId = process.env.TEMPLATE_COLLAB;
    let fromEmail = 'SAM Life Savers <collaborations@join.samlifesavers.org>';

    if (payloadStr.includes('volunteer')) {
      intent = 'volunteer';
      templateId = process.env.TEMPLATE_VOLUNTEER;
      fromEmail = 'SAM Life Savers <hello@join.samlifesavers.org>';
    } else if (payloadStr.includes('donate') || payloadStr.includes('donor')) {
      intent = 'donate';
      templateId = process.env.TEMPLATE_DONOR;
      fromEmail = 'SAM Life Savers <support@join.samlifesavers.org>';
    } else if (payloadStr.includes('sponsor')) {
      intent = 'sponsor';
      templateId = process.env.TEMPLATE_SPONSOR;
      fromEmail = 'SAM Life Savers <sponsor@join.samlifesavers.org>';
    } else if (payloadStr.includes('collaborate') || payloadStr.includes('collaboration')) {
      intent = 'collaborate';
      templateId = process.env.TEMPLATE_COLLAB;
      fromEmail = 'SAM Life Savers <collaborations@join.samlifesavers.org>';
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const adminEmails = (process.env.ADMIN_EMAILS || '').split(',').map(e => e.trim()).filter(e => e);

    // Get best identifier for subject
    const firstName = body['name-1'] || body['name'] || body['firstName'] || '';
    const lastName = body['name-2'] || body['lastName'] || '';
    const name = [firstName, lastName].filter(Boolean).join(' ') || submitterEmail;
    const subject = `Contact Form: ${intent} - ${name}`;

    // Build admin email body
    const adminBody = Object.entries(body)
      .filter(([key]) => key !== 'company')
      .map(([key, value]) => {
        const displayValue = Array.isArray(value) ? value.join(', ') : String(value);
        return `${key}: ${displayValue}`;
      })
      .join('\n');

    // Send admin notification
    await resend.emails.send({
      from: 'SAM Life Savers <hello@join.samlifesavers.org>',
      to: adminEmails,
      replyTo: submitterEmail,
      subject: subject,
      text: adminBody,
    });

    // Send auto-reply
    await resend.emails.send({
      from: fromEmail,
      to: submitterEmail,
      templateId: templateId,
    });

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Lead API error:', error);
    return res.status(500).json({ ok: false, error: error.message || 'Internal server error' });
  }
};

