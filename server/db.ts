// Postgres access for the shared `settings` and `api_logs` tables.
// Connection string: DATABASE_URL (or POSTGRES_URL, set by the Vercel
// Supabase / Postgres integrations). Without it, settings are empty and no
// log is written.

import pg from 'pg';

type Env = Record<string, string | undefined>;

export const EXTENSION_ID = 'exchange';

let pool: pg.Pool | null = null;
let poolUrl = '';

const getPool = (env: Env): pg.Pool | null => {
  const url = env.DATABASE_URL || env.POSTGRES_URL || '';
  if (!url) return null;
  if (!pool || poolUrl !== url) {
    // Serverless: keep a single connection per function instance
    pool = new pg.Pool({ connectionString: url, max: 1, idleTimeoutMillis: 10_000 });
    pool.on('error', err => console.error('[db] pool error', err.message));
    poolUrl = url;
  }
  return pool;
};

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export interface SettingsScope {
  siteId: string;
  environment: string;
}

const SETTINGS_TTL_MS = 60 * 1000;
const settingsCache = new Map<string, { values: Record<string, string>; expiresAt: number }>();

// Returns the effective value of each key for the site / environment.
// Precedence: site-specific row over global row (site_id empty), then
// extension-specific row over '*', then the most recent update.
export const loadSettings = async (env: Env, scope: SettingsScope): Promise<Record<string, string>> => {
  const cacheKey = `${scope.siteId}|${scope.environment}`;
  const cached = settingsCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.values;

  const db = getPool(env);
  if (!db) return {};

  try {
    const { rows } = await db.query<{ key: string; value: string }>(
      `SELECT DISTINCT ON (key) key, value
         FROM settings
        WHERE environment = $1
          AND extension_id IN ($2, '*')
          AND (site_id = $3 OR site_id IS NULL OR site_id = '')
        ORDER BY key,
                 (site_id = $3) DESC NULLS LAST,
                 (extension_id = $2) DESC,
                 updated_at DESC`,
      [scope.environment, EXTENSION_ID, scope.siteId],
    );
    const values = Object.fromEntries(rows.map(r => [r.key, r.value]));
    settingsCache.set(cacheKey, { values, expiresAt: Date.now() + SETTINGS_TTL_MS });
    return values;
  } catch (err) {
    console.error('[db] unable to load settings', err instanceof Error ? err.message : err);
    return {};
  }
};

export const isTruthy = (value: string | undefined) =>
  ['true', '1', 'yes', 'on', 'oui'].includes(String(value ?? '').trim().toLowerCase());

// ---------------------------------------------------------------------------
// API logs
// ---------------------------------------------------------------------------

export interface ApiLogEntry {
  method: string;
  url: string;
  request: unknown;
  status: number | null;
  durationMs: number;
  response: unknown;
  error: string | null;
  siteId: string;
  environment: string;
}

const MAX_PAYLOAD_CHARS = 100_000;

const serialize = (value: unknown): string | null => {
  if (value === undefined || value === null || value === '') return null;
  const json = JSON.stringify(value);
  return json.length > MAX_PAYLOAD_CHARS
    ? JSON.stringify({ truncated: true, preview: json.slice(0, MAX_PAYLOAD_CHARS) })
    : json;
};

// Never throws: a logging failure must not break the API call.
export const writeApiLog = async (env: Env, entry: ApiLogEntry): Promise<void> => {
  const db = getPool(env);
  if (!db) return;
  try {
    await db.query(
      `INSERT INTO api_logs
         (created_at, method, url, request, status, duration_ms, response, error, site_id, extension_id, environment)
       VALUES (now(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        entry.method,
        entry.url,
        serialize(entry.request),
        entry.status,
        Math.round(entry.durationMs),
        serialize(entry.response),
        entry.error,
        entry.siteId || null,
        EXTENSION_ID,
        entry.environment,
      ],
    );
  } catch (err) {
    console.error('[db] unable to write api log', err instanceof Error ? err.message : err);
  }
};
