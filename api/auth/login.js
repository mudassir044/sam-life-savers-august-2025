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
    const crypto = require('crypto');
    const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'samlife2025'; // CHANGE THIS!

    function generateToken() {
      return crypto.randomBytes(32).toString('hex');
    }

    // Parse request body - handle both string and object
    let body;
    if (typeof req.body === 'string') {
      body = JSON.parse(req.body);
    } else {
      body = req.body || {};
    }

    const { username, password } = body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const token = generateToken();
      return res.status(200).json({ 
        token,
        message: 'Login successful' 
      });
    }

    return res.status(401).json({ error: 'Invalid credentials' });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Server error: ' + error.message });
  }
};
