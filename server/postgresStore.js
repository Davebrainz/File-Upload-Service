import pg from 'pg';

const { Pool } = pg;
const databaseUrl = process.env.DATABASE_URL;
const useSsl = process.env.PGSSLMODE !== 'disable';

export const hasPostgresStorage = Boolean(databaseUrl);
const pool = hasPostgresStorage
  ? new Pool({
      connectionString: databaseUrl,
      ssl: useSsl ? { rejectUnauthorized: false } : undefined,
      max: 5,
    })
  : null;

let schemaPromise;

async function ensureSchema() {
  if (!pool) {
    throw new Error('PostgreSQL storage is not configured. Add DATABASE_URL.');
  }

  schemaPromise ||= pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      email TEXT PRIMARY KEY,
      password_hash TEXT NOT NULL,
      username TEXT UNIQUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await schemaPromise;
}

export async function getUsers() {
  await ensureSchema();
  const { rows } = await pool.query(
    'SELECT email, password_hash, username, created_at FROM users ORDER BY created_at ASC',
  );

  return rows.map((row) => ({
    email: row.email,
    passwordHash: row.password_hash,
    username: row.username || '',
    createdAt: row.created_at.toISOString(),
  }));
}

export async function setUsers(users) {
  await ensureSchema();
  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM users');

    for (const user of users) {
      await client.query(
        `INSERT INTO users (email, password_hash, username, created_at)
         VALUES ($1, $2, $3, $4)`,
        [user.email, user.passwordHash, user.username || null, user.createdAt || new Date().toISOString()],
      );
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
