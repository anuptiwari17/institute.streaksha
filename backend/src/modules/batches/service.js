const pool = require('../../config/db');

const createBatch = async (tenantId, { name, academic_year }) => {
  if (!name) throw { status: 400, message: 'Batch name required' };

  const existing = await pool.query(
    'SELECT id FROM batches WHERE tenant_id = $1 AND LOWER(name) = LOWER($2)',
    [tenantId, name]
  );
  if (existing.rows.length) throw { status: 409, message: 'Batch already exists' };

  const r = await pool.query(
    `INSERT INTO batches (tenant_id, name, academic_year)
     VALUES ($1,$2,$3) RETURNING *`,
    [tenantId, name, academic_year || null]
  );
  return r.rows[0];
};

const listBatches = async (tenantId) => {
  const r = await pool.query(
    `SELECT b.id, b.name, b.academic_year, b.is_active, b.created_at,
            COUNT(DISTINCT be.user_id)::int AS student_count,
            COUNT(DISTINCT ta.id)::int AS teacher_count
     FROM batches b
     LEFT JOIN batch_enrollments be ON be.batch_id = b.id
     LEFT JOIN teaching_assignments ta ON ta.batch_id = b.id
     WHERE b.tenant_id = $1
     GROUP BY b.id
     ORDER BY b.created_at DESC`,
    [tenantId]
  );
  return r.rows;
};

const getBatch = async (tenantId, batchId) => {
  const r = await pool.query(
    `SELECT b.id, b.name, b.academic_year, b.is_active, b.created_at,
            COUNT(DISTINCT be.user_id)::int AS student_count
     FROM batches b
     LEFT JOIN batch_enrollments be ON be.batch_id = b.id
     WHERE b.id = $1 AND b.tenant_id = $2
     GROUP BY b.id`,
    [batchId, tenantId]
  );
  if (!r.rows.length) throw { status: 404, message: 'Batch not found' };
  return r.rows[0];
};

const updateBatch = async (tenantId, batchId, { name, academic_year, is_active }) => {
  const r = await pool.query(
    `UPDATE batches
     SET name = COALESCE($1, name),
         academic_year = COALESCE($2, academic_year),
         is_active = COALESCE($3, is_active)
     WHERE id = $4 AND tenant_id = $5
     RETURNING *`,
    [name || null, academic_year || null, is_active ?? null, batchId, tenantId]
  );
  if (!r.rows.length) throw { status: 404, message: 'Batch not found' };
  return r.rows[0];
};

const deleteBatch = async (tenantId, batchId) => {
  // Check if any quizzes are assigned to this batch
  const quizzes = await pool.query(
    `SELECT id FROM quizzes WHERE batch_id = $1 LIMIT 1`,
    [batchId]
  );
  if (quizzes.rows.length)
    throw { status: 409, message: 'Batch has quizzes assigned. Remove them first.' };

  const r = await pool.query(
    'DELETE FROM batches WHERE id = $1 AND tenant_id = $2 RETURNING id',
    [batchId, tenantId]
  );
  if (!r.rows.length) throw { status: 404, message: 'Batch not found' };
  return { message: 'Batch deleted' };
};

const addStudent = async (tenantId, batchId, { userId }) => {
  if (!userId) throw { status: 400, message: 'userId required' };

  // Verify batch belongs to tenant
  const batch = await pool.query(
    'SELECT id FROM batches WHERE id = $1 AND tenant_id = $2',
    [batchId, tenantId]
  );
  if (!batch.rows.length) throw { status: 404, message: 'Batch not found' };

  // Verify student belongs to tenant
  const student = await pool.query(
    `SELECT id FROM users WHERE id = $1 AND tenant_id = $2 AND role = 'student' AND is_active = TRUE`,
    [userId, tenantId]
  );
  if (!student.rows.length) throw { status: 404, message: 'Student not found' };

  const r = await pool.query(
    `INSERT INTO batch_enrollments (batch_id, user_id)
     SELECT $1, $2
     WHERE NOT EXISTS (
       SELECT 1 FROM batch_enrollments WHERE batch_id = $1 AND user_id = $2
     )
     RETURNING *`,
    [batchId, userId]
  );

  if (!r.rows.length) throw { status: 409, message: 'Student already in this batch' };
  return { message: 'Student added to batch' };
};

const removeStudent = async (tenantId, batchId, userId) => {
  // Verify batch belongs to tenant
  const batch = await pool.query(
    'SELECT id FROM batches WHERE id = $1 AND tenant_id = $2',
    [batchId, tenantId]
  );
  if (!batch.rows.length) throw { status: 404, message: 'Batch not found' };

  const r = await pool.query(
    'DELETE FROM batch_enrollments WHERE batch_id = $1 AND user_id = $2 RETURNING id',
    [batchId, userId]
  );
  if (!r.rows.length) throw { status: 404, message: 'Student not in this batch' };
  return { message: 'Student removed from batch' };
};

const listStudents = async (tenantId, batchId, { page = 1, limit = 50 }) => {
  // Verify batch belongs to tenant
  const batch = await pool.query(
    'SELECT id FROM batches WHERE id = $1 AND tenant_id = $2',
    [batchId, tenantId]
  );
  if (!batch.rows.length) throw { status: 404, message: 'Batch not found' };

  const offset = (page - 1) * limit;

  const [data, count] = await Promise.all([
    pool.query(
      `SELECT u.id, u.name, u.email, u.roll_no, u.is_active
       FROM batch_enrollments be
       JOIN users u ON u.id = be.user_id
       WHERE be.batch_id = $1
       ORDER BY u.name ASC
       LIMIT $2 OFFSET $3`,
      [batchId, limit, offset]
    ),
    pool.query(
      'SELECT COUNT(*) FROM batch_enrollments WHERE batch_id = $1',
      [batchId]
    ),
  ]);

  return {
    students: data.rows,
    total: parseInt(count.rows[0].count),
    page: parseInt(page),
    totalPages: Math.ceil(count.rows[0].count / limit),
  };
};

const listAssignments = async (tenantId, batchId) => {
  const batch = await pool.query(
    'SELECT id FROM batches WHERE id = $1 AND tenant_id = $2',
    [batchId, tenantId]
  );
  if (!batch.rows.length) throw { status: 404, message: 'Batch not found' };

  const r = await pool.query(
    `SELECT ta.id, ta.subject_id, ta.teacher_id,
            s.name AS subject_name,
            u.name AS teacher_name,
            u.email AS teacher_email
     FROM teaching_assignments ta
     JOIN subjects s ON s.id = ta.subject_id
     JOIN users u ON u.id = ta.teacher_id
     JOIN batches b ON b.id = ta.batch_id
     WHERE ta.batch_id = $1 AND b.tenant_id = $2
     ORDER BY s.name ASC, u.name ASC`,
    [batchId, tenantId]
  );

  return r.rows;
};

module.exports = {
  createBatch, listBatches, getBatch,
  updateBatch, deleteBatch,
  addStudent, removeStudent, listStudents, listAssignments,
};