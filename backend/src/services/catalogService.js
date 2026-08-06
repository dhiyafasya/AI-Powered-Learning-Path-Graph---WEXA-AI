import { getDriver } from '../db/driver.js';
import { runQuery } from '../lib/record.js';
import * as q from '../queries/cypher.js';

export async function getStats() {
  const rows = await runQuery(getDriver(), q.STATS);
  return rows[0] || { nodeCount: 0, relationshipCount: 0 };
}

export async function listPaths() {
  const rows = await runQuery(getDriver(), q.PATHS_LIST);
  return rows.map((r) => ({ ...r.path, topicCount: r.topicCount }));
}

export async function getPathDetail(pathId) {
  const rows = await runQuery(getDriver(), q.PATH_DETAIL, { pathId });
  if (rows.length === 0) return null;
  const path = rows[0].path;
  const topics = rows.map((r) => ({
    ...r.topic,
    position: r.position,
    requires: r.requires,
  }));
  return { ...path, topics };
}

export async function listTopics({ search = '', category = '' } = {}) {
  const rows = await runQuery(getDriver(), q.TOPIC_LIST, { search, category });
  return rows.map((r) => ({
    ...r.topic,
    prerequisiteCount: r.prerequisiteCount,
    unlocksCount: r.unlocksCount,
  }));
}

export async function listCategories() {
  const rows = await runQuery(getDriver(), q.CATEGORIES);
  return rows.map((r) => r.category);
}

export async function getTopicDetail(id) {
  const rows = await runQuery(getDriver(), q.TOPIC_DETAIL, { id });
  if (rows.length === 0) return null;
  return rows[0];
}

export async function getSubgraph(id, maxDepth = 2) {
  const nodeRows = await runQuery(getDriver(), q.SUBGRAPH_NODES, { id, maxDepth });
  const nodes = nodeRows.map((r) => r.node);
  const ids = nodes.map((n) => n.id);
  const edgeRows = ids.length ? await runQuery(getDriver(), q.SUBGRAPH_EDGES, { ids }) : [];
  return {
    nodes,
    edges: edgeRows.map((r) => ({ source: r.source, target: r.target })),
  };
}

export async function getTopicGraph() {
  const rows = await runQuery(getDriver(), q.TOPIC_GRAPH);
  const byId = new Map();
  const edges = [];
  for (const r of rows) {
    byId.set(r.topic.id, r.topic);
    for (const prereqId of r.requires) {
      edges.push({ source: r.topic.id, target: prereqId });
    }
  }
  return { topics: [...byId.values()], edges };
}

export async function listSkills({ withDemand = false } = {}) {
  const statement = withDemand ? q.SKILLS_WITH_DEMAND : q.SKILLS_LIST;
  const rows = await runQuery(getDriver(), statement);
  return rows.map((r) => ({
    ...r.skill,
    taughtByCount: r.taughtByCount,
    demandCount: r.demandCount,
    topicCount: r.topicCount,
  }));
}
