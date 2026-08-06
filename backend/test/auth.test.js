import test from 'node:test';
import assert from 'node:assert/strict';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { EMAIL_RE, PASSWORD_MIN, issueToken, verifyToken } from '../src/services/authService.js';
import { config } from '../src/config.js';

test('email validation accepts typical addresses and rejects malformed ones', () => {
  assert.ok(EMAIL_RE.test('amelia@example.com'));
  assert.ok(EMAIL_RE.test('a.b+tag@sub.domain.io'));
  assert.ok(!EMAIL_RE.test('plainaddress'));
  assert.ok(!EMAIL_RE.test('missing-tld@example'));
  assert.ok(!EMAIL_RE.test('two @@ symbols.com'));
  assert.ok(!EMAIL_RE.test(''));
});

test('minimum password length is enforced at the service boundary', () => {
  assert.equal(PASSWORD_MIN, 8);
  assert.ok('password123'.length >= PASSWORD_MIN);
});

test('bcrypt hashes are salted and comparable only against the original password', async () => {
  const hash = await bcrypt.hash('password123', 10);
  assert.notEqual(hash, 'password123');
  assert.ok(hash.startsWith('$2'));
  assert.equal(await bcrypt.compare('password123', hash), true);
  assert.equal(await bcrypt.compare('wrongpass', hash), false);
});

test('issueToken signs a JWT and verifyToken recovers the user id', () => {
  const token = issueToken('user-amelia');
  assert.equal(typeof token, 'string');
  assert.equal(token.split('.').length, 3);

  const payload = jwt.verify(token, config.auth.jwtSecret);
  assert.equal(payload.sub, 'user-amelia');
  assert.equal(verifyToken(token), 'user-amelia');
});

test('verifyToken rejects tampered and garbage tokens', () => {
  assert.equal(verifyToken('not-a-token'), null);
  const token = issueToken('user-bima');
  const tampered = `${token.slice(0, -4)}xxxx`;
  assert.equal(verifyToken(tampered), null);
});
