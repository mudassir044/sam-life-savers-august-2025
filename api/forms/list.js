const fs = require('fs');
const path = require('path');

function verifyToken(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return false;
  }
  return true;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!verifyToken(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const submissionsPath = path.join(process.cwd(), 'submissions.json');
    
    let submissions = [];
    try {
      const submissionsData = fs.readFileSync(submissionsPath, 'utf8');
      submissions = JSON.parse(submissionsData);
    } catch (e) {
      submissions = [];
    }

    return res.status(200).json(submissions);
  } catch (error) {
    console.error('Error reading submissions:', error);
    return res.status(500).json({ error: 'Failed to load submissions' });
  }
};

