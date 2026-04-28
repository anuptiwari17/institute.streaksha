const pool = require('../../config/db');

const createSubject = async (tenantId, { name, code }) => {
  const existing = await pool.query(
    'SELECT id FROM subjects WHERE tenant_id = $1 AND LOWER(name) = LOWER($2)',
    [tenantId, name]
  );
  if (existing.rows.length) throw { status: 409, message: 'Subject already exists' };

  const r = await pool.query(
    'INSERT INTO subjects (tenant_id, name, code) VALUES ($1,$2,$3) RETURNING *',
    [tenantId, name, code || null]
  );
  return r.rows[0];
};

const listSubjects = async (tenantId) => {
  const r = await pool.query(
    `SELECT s.id, s.name, s.code,
       COUNT(DISTINCT q.id)::int AS question_count,
       COUNT(DISTINCT ta.id)::int AS teacher_count
     FROM subjects s
     LEFT JOIN questions q ON q.subject_id = s.id
     LEFT JOIN teaching_assignments ta ON ta.subject_id = s.id
     WHERE s.tenant_id = $1
     GROUP BY s.id
     ORDER BY s.name`,
    [tenantId]
  );
  return r.rows;
};

const deleteSubject = async (tenantId, subjectId) => {
  const r = await pool.query(
    'DELETE FROM subjects WHERE id = $1 AND tenant_id = $2 RETURNING id',
    [subjectId, tenantId]
  );
  if (!r.rows.length) throw { status: 404, message: 'Subject not found' };
  return { message: 'Subject deleted' };
};

const assignTeacher = async (tenantId, subjectId, { teacherId, batchId }) => {
  // Verify teacher belongs to tenant
  const teacher = await pool.query(
    `SELECT id FROM users WHERE id = $1 AND tenant_id = $2 AND role = 'teacher' AND is_active = TRUE`,
    [teacherId, tenantId]
  );
  if (!teacher.rows.length) throw { status: 404, message: 'Teacher not found' };

  // Verify batch belongs to tenant
  const batch = await pool.query(
    'SELECT id FROM batches WHERE id = $1 AND tenant_id = $2',
    [batchId, tenantId]
  );
  if (!batch.rows.length) throw { status: 404, message: 'Batch not found' };

  // Verify subject belongs to tenant
  const subject = await pool.query(
    'SELECT id FROM subjects WHERE id = $1 AND tenant_id = $2',
    [subjectId, tenantId]
  );
  if (!subject.rows.length) throw { status: 404, message: 'Subject not found' };

  const r = await pool.query(
    `INSERT INTO teaching_assignments (teacher_id, subject_id, batch_id)
     VALUES ($1,$2,$3)
     ON CONFLICT (teacher_id, batch_id, subject_id) DO NOTHING
     RETURNING *`,
    [teacherId, subjectId, batchId]
  );
  return r.rows[0] || { message: 'Already assigned' };
};

const listAssignments = async (tenantId, subjectId) => {
  const r = await pool.query(
    `SELECT ta.id, u.name AS teacher_name, u.email,
            b.name AS batch_name, b.id AS batch_id
     FROM teaching_assignments ta
     JOIN users u ON u.id = ta.teacher_id
     JOIN batches b ON b.id = ta.batch_id
     JOIN subjects s ON s.id = ta.subject_id
     WHERE ta.subject_id = $1 AND s.tenant_id = $2`,
    [subjectId, tenantId]
  );
  return r.rows;
};

module.exports = { createSubject, listSubjects, deleteSubject, assignTeacher, listAssignments };