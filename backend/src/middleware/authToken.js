// The extension sends a static shared token in the `authtoken` header (src/config.js -> AuthData.token).
// This is an app-level check, not a per-user session -- per-user identity is carried in the request
// body as `contact_id` and trusted at face value, matching the extension's current (insecure) contract.
function authToken(req, res, next) {
  const token = req.header('authtoken');
  if (!token || token !== process.env.STATIC_AUTH_TOKEN) {
    return res.status(401).json({ message: 'Invalid or missing authtoken.' });
  }
  next();
}

module.exports = { authToken };
