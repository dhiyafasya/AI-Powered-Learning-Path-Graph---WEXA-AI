/**
 * Pure graph algorithms behind the "AI" part of the app.
 * All functions are side-effect free so they can be unit-tested
 * without a database.
 *
 * Convention: an edge { source, target } means
 * `source REQUIRES target` — you must learn `target` before `source`.
 */

/** Build adjacency maps from an edge list. */
export function buildAdjacency(edges) {
  const requires = new Map(); // topicId -> Set(prereq ids)
  const requiredBy = new Map(); // prereqId -> Set(topic ids that need it)
  for (const edge of edges) {
    const { source, target } = edge;
    if (!requires.has(source)) requires.set(source, new Set());
    requires.get(source).add(target);
    if (!requiredBy.has(target)) requiredBy.set(target, new Set());
    requiredBy.get(target).add(source);
  }
  return { requires, requiredBy };
}

/**
 * Every topic that must be mastered before `targetId`, following
 * REQUIRES edges transitively (multi-hop closure). Does not include
 * the target itself.
 */
export function prerequisiteClosure(targetId, requires) {
  const seen = new Set();
  const stack = [...(requires.get(targetId) || [])];
  while (stack.length > 0) {
    const id = stack.pop();
    if (seen.has(id)) continue;
    seen.add(id);
    for (const prereq of requires.get(id) || []) stack.push(prereq);
  }
  return seen;
}

/** Longest-path topological depth per node (cycle-safe). */
export function computeDepths(ids, edges) {
  const { requires } = buildAdjacency(edges);
  const memo = new Map();
  const active = new Set();

  function depth(id) {
    if (memo.has(id)) return memo.get(id);
    if (active.has(id)) return 0; // cycle guard
    active.add(id);
    let d = 0;
    for (const prereq of requires.get(id) || []) {
      d = Math.max(d, depth(prereq) + 1);
    }
    active.delete(id);
    memo.set(id, d);
    return d;
  }

  const out = new Map();
  for (const id of ids) out.set(id, depth(id));
  return out;
}

/**
 * Builds an ordered, personalised learning path to reach `targetId`.
 *
 * @param {string} targetId
 * @param {Array<{source:string,target:string}>} edges  REQUIRES edges
 * @param {Set<string>} completed  topic ids the learner has already finished
 * @returns {{
 *   steps: Array<{
 *     id, depth, unlockScore, prerequisites, isReady,
 *     isCompleted, isTarget
 *   }>,
 *   totalEstHours: number
 * }}
 */
export function buildOrderedPath(targetId, edges, { completed = new Set() } = {}) {
  const { requires, requiredBy } = buildAdjacency(edges);

  const needed = prerequisiteClosure(targetId, requires);
  needed.add(targetId);

  const depths = computeDepths(needed, edges);

  // unlockScore = how many topics in the path this topic directly unblocks.
  const unlockScore = new Map();
  for (const id of needed) unlockScore.set(id, 0);
  for (const id of needed) {
    for (const downstream of requiredBy.get(id) || []) {
      if (needed.has(downstream)) unlockScore.set(id, unlockScore.get(id) + 1);
    }
  }

  const steps = [...needed].map((id) => {
    const prerequisites = [...(requires.get(id) || [])];
    return {
      id,
      depth: depths.get(id),
      unlockScore: unlockScore.get(id),
      prerequisites,
      isReady: prerequisites.every((p) => completed.has(p)),
      isCompleted: completed.has(id),
      isTarget: id === targetId,
    };
  });

  steps.sort((a, b) =>
    a.depth - b.depth ||
    b.unlockScore - a.unlockScore ||
    a.id.localeCompare(b.id)
  );

  return { steps, totalEstHours: 0 };
}

/**
 * Topics the learner can start right now: in scope, not completed,
 * and with every prerequisite already completed. Sorted by how many
 * downstream topics they unlock (most impactful first).
 */
export function suggestNext(steps) {
  return steps
    .filter((s) => !s.isCompleted && s.isReady)
    .sort((a, b) => b.unlockScore - a.unlockScore || a.depth - b.depth);
}
