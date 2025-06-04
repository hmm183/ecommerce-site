const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Get the authorization header from the request
  const authHeader = req.headers['authorization'];

  // If no authorization header is provided, the user is unauthorized.
  // This typically means no token was sent.
  if (!authHeader) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  // The authorization header is expected to be in the format "Bearer <token>".
  // Split the header value by space to separate the scheme ("Bearer") from the token.
  const parts = authHeader.split(' ');

  // If the parts array doesn't have exactly two elements, the token format is incorrect.
  if (parts.length !== 2) {
    return res.status(401).json({ message: 'Unauthorized: Bad token format' });
  }

  // Destructure the parts into scheme and token.
  const [scheme, token] = parts;

  // If the scheme is not "Bearer", the token is malformed or uses an unsupported scheme.
  if (scheme !== 'Bearer') {
    return res.status(401).json({ message: 'Unauthorized: Malformed token' });
  }

  // Verify the JWT using the secret key.
  // The secret key is typically stored in environment variables (process.env.JWT_SECRET).
  // A fallback 'jwt-secret' is provided for development or if the env variable isn't set.
  jwt.verify(token, process.env.JWT_SECRET || 'jwt-secret', (err, decoded) => {
    // If there's an error during verification (e.g., token expired, invalid signature),
    // the token is considered invalid.
    if (err) {
      return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }

    // If the token is valid, attach the decoded payload to the request object.
    // This makes user information (like ID, role, and potentially 'banned' status)
    // available to subsequent middleware and route handlers.
    req.user = decoded;

    // --- BAN CHECK ---
    // After successfully decoding the user's information, check if the user is banned.
    // It's assumed that the 'banned' status (e.g., a boolean `banned: true/false`)
    // is included in the JWT payload when the token is generated.
    if (req.user.banned) {
      // If the user is banned, return a 403 Forbidden status.
      // This indicates that the server understands the request but refuses to fulfill it
      // because the user does not have the necessary authorization.
      console.log('banned');
      return res.status(403).json({ message: 'You are banned from accessing this resource.' });
    }

    // If the user is authenticated and not banned, proceed to the next middleware or route handler.
    next();
  });
};