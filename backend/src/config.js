import 'dotenv/config';

const REQUIRED = ['NEO4J_URI', 'NEO4J_USER', 'NEO4J_PASSWORD'];

export const config = {
  port: Number(process.env.PORT || 4000),
  frontendOrigin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  neo4j: {
    uri: process.env.NEO4J_URI || '',
    user: process.env.NEO4J_USER || '',
    password: process.env.NEO4J_PASSWORD || '',
  },
};

/** True only when every required database variable is present. */
export function hasDatabaseConfig() {
  return REQUIRED.every((key) => Boolean(process.env[key]));
}

/** Returns the names of the database variables that are missing. */
export function missingDatabaseConfig() {
  return REQUIRED.filter((key) => !process.env[key]);
}
