/**
 * Layered DAG layout for the graph visualisation.
 *
 * An edge { source, target } means "source REQUIRES target", so the
 * target (the prerequisite) is laid out further to the left. Depth is
 * the longest prerequisite chain ending at a topic; fundamentals sit
 * on the left, advanced topics on the right.
 */

export function computeDepths(ids, edges) {
  const requires = new Map();
  for (const e of edges) {
    if (!requires.has(e.source)) requires.set(e.source, []);
    requires.get(e.source).push(e.target);
  }

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

  const out = {};
  for (const id of ids) out[id] = depth(id);
  return out;
}

export function layeredPositions(nodes, edges, opts = {}) {
  const { hGap = 230, vGap = 96 } = opts;
  const depths = computeDepths(nodes.map((n) => n.id), edges);

  const byDepth = {};
  for (const n of nodes) {
    const d = depths[n.id] ?? 0;
    if (!byDepth[d]) byDepth[d] = [];
    byDepth[d].push(n.id);
  }

  const pos = {};
  for (const [depthStr, ids] of Object.entries(byDepth)) {
    const d = Number(depthStr);
    ids.forEach((id, i) => {
      pos[id] = {
        x: d * hGap,
        y: (i - (ids.length - 1) / 2) * vGap,
      };
    });
  }
  return pos;
}
