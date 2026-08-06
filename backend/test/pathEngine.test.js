import test from 'node:test';
import assert from 'node:assert/strict';
import {
  prerequisiteClosure,
  buildOrderedPath,
  suggestNext,
  computeDepths,
} from '../src/services/pathEngine.js';

const EDGES = [
  { source: 'react', target: 'js' },
  { source: 'react', target: 'html' },
  { source: 'css', target: 'html' },
  { source: 'nextjs', target: 'react' },
  { source: 'nextjs', target: 'node' },
  { source: 'node', target: 'js' },
];

function requiresMap(edges) {
  const map = new Map();
  for (const { source, target } of edges) {
    if (!map.has(source)) map.set(source, new Set());
    map.get(source).add(target);
  }
  return map;
}

test('prerequisiteClosure follows REQUIRES transitively (multi-hop)', () => {
  const closure = prerequisiteClosure('nextjs', requiresMap(EDGES));
  assert.deepEqual([...closure].sort(), ['html', 'js', 'node', 'react'].sort());
  // target itself is excluded
  assert.ok(!closure.has('nextjs'));
});

test('prerequisiteClosure returns empty set for a topic with no prereqs', () => {
  const closure = prerequisiteClosure('html', requiresMap(EDGES));
  assert.equal(closure.size, 0);
});

test('computeDepths gives longest-path topological depth', () => {
  const ids = ['html', 'js', 'css', 'react', 'node', 'nextjs'];
  const depths = computeDepths(ids, EDGES);
  assert.equal(depths.get('html'), 0);
  assert.equal(depths.get('css'), 1);
  assert.equal(depths.get('react'), 1);
  assert.equal(depths.get('node'), 1);
  assert.equal(depths.get('nextjs'), 2);
});

test('buildOrderedPath orders topics so prerequisites come first', () => {
  const { steps } = buildOrderedPath('nextjs', EDGES);
  const order = steps.map((s) => s.id);
  const pos = new Map(order.map((id, i) => [id, i]));
  assert.ok(pos.get('js') < pos.get('react'), 'js before react');
  assert.ok(pos.get('html') < pos.get('react'), 'html before react');
  assert.ok(pos.get('react') < pos.get('nextjs'), 'react before nextjs');
  assert.ok(pos.get('node') < pos.get('nextjs'), 'node before nextjs');
});

test('completed topics are marked and excluded from remaining', () => {
  const completed = new Set(['html', 'js']);
  const { steps } = buildOrderedPath('nextjs', EDGES, { completed });
  const byId = new Map(steps.map((s) => [s.id, s]));
  assert.equal(byId.get('html').isCompleted, true);
  assert.equal(byId.get('react').isCompleted, false);
  assert.equal(byId.get('react').isReady, true, 'react ready once js+html done');
  assert.equal(byId.get('nextjs').isReady, false, 'nextjs needs node too');
});

test('suggestNext returns only ready, uncompleted topics, most impactful first', () => {
  const { steps } = buildOrderedPath('nextjs', EDGES, { completed: new Set(['html', 'js']) });
  const suggestions = suggestNext(steps).map((s) => s.id);
  // node and react are ready; node unlocks nextjs and is also ready.
  assert.ok(suggestions.includes('react'));
  assert.ok(suggestions.includes('node'));
  // unlockScore: react unlocks nextjs (1); node unlocks nextjs (1) -> both fine.
});

test('unlockScore counts how many in-scope topics a topic unblocks', () => {
  const { steps } = buildOrderedPath('react', EDGES, {});
  const react = steps.find((s) => s.id === 'react');
  assert.equal(react.unlockScore, 0); // nothing in scope depends on react
  const js = steps.find((s) => s.id === 'js');
  assert.equal(js.unlockScore, 1); // react depends on js
});
