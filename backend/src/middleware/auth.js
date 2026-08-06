import { verifyToken } from '../services/authService.js';

/**
 * Requires a valid `Authorization: Bearer <jwt>` header.
 * Attaches `req.auth = { userId }` on success, otherwise replies 401.
 */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Authentication required. Sign in to continue.' },
    });
  }

  const userId = verifyToken(token);
  if (!userId) {
    return res.status(401).json({
      error: { code: 'INVALID_TOKEN', message: 'Your session is invalid or has expired. Sign in again.' },
    });
  }

  req.auth = { userId };
  return next();
}
