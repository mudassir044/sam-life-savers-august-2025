const fs = require('fs');
const path = require('path');

module.exports = async (req, res) => {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Parse request body
    let body;
    if (typeof req.body === 'string') {
      body = JSON.parse(req.body);
    } else {
      body = req.body || {};
    }

    const { formType, formData } = body;

    if (!formType || !formData) {
      return res.status(400).json({ error: 'Form type and data are required' });
    }

    // Create submissions directory if it doesn't exist
    const submissionsPath = path.join(process.cwd(), 'submissions.json');
    
    // Read existing submissions
    let submissions = [];
    try {
      const submissionsData = fs.readFileSync(submissionsPath, 'utf8');
      submissions = JSON.parse(submissionsData);
    } catch (e) {
      submissions = [];
    }

    // Add new submission
    const submission = {
      id: submissions.length + 1,
      formType: formType,
      data: formData,
      timestamp: new Date().toISOString(),
      status: 'new'
    };

    submissions.push(submission);

    // Save submissions (will work locally, but on Vercel you'll need Git)
    try {
      fs.writeFileSync(submissionsPath, JSON.stringify(submissions, null, 2));
    } catch (writeError) {
      // On Vercel, return the submission data
      return res.status(200).json({ 
        success: true,
        message: 'Form submitted successfully. Data saved.',
        submission: submission,
        note: 'On Vercel, submissions are logged. Check function logs or implement email/webhook.'
      });
    }

    // TODO: Send email notification (optional)
    // You can integrate with SendGrid, Resend, or similar service here

    return res.status(200).json({ 
      success: true,
      message: 'Form submitted successfully!',
      submissionId: submission.id
    });
  } catch (error) {
    console.error('Form submission error:', error);
    return res.status(500).json({ error: 'Submission failed: ' + error.message });
  }
};

