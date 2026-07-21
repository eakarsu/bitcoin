import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const launcher = fs.readFileSync(path.join(root, 'start.sh'), 'utf8');
const server = fs.readFileSync(path.join(root, 'backend/src/server.js'), 'utf8');
const migration = fs.readFileSync(path.join(root, 'backend/migrations/008_governed_paper_trading.sql'), 'utf8');

for (const unsafe of [/kill\s+-9/, /npm\s+install/, /createdb/, /npm\s+run\s+seed/]) {
  if (unsafe.test(launcher)) throw new Error(`unsafe launcher pattern: ${unsafe}`);
}
if (!launcher.includes('ALLOW_SCHEMA_MIGRATION')) throw new Error('migration acknowledgement missing');
if (!server.includes("legacy demo surface disabled")) throw new Error('legacy production quarantine missing');
for (const table of ['gt_provider_events', 'gt_fills', 'gt_journal_transactions', 'gt_journal_entries', 'gt_audit_events']) {
  if (!migration.includes(`'${table}'`)) throw new Error(`append-only guard missing for ${table}`);
}

console.log('repository trading-boundary audit: PASS');
