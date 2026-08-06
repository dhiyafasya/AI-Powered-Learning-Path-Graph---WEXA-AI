import { Router } from 'express';
import * as catalogService from '../services/catalogService.js';

const router = Router();

router.get('/stats', async (req, res) => {
  res.json(await catalogService.getStats());
});

router.get('/paths', async (req, res) => {
  res.json(await catalogService.listPaths());
});

router.get('/paths/:pathId', async (req, res) => {
  const detail = await catalogService.getPathDetail(req.params.pathId);
  if (!detail) {
    return res.status(404).json({ error: { code: 'PATH_NOT_FOUND', message: `No path with id "${req.params.pathId}".` } });
  }
  res.json(detail);
});

router.get('/topics', async (req, res) => {
  const { search = '', category = '' } = req.query;
  res.json(await catalogService.listTopics({ search, category }));
});

router.get('/topics/categories', async (req, res) => {
  res.json(await catalogService.listCategories());
});

router.get('/topics/:id', async (req, res) => {
  const detail = await catalogService.getTopicDetail(req.params.id);
  if (!detail) {
    return res.status(404).json({ error: { code: 'TOPIC_NOT_FOUND', message: `No topic with id "${req.params.id}".` } });
  }
  res.json(detail);
});

router.get('/topics/:id/subgraph', async (req, res) => {
  const maxDepth = Math.min(Number(req.query.depth || 2), 4);
  res.json(await catalogService.getSubgraph(req.params.id, maxDepth));
});

router.get('/skills', async (req, res) => {
  const withDemand = req.query.demand === 'true';
  res.json(await catalogService.listSkills({ withDemand }));
});

router.get('/graph', async (req, res) => {
  res.json(await catalogService.getTopicGraph());
});

export default router;
