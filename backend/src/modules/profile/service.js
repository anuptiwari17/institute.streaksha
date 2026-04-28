const pool = require('../../config/db');
const bcrypt = require('bcryptjs');

// ── GET PROFILE ───────────────────────────────────────────────────────────────

const getProfile = async (userId, tenantId, role) => {
  const userResult = await pool.query(
    `SELECT id, name, email, role, roll_no, is_active, created_at
     FROM users WHERE id = $1`,
    [userId]
  );
  if (!userResult.rows.length) throw { status: 404, message: 'User not found' };
  const user = userResult.rows[0];

  // Attach role-specific data
  if (role === 'admin') {
    const tenant = await pool.query(
      'SELECT id, name, is_active, created_at FROM tenants WHERE id = $1',
      [tenantId]
    );
    const stats = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM users WHERE tenant_id = $1 AND role = 'teacher' AND is_active = TRUE)::int AS teachers,
         (SELECT COUNT(*) FROM users WHERE tenant_id = $1 AND role = 'student' AND is_active = TRUE)::int AS students,
         (SELECT COUNT(*) FROM batches WHERE tenant_id = $1)::int AS batches,
         (SELECT COUNT(*) FROM quizzes WHERE tenant_id = $1)::int AS quizzes`,
      [tenantId]
    );
    return { ...user, institution: tenant.rows[0], stats: stats.rows[0] };
  }

  if (role === 'teacher') {
    const subjects = await pool.query(
      `SELECT s.id, s.name, s.code, b.name AS batch_name, b.id AS batch_id
       FROM teaching_assignments ta
       JOIN subjects s ON s.id = ta.subject_id
       JOIN batches b ON b.id = ta.batch_id
       WHERE ta.teacher_id = $1`,
      [userId]
    );
    const quizCount = await pool.query(
      'SELECT COUNT(*)::int AS total FROM quizzes WHERE created_by = $1',
      [userId]
    );
    return { ...user, subjects: subjects.rows, quizCount: quizCount.rows[0].total };
  }

  if (role === 'student') {
    const batches = await pool.query(
      `SELECT b.id, b.name, b.academic_year
       FROM batch_enrollments be
       JOIN batches b ON b.id = be.batch_id
       WHERE be.user_id = $1`,
      [userId]
    );
    const attemptCount = await pool.query(
      `SELECT COUNT(*)::int AS total FROM quiz_sessions
       WHERE student_id = $1 AND status = 'completed'`,
      [userId]
    );
    return { ...user, batches: batches.rows, completedQuizzes: attemptCount.rows[0].total };
  }

  return user;
};

// ── UPDATE PROFILE ────────────────────────────────────────────────────────────
// Only name is editable by user themselves
// roll_no editable only by student (teacher/admin don't have roll_no)

const updateProfile = async (userId, role, { name, roll_no }) => {
  if (!name && roll_no === undefined)
    throw { status: 400, message: 'Nothing to update' };

  const updates = [];
  const params = [];

  if (name) {
    params.push(name.trim());
    updates.push(`name = $${params.length}`);
  }

  // Only students have roll_no
  if (roll_no !== undefined && role === 'student') {
    params.push(roll_no);
    updates.push(`roll_no = $${params.length}`);
  }

  params.push(userId);
  const r = await pool.query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $${params.length}
     RETURNING id, name, email, role, roll_no`,
    params
  );
  return r.rows[0];
};

// ── CHANGE PASSWORD ───────────────────────────────────────────────────────────
// Must verify current password first — no OTP needed here (already logged in)

const changePassword = async (userId, { currentPassword, newPassword }) => {
  if (!currentPassword || !newPassword)
    throw { status: 400, message: 'currentPassword and newPassword required' };

  if (newPassword.length < 8)
    throw { status: 400, message: 'New password must be at least 8 characters' };

  if (currentPassword === newPassword)
    throw { status: 400, message: 'New password must be different from current password' };

  const r = await pool.query(
    'SELECT password_hash FROM users WHERE id = $1',
    [userId]
  );
  if (!r.rows.length) throw { status: 404, message: 'User not found' };

  const valid = await bcrypt.compare(currentPassword, r.rows[0].password_hash);
  if (!valid) throw { status: 401, message: 'Current password is incorrect' };

  const hash = await bcrypt.hash(newPassword, 12);
  await pool.query(
    'UPDATE users SET password_hash = $1 WHERE id = $2',
    [hash, userId]
  );

  return { message: 'Password changed successfully' };
};

// ── MY QUIZ HISTORY (student) ─────────────────────────────────────────────────

const myQuizHistory = async (userId, tenantId, { page = 1, limit = 20 }) => {
  const offset = (page - 1) * limit;

  const [data, count] = await Promise.all([
    pool.query(
      `SELECT qs.id AS session_id, qs.status, qs.started_at, qs.submitted_at,
              qs.violation_count,
              q.id AS quiz_id, q.title, q.total_marks,
              s.name AS subject_name,
              r.scored_marks, r.percentage, r.grade, r.rank
       FROM quiz_sessions qs
       JOIN quizzes q ON q.id = qs.quiz_id
       JOIN subjects s ON s.id = q.subject_id
       LEFT JOIN results r ON r.session_id = qs.id
       WHERE qs.student_id = $1 AND q.tenant_id = $2
       ORDER BY qs.started_at DESC
       LIMIT $3 OFFSET $4`,
      [userId, tenantId, limit, offset]
    ),
    pool.query(
      `SELECT COUNT(*) FROM quiz_sessions qs
       JOIN quizzes q ON q.id = qs.quiz_id
       WHERE qs.student_id = $1 AND q.tenant_id = $2`,
      [userId, tenantId]
    ),
  ]);

  return {
    quizzes: data.rows,
    total: parseInt(count.rows[0].count),
    page: parseInt(page),
    totalPages: Math.ceil(count.rows[0].count / limit),
  };
};

// ── MY SUBJECTS (teacher) ─────────────────────────────────────────────────────

const mySubjects = async (userId) => {
  const r = await pool.query(
    `SELECT s.id, s.name, s.code,
            b.id AS batch_id, b.name AS batch_name,
            COUNT(DISTINCT q.id)::int AS question_count,
            COUNT(DISTINCT qz.id)::int AS quiz_count
     FROM teaching_assignments ta
     JOIN subjects s ON s.id = ta.subject_id
     JOIN batches b ON b.id = ta.batch_id
     LEFT JOIN questions q ON q.subject_id = s.id AND q.created_by = $1
     LEFT JOIN quizzes qz ON qz.subject_id = s.id AND qz.created_by = $1
     WHERE ta.teacher_id = $1
     GROUP BY s.id, s.name, s.code, b.id, b.name
     ORDER BY s.name`,
    [userId]
  );
  return r.rows;
};

// ── UPDATE INSTITUTION (admin only) ──────────────────────────────────────────

const updateInstitution = async (tenantId, { name }) => {
  if (!name) throw { status: 400, message: 'Institution name required' };

  const r = await pool.query(
    'UPDATE tenants SET name = $1 WHERE id = $2 RETURNING id, name',
    [name.trim(), tenantId]
  );
  if (!r.rows.length) throw { status: 404, message: 'Institution not found' };
  return r.rows[0];
};

module.exports = {
  getProfile, updateProfile, changePassword,
  myQuizHistory, mySubjects, updateInstitution,
};