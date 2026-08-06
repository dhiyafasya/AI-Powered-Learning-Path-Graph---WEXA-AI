import { Router } from 'express';
import { generatePath } from '../services/pathService.js';

const router = Router();

router.post('/generate', async (req, res) => {
  const { targetId, userId = null, completedTopicIds = [] } = req.body || {};
  if (!targetId || typeof targetId !== 'string') {
    return res.status(400).json({
      error: { code: 'MISSING_TARGET', message: 'A "targetId" is required to generate a learning path.' },
    });
  }
  const path = await generatePath({ targetId, userId, completedTopicIds });
  res.json(path);
});

export default router;
