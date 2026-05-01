require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('../src/config/db');

if (!process.env.SUPERADMIN_EMAIL || !process.env.SUPERADMIN_PASSWORD || !process.env.SUPERADMIN_NAME) {
  console.error('❌ SUPERADMIN details are required in env');
  process.exit(1);
}
const SUPERADMIN_EMAIL = process.env.SUPERADMIN_EMAIL
const SUPERADMIN_PASSWORD = process.env.SUPERADMIN_PASSWORD
const SUPERADMIN_NAME = process.env.SUPERADMIN_NAME


async function main() {
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }

  const passwordHash = await bcrypt.hash(SUPERADMIN_PASSWORD, 12);

  const existing = await pool.query(
    'SELECT id, role, tenant_id FROM users WHERE email = $1 LIMIT 1',
    [SUPERADMIN_EMAIL]
  );

  if (existing.rows.length) {
    const current = existing.rows[0];
    await pool.query(
      `UPDATE users
       SET name = $1,
           password_hash = $2,
           role = 'super_admin',
           tenant_id = NULL,
           is_active = TRUE
       WHERE id = $3`,
      [SUPERADMIN_NAME, passwordHash, current.id]
    );
    console.log(`Updated existing user ${SUPERADMIN_EMAIL} to super_admin`);
  } else {
    await pool.query(
      `INSERT INTO users (tenant_id, name, email, password_hash, role, is_active)
       VALUES (NULL, $1, $2, $3, 'super_admin', TRUE)`,
      [SUPERADMIN_NAME, SUPERADMIN_EMAIL, passwordHash]
    );
    console.log(`Inserted super_admin user ${SUPERADMIN_EMAIL}`);
  }

  await pool.end();
}

main().catch(async (err) => {
  console.error('Failed to seed super admin:', err.message || err);
  try {
    await pool.end();
  } catch {}
  process.exit(1);
});