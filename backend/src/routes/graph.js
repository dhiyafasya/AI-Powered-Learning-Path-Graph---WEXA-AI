import { Router } from 'express';
import { getSubgraph } from '../services/catalogService.js';

const router = Router();

router.get('/subgraph/:id', async (req, res) => {
  const maxDepth = Math.min(Number(req.query.depth || 2), 4);
  const subgraph = await getSubgraph(req.params.id, maxDepth);
  if (subgraph.nodes.length === 0) {
    return res.status(404).json({ error: { code: 'TOPIC_NOT_FOUND', message: `No topic with id "${req.params.id}".` } });
  }
  res.json(subgraph);
});

export default router;
