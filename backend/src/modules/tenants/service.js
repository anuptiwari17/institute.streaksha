const pool = require('../../config/db');

const listTenants = async ({ page = 1, limit = 20, status }) => {
  const conditions = [];
  const params = [];

  if (status) {
    params.push(status === 'active');
    conditions.push(`t.is_active = $${params.length}`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const offset = (page - 1) * limit;
  params.push(limit, offset);

  const [data, count] = await Promise.all([
    pool.query(
      `SELECT t.id, t.name, t.is_active, t.created_at,
              COUNT(DISTINCT u.id)::int AS user_count,
              COUNT(DISTINCT q.id)::int AS quiz_count
       FROM tenants t
       LEFT JOIN users u ON u.tenant_id = t.id
       LEFT JOIN quizzes q ON q.tenant_id = t.id
       ${where}
       GROUP BY t.id
       ORDER BY t.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    ),
    pool.query(
      `SELECT COUNT(*) FROM tenants t ${where}`,
      params.slice(0, -2)
    ),
  ]);

  return {
    tenants: data.rows,
    total: parseInt(count.rows[0].count),
    page: parseInt(page),
    totalPages: Math.ceil(count.rows[0].count / limit),
  };
};

const getTenant = async (tenantId) => {
  const r = await pool.query(
    'SELECT * FROM tenants WHERE id = $1',
    [tenantId]
  );
  if (!r.rows.length) throw { status: 404, message: 'Tenant not found' };
  return r.rows[0];
};

const deactivateTenant = async (tenantId) => {
  // Deactivate tenant + all their users
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      'UPDATE tenants SET is_active = FALSE WHERE id = $1', [tenantId]
    );
    await client.query(
      'UPDATE users SET is_active = FALSE WHERE tenant_id = $1', [tenantId]
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
  return { message: 'Tenant deactivated' };
};

const activateTenant = async (tenantId) => {
  await pool.query(
    'UPDATE tenants SET is_active = TRUE WHERE id = $1', [tenantId]
  );
  return { message: 'Tenant activated' };
};

const getTenantStats = async (tenantId) => {
  const r = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM users WHERE tenant_id = $1 AND role = 'teacher')::int AS teachers,
       (SELECT COUNT(*) FROM users WHERE tenant_id = $1 AND role = 'student')::int AS students,
       (SELECT COUNT(*) FROM batches WHERE tenant_id = $1)::int AS batches,
       (SELECT COUNT(*) FROM subjects WHERE tenant_id = $1)::int AS subjects,
       (SELECT COUNT(*) FROM questions WHERE tenant_id = $1)::int AS questions,
       (SELECT COUNT(*) FROM quizzes WHERE tenant_id = $1)::int AS quizzes,
       (SELECT COUNT(*) FROM quizzes WHERE tenant_id = $1 AND status = 'published')::int AS published_quizzes,
       (SELECT COUNT(*) FROM quiz_sessions qs JOIN quizzes q ON q.id = qs.quiz_id WHERE q.tenant_id = $1)::int AS total_attempts`,
    [tenantId]
  );
  return r.rows[0];
};

module.exports = { listTenants, getTenant, deactivateTenant, activateTenant, getTenantStats };