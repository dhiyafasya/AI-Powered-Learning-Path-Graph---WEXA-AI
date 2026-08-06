import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { getDriver } from '../db/driver.js';
import { runQuery } from '../lib/record.js';
import { config, hasAuthConfig } from '../config.js';
import * as q from '../queries/cypher.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN = 8;
const AVATAR_COLORS = ['#8b5cf6', '#0ea5e9', '#f59e0b', '#10b981', '#ef4444', '#db2777', '#0891b2'];

export class AuthError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = 'AuthError';
    this.status = status;
    this.code = code;
  }
}

function ensureJwtConfigured() {
  if (!hasAuthConfig()) {
    throw new AuthError(
      500,
      'AUTH_NOT_CONFIGURED',
      'Authentication is not configured. Set JWT_SECRET in backend/.env.'
    );
  }
}

function validateRegister({ name, email, password }) {
  if (!name || typeof name !== 'string' || !name.trim()) {
    throw new AuthError(400, 'MISSING_NAME', 'A name is required.');
  }
  if (!email || !EMAIL_RE.test(email)) {
    throw new AuthError(400, 'INVALID_EMAIL', 'A valid email address is required.');
  }
  if (!password || password.length < PASSWORD_MIN) {
    throw new AuthError(
      400,
      'WEAK_PASSWORD',
      `Password must be at least ${PASSWORD_MIN} characters.`
    );
  }
}

function pickColor(seed) {
  let hash = 0;
  for (const ch of String(seed)) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

export async function register({ name, email, password }) {
  ensureJwtConfigured();
  validateRegister({ name, email, password });

  const cleanEmail = email.trim().toLowerCase();
  const existing = await runQuery(getDriver(), q.USER_BY_EMAIL, { email: cleanEmail });
  if (existing.length > 0) {
    throw new AuthError(409, 'EMAIL_TAKEN', 'An account with this email already exists.');
  }

  const id = randomUUID();
  const passwordHash = await bcrypt.hash(password, 10);
  const rows = await runQuery(getDriver(), q.USER_CREATE, {
    id,
    email: cleanEmail,
    name: name.trim(),
    avatarColor: pickColor(cleanEmail),
    focus: 'Exploring the graph',
    passwordHash,
  });

  const user = rows[0].user;
  return { user, token: issueToken(user.id) };
}

export async function login({ email, password }) {
  ensureJwtConfigured();
  if (!email || !password) {
    throw new AuthError(401, 'INVALID_CREDENTIALS', 'Email and password are required.');
  }

  const rows = await runQuery(getDriver(), q.USER_BY_EMAIL, {
    email: email.trim().toLowerCase(),
  });
  if (rows.length === 0) {
    throw new AuthError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
  }

  const { user } = rows[0];
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new AuthError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
  }

  const { passwordHash, ...publicUser } = user;
  return { user: publicUser, token: issueToken(publicUser.id) };
}

export function issueToken(userId) {
  ensureJwtConfigured();
  return jwt.sign({ sub: userId }, config.auth.jwtSecret, {
    expiresIn: config.auth.jwtExpiresIn,
  });
}

export function verifyToken(token) {
  ensureJwtConfigured();
  try {
    const payload = jwt.verify(token, config.auth.jwtSecret);
    if (!payload.sub) throw new Error('missing subject');
    return payload.sub;
  } catch {
    return null;
  }
}

export async function getUserById(userId) {
  const rows = await runQuery(getDriver(), q.USER_BY_ID, { id: userId });
  if (rows.length === 0) return null;
  const { user, completedCount } = rows[0];
  return { ...user, completedCount };
}

export { EMAIL_RE, PASSWORD_MIN };
