import { getDriver } from '../db/driver.js';
import { runQuery } from '../lib/record.js';
import * as q from '../queries/cypher.js';

export async function listUsers() {
  const rows = await runQuery(getDriver(), q.USERS_LIST);
  return rows.map((r) => ({
    ...r.user,
    completedCount: r.completedCount,
    enrolledPathIds: r.enrolledPathIds,
  }));
}

export async function getUserProgress(userId) {
  const rows = await runQuery(getDriver(), q.USER_PROGRESS, { id: userId });
  return rows.length ? rows[0] : null;
}

export async function markTopicComplete(userId, topicId, score = 100) {
  const rows = await runQuery(getDriver(), q.MARK_TOPIC_COMPLETE, { userId, topicId, score });
  return rows[0] || null;
}
