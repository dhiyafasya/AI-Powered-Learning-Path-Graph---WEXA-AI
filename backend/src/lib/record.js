import neo4j from 'neo4j-driver';

/**
 * Deep-converts a value returned by the driver into plain JSON:
 * Integers become JS numbers, native types become strings, arrays and
 * objects are recursed into. Safe to JSON.stringify.
 */
export function toPlain(value) {
  if (value === null || value === undefined) return value;
  if (neo4j.isInt(value)) return value.toNumber();

  if (Array.isArray(value)) return value.map(toPlain);

  if (value instanceof neo4j.types.Node) {
    return { id: toPlain(value.identity), ...value.properties };
  }

  if (value instanceof neo4j.types.Relationship) {
    return { id: toPlain(value.identity), ...value.properties };
  }

  if (typeof value === 'object') {
    // Native driver types (DateTime, Date, Point, ...) expose toString.
    if (typeof value.toString === 'function' && value.constructor.name !== 'Object') {
      return value.toString();
    }
    const out = {};
    for (const [key, v] of Object.entries(value)) {
      out[key] = toPlain(v);
    }
    return out;
  }

  return value;
}

/** Runs a parameterised query and returns a plain-JSON array of records. */
export async function runQuery(driver, statement, params = {}) {
  const session = driver.session();
  try {
    const result = await session.run(statement, params);
    return result.records.map((record) => toPlain(record.toObject()));
  } finally {
    await session.close();
  }
}
