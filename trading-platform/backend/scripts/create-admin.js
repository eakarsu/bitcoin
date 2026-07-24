import bcrypt from 'bcryptjs';
import pool from '../src/config/database.js';

const email = String(process.env.ADMIN_EMAIL || process.env.PROVISION_ADMIN_EMAIL || '').trim().toLowerCase();
const password = String(process.env.ADMIN_PASSWORD || process.env.PROVISION_ADMIN_PASSWORD || '');
if (!email.includes('@') || password.length < 12) throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD (12+ characters) are required');
try {
  const result = await pool.query(`INSERT INTO users(email,password_hash,name,subscription_tier,email_verified)
    VALUES($1,$2,$3,'professional',TRUE)
    ON CONFLICT(email) DO UPDATE SET password_hash=EXCLUDED.password_hash,
      name=EXCLUDED.name, subscription_tier='professional', email_verified=TRUE
    RETURNING id`, [email, await bcrypt.hash(password, 10), process.env.PROVISION_ADMIN_NAME || 'Runtime Administrator']);
  await pool.query(`INSERT INTO user_roles(user_id,role_id)
    SELECT $1,id FROM roles WHERE name='admin' ON CONFLICT DO NOTHING`, [result.rows[0].id]);
  console.log(`Provisioned administrator ${email}.`);
} finally {
  await pool.end();
}
