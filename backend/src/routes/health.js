import { Router } from 'express';
import { ping, DbUnavailableError } from '../db/driver.js';
import { getStats } from '../services/catalogService.js';

const router = Router();

/**
 * Health + connectivity report. Always responds (even when the database
 * is unreachable) so the UI can show a friendly state.
 */
router.get('/', async (req, res) => {
  let database = 'offline';
  let stats = null;
  try {
    await ping();
    database = 'online';
    stats = await getStats();
  } catch {
    database = 'offline';
  }
  res.status(database === 'online' ? 200 : 503).json({
    status: database === 'online' ? 'ok' : 'degraded',
    database,
    stats,
  });
});

// Shared by other routers via a helper
export { DbUnavailableError };
export default router;
