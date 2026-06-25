/**
 * Helpers for JSON-encoded String columns. The SQLite connector does not support
 * Prisma's Json type, so JSON-shaped fields are stored as TEXT and (de)serialized
 * here. Keeping this in one place makes the Postgres migration (to real Json
 * columns) a localized change.
 */

/** Safely parse a JSON-encoded string column, returning `fallback` on failure. */
export function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (value === null || value === undefined || value === '') return fallback;
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.error('[json] Failed to parse JSON column value:', error);
    return fallback;
  }
}

/** Serialize a value for storage in a String column. */
export function stringifyJson(value: unknown): string {
  return JSON.stringify(value ?? null);
}
