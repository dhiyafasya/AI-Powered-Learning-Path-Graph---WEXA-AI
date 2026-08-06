import { DbUnavailableError } from '../db/driver.js';

/** Wraps a route handler so unhandled rejections become JSON errors. */
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

/** 404 for unknown API routes. */
export function notFoundHandler(req, res) {
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: `Route ${req.method} ${req.originalUrl} not found.` },
  });
}

/** Central error handler: maps known errors to clean JSON responses. */
export function errorHandler(err, req, res, _next) {
  if (err instanceof DbUnavailableError) {
    return res.status(503).json({
      error: { code: err.code, message: err.message },
    });
  }

  const status = err.status || 500;
  if (status >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl}`, err);
  }
  res.status(status).json({
    error: {
      code: err.code || 'INTERNAL_ERROR',
      message: status >= 500 ? 'Something went wrong on the server. Please try again.' : err.message,
    },
  });
}
