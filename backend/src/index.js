import { createApp } from './app.js';
import { config, missingDatabaseConfig } from './config.js';
import { closeDriver } from './db/driver.js';

const app = createApp();

const server = app.listen(config.port, () => {
  const missing = missingDatabaseConfig();
  console.log(`Learning Path Graph API listening on http://localhost:${config.port}`);
  if (missing.length > 0) {
    console.warn(
      `[warn] Database not configured yet (missing: ${missing.join(', ')}). ` +
        'Health endpoint will report "degraded". Copy backend/.env.example to backend/.env and run `npm run seed`.'
    );
  } else {
    console.log('Database connection details loaded from environment.');
  }
});

async function shutdown(signal) {
  console.log(`\n[${signal}] shutting down…`);
  server.close(async () => {
    await closeDriver();
    process.exit(0);
  });
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
