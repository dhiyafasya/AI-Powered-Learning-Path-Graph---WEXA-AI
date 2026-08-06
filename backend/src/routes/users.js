import { Router } from 'express';
import * as userService from '../services/userService.js';

const router = Router();

router.get('/', async (req, res) => {
  res.json(await userService.listUsers());
});

router.get('/:userId', async (req, res) => {
  const progress = await userService.getUserProgress(req.params.userId);
  if (!progress) {
    return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: `No learner with id "${req.params.userId}".` } });
  }
  res.json(progress);
});

router.post('/:userId/progress', async (req, res) => {
  const { topicId } = req.body || {};
  const score = Number(req.body?.score ?? 100);
  if (!topicId) {
    return res.status(400).json({ error: { code: 'MISSING_TOPIC', message: 'A "topicId" is required.' } });
  }
  const result = await userService.markTopicComplete(req.params.userId, topicId, score);
  if (!result) {
    return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User or topic not found.' } });
  }
  res.status(201).json({ topicId: result.topicId });
});

export default router;
