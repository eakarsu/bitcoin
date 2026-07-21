import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import pool from '../src/config/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigrations() {
  const client = await pool.connect();
  try {
    await client.query(`CREATE TABLE IF NOT EXISTS schema_migrations (
      filename TEXT PRIMARY KEY,
      checksum CHAR(64) NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )`);
    const files = fs.readdirSync(__dirname)
      .filter((name) => /^\d+.*\.sql$/.test(name))
      .sort();
    for (const filename of files) {
      const sql = fs.readFileSync(path.join(__dirname, filename), 'utf8');
      const checksum = crypto.createHash('sha256').update(sql).digest('hex');
      const applied = await client.query('SELECT checksum FROM schema_migrations WHERE filename=$1', [filename]);
      if (applied.rowCount) {
        if (applied.rows[0].checksum !== checksum) throw new Error(`applied migration changed: ${filename}`);
        console.log(`skip ${filename}`);
        continue;
      }
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations (filename,checksum) VALUES ($1,$2)', [filename, checksum]);
        await client.query('COMMIT');
        console.log(`applied ${filename}`);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
    console.log(`migrations current (${files.length})`);
  } catch (error) {
    console.error('✗ Migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigrations();
