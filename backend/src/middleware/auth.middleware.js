import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-hiring-pipeline-key-change-in-production';

// In-memory blacklist for simple backend logout
const tokenBlacklist = new Set();

export function addToBlacklist(token) {
  tokenBlacklist.add(token);
}

export function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication token required' });
    return;
  }

  const token = authHeader.split(' ')[1];

  if (tokenBlacklist.has(token)) {
    res.status(401).json({ error: 'Invalid or expired authentication token' });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    req.token = token; // Make token available for logout controller
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired authentication token' });
  }
}
