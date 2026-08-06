/**
 * All Cypher statements used by the application.
 * Every statement is parameterised — no string-concatenated Cypher.
 *
 * Naming convention: node identifiers use namespaced properties
 * (Topic.id_topic, Path.id_path, Skill.id_skill, User.id_user) so the
 * schema reads clearly. API projections normalise these back to `id`
 * so consumers always receive `{ id, ... }`.
 */

/** Node + relationship totals used by the health endpoint. */
export const STATS = `
MATCH (n)
WITH count(n) AS nodeCount
MATCH ()-[r]->()
RETURN nodeCount, count(r) AS relationshipCount
`;

/** List learning paths with topic counts. */
export const PATHS_LIST = `
MATCH (p:Path)
OPTIONAL MATCH (p)-[:CONTAINS]->(t:Topic)
RETURN p { id: p.id_path, .name, .tagline, .icon } AS path,
       count(DISTINCT t) AS topicCount
ORDER BY path.name
`;

/** Single path detail with ordered topics and their prerequisites. */
export const PATH_DETAIL = `
MATCH (p:Path { id_path: $pathId })-[c:CONTAINS]->(t:Topic)
OPTIONAL MATCH (t)-[:REQUIRES]->(pr:Topic)
RETURN p { id: p.id_path, .name, .tagline, .icon, .description } AS path,
       t { id: t.id_topic, .name, .summary, .category, .level, .estHours } AS topic,
       c.order AS position,
       collect(pr.id_topic) AS requires
ORDER BY c.order
`;

/** List/search topics. */
export const TOPIC_LIST = `
MATCH (t:Topic)
WHERE ($search = '' OR toLower(t.name) CONTAINS toLower($search))
  AND ($category = '' OR t.category = $category)
OPTIONAL MATCH (t)-[:REQUIRES]->(pr:Topic)
OPTIONAL MATCH (t)<-[:REQUIRES]-(down:Topic)
RETURN t { id: t.id_topic, .name, .summary, .category, .level, .estHours } AS topic,
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
MATCH (t:Topic { id_topic: $id })
OPTIONAL MATCH (t)-[:REQUIRES]->(pr:Topic)
OPTIONAL MATCH (t)<-[:REQUIRES]-(down:Topic)
OPTIONAL MATCH (t)-[:TEACHES]->(s:Skill)
OPTIONAL MATCH (p:Path)-[:CONTAINS]->(t)
RETURN t { id: t.id_topic, .name, .summary, .category, .level, .estHours, .goals } AS topic,
       collect(DISTINCT pr { id: pr.id_topic, .name, .level }) AS prerequisites,
       collect(DISTINCT down { id: down.id_topic, .name, .level }) AS unlocks,
       collect(DISTINCT s { id: s.id_skill, .name }) AS skills,
       collect(DISTINCT p { id: p.id_path, .name }) AS paths
`;

/**
 * Multi-hop subgraph around a topic. CognoDB does not accept a parameter
 * inside a variable-length relationship (`*0..$n`), so a fixed set of
 * depth-limited query variants is selected by the service (never
 * concatenated from user input).
 */
const SUBGRAPH_NODES_2 = `
MATCH (start:Topic { id_topic: $id })-[:REQUIRES*0..2]-(t:Topic)
RETURN DISTINCT t { id: t.id_topic, .name, .summary, .category, .level, .estHours } AS node
`;

const SUBGRAPH_NODES_3 = `
MATCH (start:Topic { id_topic: $id })-[:REQUIRES*0..3]-(t:Topic)
RETURN DISTINCT t { id: t.id_topic, .name, .summary, .category, .level, .estHours } AS node
`;

const SUBGRAPH_NODES_4 = `
MATCH (start:Topic { id_topic: $id })-[:REQUIRES*0..4]-(t:Topic)
RETURN DISTINCT t { id: t.id_topic, .name, .summary, .category, .level, .estHours } AS node
`;

export const SUBGRAPH_NODES = {
  2: SUBGRAPH_NODES_2,
  3: SUBGRAPH_NODES_3,
  4: SUBGRAPH_NODES_4,
};

/** Edges among a given set of topic ids. */
export const SUBGRAPH_EDGES = `
MATCH (a:Topic)-[r:REQUIRES]->(b:Topic)
WHERE a.id_topic IN $ids AND b.id_topic IN $ids
RETURN a.id_topic AS source, b.id_topic AS target
`;

/** Full topic graph: every topic plus its direct prerequisites. */
export const TOPIC_GRAPH = `
MATCH (t:Topic)
OPTIONAL MATCH (t)-[:REQUIRES]->(pr:Topic)
RETURN t { id: t.id_topic, .name, .summary, .category, .level, .estHours } AS topic,
       collect(pr.id_topic) AS requires
`;

/** Skills with how many topics teach them and recursive downstream demand. */
export const SKILLS_WITH_DEMAND = `
MATCH (t:Topic)-[:TEACHES]->(s:Skill)
WITH s, collect(DISTINCT t.id_topic) AS taughtBy
OPTIONAL MATCH (blocked:Topic)-[:REQUIRES*1..2]->(pr:Topic)-[:TEACHES]->(s)
WHERE NOT blocked.id_topic IN taughtBy
RETURN s { id: s.id_skill, .name, .description } AS skill,
       size(taughtBy) AS taughtByCount,
       count(DISTINCT blocked) AS demandCount
ORDER BY demandCount DESC, taughtByCount DESC
`;

/** Skills list used in filters. */
export const SKILLS_LIST = `
MATCH (s:Skill)
OPTIONAL MATCH (t:Topic)-[:TEACHES]->(s)
RETURN s { id: s.id_skill, .name, .description } AS skill,
       count(DISTINCT t) AS topicCount
ORDER BY skill.name
`;

/** Learners with progress. */
export const USERS_LIST = `
MATCH (u:User)
OPTIONAL MATCH (u)-[:COMPLETED]->(t:Topic)
OPTIONAL MATCH (u)-[:ENROLLED_IN]->(p:Path)
RETURN u { id: u.id_user, .name, .avatarColor, .focus } AS user,
       count(DISTINCT t) AS completedCount,
       collect(DISTINCT p.id_path) AS enrolledPathIds
ORDER BY user.name
`;

/** Single learner with completed topics and enrolled paths. */
export const USER_PROGRESS = `
MATCH (u:User { id_user: $id })
OPTIONAL MATCH (u)-[:COMPLETED]->(t:Topic)
OPTIONAL MATCH (u)-[:ENROLLED_IN]->(p:Path)
RETURN u { id: u.id_user, .name, .avatarColor, .focus } AS user,
       collect(DISTINCT t { id: t.id_topic, .name, .level }) AS completed,
       collect(DISTINCT p { id: p.id_path, .name }) AS enrolledPaths
`;

/** Mark a topic complete for a learner (idempotent). */
export const MARK_TOPIC_COMPLETE = `
MATCH (u:User { id_user: $userId })
MATCH (t:Topic { id_topic: $topicId })
MERGE (u)-[c:COMPLETED]->(t)
ON CREATE SET c.completedAt = datetime(), c.score = $score
RETURN t.id_topic AS topicId
`;

/** Find a user by email (for login / duplicate checks). */
export const USER_BY_EMAIL = `
MATCH (u:User { email: $email })
RETURN u { id: u.id_user, .name, .email, .avatarColor, .focus, .passwordHash } AS user
`;

/** Create a new registered learner. */
export const USER_CREATE = `
CREATE (u:User {
  id_user: $id,
  email: $email,
  name: $name,
  avatarColor: $avatarColor,
  focus: $focus,
  passwordHash: $passwordHash,
  createdAt: datetime()
})
RETURN u { id: u.id_user, .name, .email, .avatarColor, .focus } AS user
`;

/** Fetch a user by id, without secrets. */
export const USER_BY_ID = `
MATCH (u:User { id_user: $id })
OPTIONAL MATCH (u)-[:COMPLETED]->(t:Topic)
RETURN u { id: u.id_user, .name, .email, .avatarColor, .focus } AS user,
       count(DISTINCT t) AS completedCount
`;
