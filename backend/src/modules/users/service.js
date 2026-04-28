const pool = require('../../config/db');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { parse } = require('csv-parse/sync');
const { sendCredentialsEmail } = require('../../utils/email');

// ── helpers ──────────────────────────────────────────────────────────────────

const generatePassword = () => Math.random().toString(36).slice(-8) + 'A1!';

const getTenantName = async (tenantId) => {
  const r = await pool.query('SELECT name FROM tenants WHERE id = $1', [tenantId]);
  return r.rows[0]?.name || 'Streaksha';
};

const getBatchByName = async (tenantId, batchName) => {
  const r = await pool.query(
    'SELECT id FROM batches WHERE tenant_id = $1 AND LOWER(name) = LOWER($2)',
    [tenantId, batchName]
  );
  return r.rows[0] || null;
};

// ── create single user ────────────────────────────────────────────────────────

const createUser = async (tenantId, { name, email, role, roll_no, batchName }) => {
  const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existing.rows.length) throw { status: 409, message: `Email ${email} already exists` };

  const password = generatePassword();
  const hash = await bcrypt.hash(password, 12);
  const instituteName = await getTenantName(tenantId);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userRes = await client.query(
      `INSERT INTO users (tenant_id, name, email, password_hash, role, roll_no)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id, name, email, role`,
      [tenantId, name, email, hash, role, roll_no || null]
    );
    const user = userRes.rows[0];

    if (batchName) {
      const batch = await getBatchByName(tenantId, batchName);
      if (batch) {
        await client.query(
          `INSERT INTO batch_enrollments (batch_id, user_id) VALUES ($1,$2)
           ON CONFLICT DO NOTHING`,
          [batch.id, user.id]
        );
      }
    }

    await client.query('COMMIT');

    // send credentials email (non-blocking)
    sendCredentialsEmail(email, { name, email, password, instituteName }).catch(console.error);

    return user;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

const createTeacher = (tenantId, body) => createUser(tenantId, { ...body, role: 'teacher' });
const createStudent = (tenantId, body) => createUser(tenantId, { ...body, role: 'student' });

// ── bulk import ───────────────────────────────────────────────────────────────

const bulkImport = async (tenantId, fileBuffer, role) => {
  const records = parse(fileBuffer, { columns: true, skip_empty_lines: true, trim: true });

  const results = { success: 0, failed: [] };

  for (const row of records) {
    const { name, email, batch_name, roll_no } = row;
    if (!name || !email) {
      results.failed.push({ email: email || '?', reason: 'Missing name or email' });
      continue;
    }
    try {
      await createUser(tenantId, { name, email, role, roll_no, batchName: batch_name });
      results.success++;
    } catch (err) {
      results.failed.push({ email, reason: err.message });
    }
  }

  return results;
};

// ── list users ────────────────────────────────────────────────────────────────

const listUsers = async (tenantId, { role, batch_id, page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;
  const conditions = ['u.tenant_id = $1', 'u.is_active = TRUE'];
  const params = [tenantId];

  if (role) { params.push(role); conditions.push(`u.role = $${params.length}`); }
  if (batch_id) {
    params.push(batch_id);
    conditions.push(`be.batch_id = $${params.length}`);
  }

  const where = conditions.join(' AND ');
  const join = batch_id ? 'JOIN batch_enrollments be ON be.user_id = u.id' : '';

  params.push(limit, offset);
  const query = `
    SELECT u.id, u.name, u.email, u.role, u.roll_no, u.created_at
    FROM users u ${join}
    WHERE ${where}
    ORDER BY u.created_at DESC
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `;

  const countQuery = `SELECT COUNT(*) FROM users u ${join} WHERE ${where}`;
  const [data, count] = await Promise.all([
    pool.query(query, params),
    pool.query(countQuery, params.slice(0, -2)),
  ]);

  return {
    users: data.rows,
    total: parseInt(count.rows[0].count),
    page: parseInt(page),
    totalPages: Math.ceil(count.rows[0].count / limit),
  };
};

// ── get single user ───────────────────────────────────────────────────────────

const getUser = async (tenantId, userId) => {
  const r = await pool.query(
    `SELECT u.id, u.name, u.email, u.role, u.roll_no, u.created_at,
            json_agg(json_build_object('id', b.id, 'name', b.name)) FILTER (WHERE b.id IS NOT NULL) as batches
     FROM users u
     LEFT JOIN batch_enrollments be ON be.user_id = u.id
     LEFT JOIN batches b ON b.id = be.batch_id
     WHERE u.id = $1 AND u.tenant_id = $2
     GROUP BY u.id`,
    [userId, tenantId]
  );
  if (!r.rows.length) throw { status: 404, message: 'User not found' };
  return r.rows[0];
};

// ── update user ───────────────────────────────────────────────────────────────

const updateUser = async (tenantId, userId, { name, roll_no }) => {
  const r = await pool.query(
    `UPDATE users SET name = COALESCE($1, name), roll_no = COALESCE($2, roll_no)
     WHERE id = $3 AND tenant_id = $4 RETURNING id, name, email, role, roll_no`,
    [name, roll_no, userId, tenantId]
  );
  if (!r.rows.length) throw { status: 404, message: 'User not found' };
  return r.rows[0];
};

// ── soft delete ───────────────────────────────────────────────────────────────

const deleteUser = async (tenantId, userId) => {
  await pool.query(
    'UPDATE users SET is_active = FALSE WHERE id = $1 AND tenant_id = $2',
    [userId, tenantId]
  );
  return { message: 'User deactivated' };
};

module.exports = { createTeacher, createStudent, bulkImport, listUsers, getUser, updateUser, deleteUser };