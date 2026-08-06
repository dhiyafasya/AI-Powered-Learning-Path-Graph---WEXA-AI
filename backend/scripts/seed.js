/**
 * Seed script for the Learning Path Graph.
 *
 * Loads topics, prerequisites, skills, learning paths and learners into
 * CognoDB. Idempotent by default (MERGE on stable ids); pass `--reset`
 * to wipe the graph first.
 *
 * Usage:
 *   npm run seed           # upsert data
 *   npm run seed:reset     # wipe graph, then upsert
 */
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import neo4j from 'neo4j-driver';
import { config, hasDatabaseConfig, missingDatabaseConfig } from '../src/config.js';
import { seedTopics, seedPaths, seedSkills, seedUsers, REQUIRES } from './seedData.js';

if (!hasDatabaseConfig()) {
  console.error(
    `[seed] Missing database configuration (${missingDatabaseConfig().join(', ')}).\n` +
      `Copy backend/.env.example to backend/.env and fill in your CognoDB instance details.`
  );
  process.exit(1);
}

const reset = process.argv.includes('--reset');

const driver = neo4j.driver(
  config.neo4j.uri,
  neo4j.auth.basic(config.neo4j.user, config.neo4j.password),
  { connectionTimeout: 10000 }
);

const session = driver.session();

async function run(statement, params = {}) {
  return session.run(statement, params);
}

async function main() {
  console.log(`[seed] Connecting to ${config.neo4j.uri}…`);
  await driver.verifyConnectivity();
  console.log('[seed] Connected.');

  if (reset) {
    console.log('[seed] --reset: wiping graph…');
    await run('MATCH (n) DETACH DELETE n');
  }

  // 0. Uniqueness constraint on account emails (best-effort) --------------
  try {
    await run('CREATE CONSTRAINT user_email_unique IF NOT EXISTS FOR (u:User) REQUIRE u.email IS UNIQUE');
    console.log('[seed] Uniqueness constraint on User.email ensured.');
  } catch (err) {
    console.warn(`[seed] Could not create uniqueness constraint (${err.message}). Registrations still check duplicates first.`);
  }

  // 1. Topics ------------------------------------------------------------
  for (const t of seedTopics) {
    await run(
      `MERGE (t:Topic { id_topic: $id })
       ON CREATE SET t.createdAt = datetime()
       SET t.name = $name,
           t.category = $category,
           t.level = $level,
           t.estHours = $estHours,
           t.summary = $summary,
           t.goals = $goals`,
      { id: t.id_topic, ...t }
    );
  }
  console.log(`[seed] ${seedTopics.length} topics upserted.`);

  // 2. Prerequisite relationships ----------------------------------------
  for (const [source, target] of REQUIRES) {
    await run(
      `MATCH (a:Topic { id_topic: $source })
       MATCH (b:Topic { id_topic: $target })
       MERGE (a)-[:REQUIRES]->(b)`,
      { source, target }
    );
  }
  console.log(`[seed] ${REQUIRES.length} REQUIRES relationships created.`);

  // 3. Skills + TEACHES --------------------------------------------------
  let teachesCount = 0;
  for (const s of seedSkills) {
    await run(
      `MERGE (s:Skill { id_skill: $id })
       ON CREATE SET s.createdAt = datetime()
       SET s.name = $name, s.description = $description`,
      { id: s.id_skill, ...s }
    );
    for (const topicId of s.taughtBy) {
      await run(
        `MATCH (topic:Topic { id_topic: $topicId })
         MATCH (skill:Skill { id_skill: $skillId })
         MERGE (topic)-[:TEACHES]->(skill)`,
        { topicId, skillId: s.id_skill }
      );
      teachesCount += 1;
    }
  }
  console.log(`[seed] ${seedSkills.length} skills, ${teachesCount} TEACHES relationships.`);

  // 4. Learning paths + CONTAINS -----------------------------------------
  for (const p of seedPaths) {
    await run(
      `MERGE (p:Path { id_path: $id })
       ON CREATE SET p.createdAt = datetime()
       SET p.name = $name, p.tagline = $tagline, p.description = $description, p.icon = $icon`,
      { id: p.id_path, ...p }
    );
    for (let i = 0; i < p.topics.length; i += 1) {
      const topicId = p.topics[i];
      await run(
        `MATCH (p:Path { id_path: $pathId })
         MATCH (t:Topic { id_topic: $topicId })
         MERGE (p)-[c:CONTAINS]->(t)
         SET c.order = $order`,
        { pathId: p.id_path, topicId, order: i }
      );
    }
  }
  console.log(`[seed] ${seedPaths.length} learning paths upserted.`);

  // 5. Learners + progress ------------------------------------------------
  let completedCount = 0;
  for (const u of seedUsers) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    await run(
      `MERGE (u:User { id_user: $id })
       ON CREATE SET u.createdAt = datetime()
       SET u.name = $name,
           u.email = $email,
           u.passwordHash = $passwordHash,
           u.avatarColor = $avatarColor,
           u.focus = $focus`,
      { id: u.id_user, name: u.name, email: u.email, passwordHash, avatarColor: u.avatarColor, focus: u.focus }
    );
    if (u.enrolledPathId) {
      await run(
        `MATCH (u:User { id_user: $userId })
         MATCH (p:Path { id_path: $pathId })
         MERGE (u)-[:ENROLLED_IN]->(p)`,
        { userId: u.id_user, pathId: u.enrolledPathId }
      );
    }
    for (const topicId of u.completed) {
      await run(
        `MATCH (u:User { id_user: $userId })
         MATCH (t:Topic { id_topic: $topicId })
         MERGE (u)-[c:COMPLETED]->(t)
         ON CREATE SET c.completedAt = datetime(), c.score = 100
         ON MATCH SET c.completedAt = datetime(), c.score = 100`,
        { userId: u.id_user, topicId }
      );
      completedCount += 1;
    }
  }
  console.log(`[seed] ${seedUsers.length} learners, ${completedCount} COMPLETED relationships.`);

  const stats = await run(
    `MATCH (n) WITH count(n) AS nodes
     MATCH ()-[r]->() RETURN nodes, count(r) AS relationships`
  );
  const rec = stats.records[0];
  console.log('\n[seed] Done. Graph now contains:');
  console.log(`  • ${rec.get('nodes').toNumber()} nodes`);
  console.log(`  • ${rec.get('relationships').toNumber()} relationships`);
  console.log('\n[seed] Start the API with `npm run dev` and open the frontend.');
}

main()
  .catch((err) => {
    console.error('\n[seed] Failed:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await session.close();
    await driver.close();
  });
