/**
 * All Cypher statements used by the application.
 * Every statement is parameterised — no string-concatenated Cypher.
 */

/** Node + relationship totals used by the health endpoint. */
export const STATS = `
MATCH (n)
WITH count(n) AS nodeCount
MATCH ()-[r]->()
RETURN nodeCount, count(r) AS relationshipCount
`;

/** Tags/labels overview counts. */
export const LABEL_COUNTS = `
CALL db.labels() YIELD label
MATCH (n)
WHERE label IN [l IN db.labels() | l]
RETURN label
`;

/** List learning paths with topic counts. */
export const PATHS_LIST = `
MATCH (p:Path)
OPTIONAL MATCH (p)-[:CONTAINS]->(t:Topic)
RETURN p { .id, .name, .tagline, .icon } AS path,
       count(DISTINCT t) AS topicCount
ORDER BY path.name
`;

/** Single path detail with ordered topics and their prerequisites. */
export const PATH_DETAIL = `
MATCH (p:Path { id: $pathId })-[c:CONTAINS]->(t:Topic)
OPTIONAL MATCH (t)-[:REQUIRES]->(pr:Topic)
RETURN p { .id, .name, .tagline, .icon, .description } AS path,
       t { .id, .name, .summary, .category, .level, .estHours } AS topic,
       c.order AS position,
       collect(pr.id) AS requires
ORDER BY c.order
`;

/** List/search topics. */
export const TOPIC_LIST = `
MATCH (t:Topic)
WHERE ($search = '' OR toLower(t.name) CONTAINS toLower($search))
  AND ($category = '' OR t.category = $category)
OPTIONAL MATCH (t)-[:REQUIRES]->(pr:Topic)
OPTIONAL MATCH (t)<-[:REQUIRES]-(down:Topic)
RETURN t { .id, .name, .summary, .category, .level, .estHours } AS topic,
       count(DISTINCT pr) AS prerequisiteCount,
       count(DISTINCT down) AS unlocksCount
ORDER BY t.name
`;

/** Distinct topic categories. */
export const CATEGORIES = `
MATCH (t:Topic)
RETURN DISTINCT t.category AS category
ORDER BY category
`;

/** Single topic with prerequisites, unlocks, skills and path membership. */
export const TOPIC_DETAIL = `
MATCH (t:Topic { id: $id })
OPTIONAL MATCH (t)-[:REQUIRES]->(pr:Topic)
OPTIONAL MATCH (t)<-[:REQUIRES]-(down:Topic)
OPTIONAL MATCH (t)-[:TEACHES]->(s:Skill)
OPTIONAL MATCH (p:Path)-[:CONTAINS]->(t)
RETURN t { .id, .name, .summary, .category, .level, .estHours, .goals } AS topic,
       collect(DISTINCT pr { .id, .name, .level }) AS prerequisites,
       collect(DISTINCT down { .id, .name, .level }) AS unlocks,
       collect(DISTINCT s { .id, .name }) AS skills,
       collect(DISTINCT p { .id, .name }) AS paths
`;

/**
 * Multi-hop subgraph around a topic. CognoDB does not accept a parameter
 * inside a variable-length relationship (`*0..$n`), so a fixed set of
 * depth-limited query variants is selected by the service (never
 * concatenated from user input).
 */
const SUBGRAPH_NODES_2 = `
MATCH (start:Topic { id: $id })-[:REQUIRES*0..2]-(t:Topic)
RETURN DISTINCT t { .id, .name, .summary, .category, .level, .estHours } AS node
`;

const SUBGRAPH_NODES_3 = `
MATCH (start:Topic { id: $id })-[:REQUIRES*0..3]-(t:Topic)
RETURN DISTINCT t { .id, .name, .summary, .category, .level, .estHours } AS node
`;

const SUBGRAPH_NODES_4 = `
MATCH (start:Topic { id: $id })-[:REQUIRES*0..4]-(t:Topic)
RETURN DISTINCT t { .id, .name, .summary, .category, .level, .estHours } AS node
`;

export const SUBGRAPH_NODES = {
  2: SUBGRAPH_NODES_2,
  3: SUBGRAPH_NODES_3,
  4: SUBGRAPH_NODES_4,
};

/** Edges among a given set of topic ids. */
export const SUBGRAPH_EDGES = `
MATCH (a:Topic)-[r:REQUIRES]->(b:Topic)
WHERE a.id IN $ids AND b.id IN $ids
RETURN a.id AS source, b.id AS target
`;

/** Full topic graph: every topic plus its direct prerequisites. */
export const TOPIC_GRAPH = `
MATCH (t:Topic)
OPTIONAL MATCH (t)-[:REQUIRES]->(pr:Topic)
RETURN t { .id, .name, .summary, .category, .level, .estHours } AS topic,
       collect(pr.id) AS requires
`;

/** Skills with how many topics teach them and recursive downstream demand. */
export const SKILLS_WITH_DEMAND = `
MATCH (t:Topic)-[:TEACHES]->(s:Skill)
WITH s, collect(DISTINCT t.id) AS taughtBy
OPTIONAL MATCH (blocked:Topic)-[:REQUIRES*1..2]->(pr:Topic)-[:TEACHES]->(s)
WHERE NOT blocked.id IN taughtBy
RETURN s { .id, .name, .description } AS skill,
       size(taughtBy) AS taughtByCount,
       count(DISTINCT blocked) AS demandCount
ORDER BY demandCount DESC, taughtByCount DESC
`;

/** Skills list used in filters. */
export const SKILLS_LIST = `
MATCH (s:Skill)
OPTIONAL MATCH (t:Topic)-[:TEACHES]->(s)
RETURN s { .id, .name, .description } AS skill,
       count(DISTINCT t) AS topicCount
ORDER BY skill.name
`;

/** Learners with progress. */
export const USERS_LIST = `
MATCH (u:User)
OPTIONAL MATCH (u)-[:COMPLETED]->(t:Topic)
OPTIONAL MATCH (u)-[:ENROLLED_IN]->(p:Path)
RETURN u { .id, .name, .avatar, .focus } AS user,
       count(DISTINCT t) AS completedCount,
       collect(DISTINCT p.id) AS enrolledPathIds
ORDER BY user.name
`;

/** Single learner with completed topics and enrolled paths. */
export const USER_PROGRESS = `
MATCH (u:User { id: $id })
OPTIONAL MATCH (u)-[:COMPLETED]->(t:Topic)
OPTIONAL MATCH (u)-[:ENROLLED_IN]->(p:Path)
RETURN u { .id, .name, .avatar, .focus } AS user,
       collect(DISTINCT t { .id, .name, .level }) AS completed,
       collect(DISTINCT p { .id, .name }) AS enrolledPaths
`;

/** Mark a topic complete for a learner (idempotent). */
export const MARK_TOPIC_COMPLETE = `
MATCH (u:User { id: $userId })
MATCH (t:Topic { id: $topicId })
MERGE (u)-[c:COMPLETED]->(t)
ON CREATE SET c.completedAt = datetime(), c.score = $score
RETURN t.id AS topicId
`;
