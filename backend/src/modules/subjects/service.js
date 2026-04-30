const pool = require('../../config/db');

const createSubject = async (tenantId, { name }) => {
  const existing = await pool.query(
    'SELECT id FROM subjects WHERE tenant_id = $1 AND LOWER(name) = LOWER($2)',
    [tenantId, name]
  );
  if (existing.rows.length) throw { status: 409, message: 'Subject already exists' };

  const r = await pool.query(
    'INSERT INTO subjects (tenant_id, name) VALUES ($1,$2) RETURNING *',
    [tenantId, name]
  );
  return r.rows[0];
};

const listSubjects = async (tenantId) => {
  const r = await pool.query(
    `SELECT s.id, s.name,
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
     SELECT $1, $2, $3
     WHERE NOT EXISTS (
       SELECT 1 FROM teaching_assignments
       WHERE teacher_id = $1 AND subject_id = $2 AND batch_id = $3
     )
     RETURNING *`,
    [teacherId, subjectId, batchId]
  );
  return r.rows[0] || { message: 'Already assigned' };
};

const updateAssignment = async (tenantId, subjectId, assignmentId, { teacherId, batchId }) => {
  if (!teacherId || !batchId)
    throw { status: 400, message: 'teacherId and batchId required' };

  const subject = await pool.query(
    'SELECT id FROM subjects WHERE id = $1 AND tenant_id = $2',
    [subjectId, tenantId]
  );
  if (!subject.rows.length) throw { status: 404, message: 'Subject not found' };

  const existing = await pool.query(
    'SELECT id FROM teaching_assignments WHERE id = $1 AND subject_id = $2',
    [assignmentId, subjectId]
  );
  if (!existing.rows.length) throw { status: 404, message: 'Assignment not found' };

  const teacher = await pool.query(
    `SELECT id FROM users WHERE id = $1 AND tenant_id = $2 AND role = 'teacher' AND is_active = TRUE`,
    [teacherId, tenantId]
  );
  if (!teacher.rows.length) throw { status: 404, message: 'Teacher not found' };

  const batch = await pool.query(
    'SELECT id FROM batches WHERE id = $1 AND tenant_id = $2',
    [batchId, tenantId]
  );
  if (!batch.rows.length) throw { status: 404, message: 'Batch not found' };

  const duplicate = await pool.query(
    `SELECT id FROM teaching_assignments
     WHERE subject_id = $1 AND teacher_id = $2 AND batch_id = $3 AND id != $4`,
    [subjectId, teacherId, batchId, assignmentId]
  );
  if (duplicate.rows.length) throw { status: 409, message: 'This assignment already exists' };

  const r = await pool.query(
    `UPDATE teaching_assignments
     SET teacher_id = $1,
         batch_id = $2
     WHERE id = $3 AND subject_id = $4
     RETURNING *`,
    [teacherId, batchId, assignmentId, subjectId]
  );
  if (!r.rows.length) throw { status: 404, message: 'Assignment not found' };
  return r.rows[0];
};

const deleteAssignment = async (tenantId, subjectId, assignmentId) => {
  const subject = await pool.query(
    'SELECT id FROM subjects WHERE id = $1 AND tenant_id = $2',
    [subjectId, tenantId]
  );
  if (!subject.rows.length) throw { status: 404, message: 'Subject not found' };

  const r = await pool.query(
    'DELETE FROM teaching_assignments WHERE id = $1 AND subject_id = $2 RETURNING id',
    [assignmentId, subjectId]
  );
  if (!r.rows.length) throw { status: 404, message: 'Assignment not found' };
  return { message: 'Assignment removed' };
};

const listAssignments = async (tenantId, subjectId) => {
  const r = await pool.query(
    `SELECT ta.id, ta.subject_id, s.name AS subject_name, ta.teacher_id, u.name AS teacher_name, u.email,
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

module.exports = { createSubject, listSubjects, deleteSubject, assignTeacher, listAssignments, updateAssignment, deleteAssignment };