import 'dotenv/config';

const REQUIRED = ['NEO4J_URI', 'NEO4J_USER', 'NEO4J_PASSWORD'];

/**
 * Parse FRONTEND_ORIGIN into a list of allowed origins. Values may be
 * comma-separated; trailing slashes are stripped because browsers send the
 * Origin header without one (e.g. `https://site.netlify.app`).
 */
function parseOrigins(raw) {
  return (raw || '')
    .split(',')
    .map((origin) => origin.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

export const config = {
  port: Number(process.env.PORT || 4000),
  frontendOrigins: parseOrigins(process.env.FRONTEND_ORIGIN || 'http://localhost:5173'),
  neo4j: {
    uri: process.env.NEO4J_URI || '',
    user: process.env.NEO4J_USER || '',
    password: process.env.NEO4J_PASSWORD || '',
  },
  auth: {
    jwtSecret: process.env.JWT_SECRET || '',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
};

/** True when authentication can issue and verify tokens. */
export function hasAuthConfig() {
  return Boolean(config.auth.jwtSecret);
}

/** True only when every required database variable is present. */
export function hasDatabaseConfig() {
  return REQUIRED.every((key) => Boolean(process.env[key]));
}

/** Returns the names of the database variables that are missing. */
export function missingDatabaseConfig() {
  return REQUIRED.filter((key) => !process.env[key]);
}
