import neo4j from 'neo4j-driver';
import { config, hasDatabaseConfig, missingDatabaseConfig } from '../config.js';

export class DbUnavailableError extends Error {
  constructor(detail = '') {
    super(detail ? `Database unavailable: ${detail}` : 'Database unavailable');
    this.name = 'DbUnavailableError';
    this.status = 503;
    this.code = 'DB_UNAVAILABLE';
    this.detail = detail;
  }
}

let driver = null;

/**
 * Lazily creates and returns the shared Bolt driver.
 * Throws DbUnavailableError with a helpful message when the
 * environment has not been configured.
 */
export function getDriver() {
  if (!hasDatabaseConfig()) {
    const missing = missingDatabaseConfig().join(', ');
    throw new DbUnavailableError(
      `missing environment variables: ${missing}. Copy backend/.env.example to backend/.env and fill in your CognoDB instance details.`
    );
  }
  if (!driver) {
    driver = neo4j.driver(
      config.neo4j.uri,
      neo4j.auth.basic(config.neo4j.user, config.neo4j.password),
      {
        connectionTimeout: 8000,
        maxConnectionLifetime: 60 * 60 * 1000,
        userAgent: 'learning-path-graph/1.0',
      }
    );
  }
  return driver;
}

export function getSession() {
  return getDriver().session();
}

/** Verifies connectivity. Resolves true when reachable, otherwise throws. */
export async function ping() {
  const d = getDriver();
  await d.verifyConnectivity({ timeout: 8000 });
  return true;
}

export async function closeDriver() {
  if (driver) {
    await driver.close();
    driver = null;
  }
}
