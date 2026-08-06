import { getDriver } from '../db/driver.js';
import { runQuery } from '../lib/record.js';
import * as q from '../queries/cypher.js';
import { getTopicGraph } from './catalogService.js';
import { getUserProgress } from './userService.js';
import { buildOrderedPath, suggestNext } from './pathEngine.js';

/**
 * Generates a personalised learning path towards `targetId`.
 *
 * Combines the full prerequisite graph with the learner's history
 * (or an explicit list of completed topics) and returns an ordered
 * step-by-step path plus "what to do next" recommendations.
 */
export async function generatePath({ targetId, userId = null, completedTopicIds = [] }) {
  const driver = getDriver();

  const { topics, edges } = await getTopicGraph();

  const byId = new Map(topics.map((t) => [t.id, t]));
  const target = byId.get(targetId);
  if (!target) {
    const err = new Error(`Topic "${targetId}" not found`);
    err.status = 404;
    err.code = 'TOPIC_NOT_FOUND';
    throw err;
  }

  const completed = new Set(completedTopicIds);
  if (userId) {
    const progress = await getUserProgress(userId);
    if (progress) {
      for (const t of progress.completed) completed.add(t.id);
    }
  }

  const { steps, totalEstHours } = buildOrderedPath(targetId, edges, { completed });

  const hoursById = new Map(topics.map((t) => [t.id, t.estHours || 0]));
  const sumHours = steps.reduce((acc, s) => acc + (hoursById.get(s.id) || 0), 0);

  const decorated = steps.map((step) => ({
    ...step,
    topic: byId.get(step.id),
  }));

  const remaining = decorated.filter((s) => !s.isCompleted);
  const suggestions = suggestNext(decorated).map((s) => s.topic);

  const stats = {
    totalTopics: steps.length,
    remainingTopics: remaining.length,
    completedTopics: steps.length - remaining.length,
    totalEstHours: sumHours,
    remainingEstHours: remaining.reduce((acc, s) => acc + (s.topic?.estHours || 0), 0),
  };

  return {
    target,
    steps: decorated,
    nextSuggestions: suggestions,
    stats,
  };
}
