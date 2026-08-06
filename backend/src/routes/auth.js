import { Router } from 'express';
import * as authService from '../services/authService.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.post('/register', async (req, res) => {
  const { name, email, password } = req.body || {};
  const { user, token } = await authService.register({ name, email, password });
  res.status(201).json({ user, token });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  const { user, token } = await authService.login({ email, password });
  res.json({ user, token });
});

router.get('/me', requireAuth, async (req, res) => {
  const user = await authService.getUserById(req.auth.userId);
  if (!user) {
    return res.status(401).json({
      error: { code: 'USER_NOT_FOUND', message: 'This account no longer exists.' },
    });
  }
  res.json({ user });
});

export default router;
