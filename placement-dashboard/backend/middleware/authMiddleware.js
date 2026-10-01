/**
 * Admin Authentication Middleware
 * Protects administrative contest/test injection endpoints
 */
const adminAuth = (req, res, next) => {
  const adminKey = req.headers['x-admin-key'] || req.headers['authorization'];
  const expectedKey = process.env.ADMIN_API_KEY || 'sienna-admin-secret-2025';

  // Support either Bearer <token> or raw key string
  const cleanedKey = adminKey && adminKey.startsWith('Bearer ')
    ? adminKey.slice(7).trim()
    : adminKey;

  if (!cleanedKey || cleanedKey !== expectedKey) {
    return res.status(401).json({
      success: false,
      message: 'Unauthorized: Invalid or missing Admin API Key. Pass "x-admin-key" header.'
    });
  }

  next();
};

module.exports = {
  adminAuth
};
