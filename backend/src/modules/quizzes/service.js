const pool = require('../../config/db');

// ── HELPERS ───────────────────────────────────────────────────────────────────

const VALID_SHOW_ANSWERS = ['submission', 'never', 'quiz_end'];

const validateConfig = (config = {}) => {
  const defaults = {
    duration_mins: 30,
    shuffle_questions: false,
    shuffle_options: false,
    show_answers_after: 'submission',
    max_attempts: 1,
    negative_marking: 0,
    pass_percentage: 35,
  };

  const merged = { ...defaults, ...config };

  if (merged.duration_mins < 1 || merged.duration_mins > 360)
    throw { status: 400, message: 'duration_mins must be between 1 and 360' };
  if (merged.max_attempts < 1)
    throw { status: 400, message: 'max_attempts must be at least 1' };
  if (merged.negative_marking < 0 || merged.negative_marking > 1)
    throw { status: 400, message: 'negative_marking must be between 0 and 1' };
  if (merged.pass_percentage < 0 || merged.pass_percentage > 100)
    throw { status: 400, message: 'pass_percentage must be between 0 and 100' };
  if (!VALID_SHOW_ANSWERS.includes(merged.show_answers_after))
    throw { status: 400, message: `show_answers_after must be one of: ${VALID_SHOW_ANSWERS.join(', ')}` };

  return merged;
};

const verifyQuizOwnership = async (tenantId, userId, role, quizId) => {
  const r = await pool.query(
    'SELECT * FROM quizzes WHERE id = $1 AND tenant_id = $2',
    [quizId, tenantId]
  );
  if (!r.rows.length) throw { status: 404, message: 'Quiz not found' };

  const quiz = r.rows[0];
  if (role === 'teacher' && quiz.created_by !== userId)
    throw { status: 403, message: 'You do not own this quiz' };

  return quiz;
};

const recalcTotalMarks = async (quizId) => {
  await pool.query(
    `UPDATE quizzes SET total_marks = (
       SELECT COALESCE(SUM(marks), 0) FROM quiz_questions WHERE quiz_id = $1
     ) WHERE id = $1`,
    [quizId]
  );
};

// ── CREATE ────────────────────────────────────────────────────────────────────

const createQuiz = async (tenantId, userId, role, body) => {
  const { title, subjectId, batchId, config, starts_at, ends_at } = body;

  if (!title) throw { status: 400, message: 'Title is required' };
  if (!subjectId) throw { status: 400, message: 'subjectId is required' };
  if (!batchId) throw { status: 400, message: 'batchId is required' };

  // Verify subject belongs to tenant
  const subject = await pool.query(
    'SELECT id FROM subjects WHERE id = $1 AND tenant_id = $2',
    [subjectId, tenantId]
  );
  if (!subject.rows.length) throw { status: 404, message: 'Subject not found' };

  // Verify batch belongs to tenant
  const batch = await pool.query(
    'SELECT id FROM batches WHERE id = $1 AND tenant_id = $2',
    [batchId, tenantId]
  );
  if (!batch.rows.length) throw { status: 404, message: 'Batch not found' };

  // Teacher must be assigned to this subject
  if (role === 'teacher') {
    const assigned = await pool.query(
      `SELECT id FROM teaching_assignments
       WHERE teacher_id = $1 AND subject_id = $2 AND batch_id = $3`,
      [userId, subjectId, batchId]
    );
    if (!assigned.rows.length)
      throw { status: 403, message: 'You are not assigned to this subject and batch' };
  }

  const validConfig = validateConfig(config);

  if (starts_at && ends_at && new Date(starts_at) >= new Date(ends_at))
    throw { status: 400, message: 'starts_at must be before ends_at' };

  const r = await pool.query(
    `INSERT INTO quizzes
       (tenant_id, created_by, subject_id, batch_id, title, status, config, starts_at, ends_at)
     VALUES ($1,$2,$3,$4,$5,'draft',$6,$7,$8)
     RETURNING *`,
    [tenantId, userId, subjectId, batchId, title, validConfig,
     starts_at || null, ends_at || null]
  );
  return r.rows[0];
};

// ── LIST ──────────────────────────────────────────────────────────────────────

const listQuizzes = async (tenantId, userId, role, query) => {
  const { batchId, subjectId, status, page = 1, limit = 20 } = query;
  const conditions = ['q.tenant_id = $1'];
  const params = [tenantId];

  // Students only see published quizzes for their batches
  if (role === 'student') {
    params.push(userId);
    conditions.push(`q.batch_id IN (
      SELECT batch_id FROM batch_enrollments WHERE user_id = $${params.length}
    )`);
    conditions.push(`q.status = 'published'`);
  }

  // Teachers only see their own quizzes
  if (role === 'teacher') {
    params.push(userId);
    conditions.push(`q.created_by = $${params.length}`);
  }

  if (batchId) { params.push(batchId); conditions.push(`q.batch_id = $${params.length}`); }
  if (subjectId) { params.push(subjectId); conditions.push(`q.subject_id = $${params.length}`); }
  if (status && role !== 'student') { params.push(status); conditions.push(`q.status = $${params.length}`); }

  const where = conditions.join(' AND ');
  const offset = (page - 1) * limit;
  params.push(limit, offset);

  const data = await pool.query(
    `SELECT q.id, q.title, q.status, q.config, q.starts_at, q.ends_at,
            q.total_marks, q.created_at,
            s.name AS subject_name, b.name AS batch_name,
            u.name AS created_by_name,
            COUNT(qq.id)::int AS question_count
     FROM quizzes q
     JOIN subjects s ON s.id = q.subject_id
     JOIN batches b ON b.id = q.batch_id
     LEFT JOIN users u ON u.id = q.created_by
     LEFT JOIN quiz_questions qq ON qq.quiz_id = q.id
     WHERE ${where}
     GROUP BY q.id, s.name, b.name, u.name
     ORDER BY q.created_at DESC
     LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  const countData = await pool.query(
    `SELECT COUNT(*) FROM quizzes q WHERE ${where}`,
    params.slice(0, -2)
  );

  return {
    quizzes: data.rows,
    total: parseInt(countData.rows[0].count),
    page: parseInt(page),
    totalPages: Math.ceil(countData.rows[0].count / limit),
  };
};

// ── GET SINGLE ────────────────────────────────────────────────────────────────

const getQuiz = async (tenantId, userId, role, quizId) => {
  const r = await pool.query(
    `SELECT q.*, s.name AS subject_name, b.name AS batch_name, u.name AS created_by_name
     FROM quizzes q
     JOIN subjects s ON s.id = q.subject_id
     JOIN batches b ON b.id = q.batch_id
     LEFT JOIN users u ON u.id = q.created_by
     WHERE q.id = $1 AND q.tenant_id = $2`,
    [quizId, tenantId]
  );
  if (!r.rows.length) throw { status: 404, message: 'Quiz not found' };

  const quiz = r.rows[0];

  // Students can only see published quizzes they are enrolled for
  if (role === 'student') {
    if (quiz.status !== 'published')
      throw { status: 403, message: 'Quiz not available' };
    const enrolled = await pool.query(
      'SELECT id FROM batch_enrollments WHERE user_id = $1 AND batch_id = $2',
      [userId, quiz.batch_id]
    );
    if (!enrolled.rows.length)
      throw { status: 403, message: 'You are not enrolled in this batch' };
  }

  // Fetch questions — hide correct answers from students
  const questions = await pool.query(
    `SELECT qq.id AS quiz_question_id, qq.order_index, qq.marks,
            q.id, q.type, q.difficulty, q.content,
            CASE WHEN $1 = 'student' THEN NULL ELSE q.correct_answer END AS correct_answer
     FROM quiz_questions qq
     JOIN questions q ON q.id = qq.question_id
     WHERE qq.quiz_id = $2
     ORDER BY qq.order_index ASC`,
    [role, quizId]
  );

  return { ...quiz, questions: questions.rows };
};

// ── UPDATE ────────────────────────────────────────────────────────────────────

const updateQuiz = async (tenantId, userId, role, quizId, body) => {
  const quiz = await verifyQuizOwnership(tenantId, userId, role, quizId);

  if (quiz.status === 'published')
    throw { status: 400, message: 'Cannot edit a published quiz. Unpublish first.' };

  const { title, config, starts_at, ends_at } = body;

  let validConfig = quiz.config;
  if (config) validConfig = validateConfig({ ...quiz.config, ...config });

  if (starts_at && ends_at && new Date(starts_at) >= new Date(ends_at))
    throw { status: 400, message: 'starts_at must be before ends_at' };

  const r = await pool.query(
    `UPDATE quizzes
     SET title = COALESCE($1, title),
         config = $2,
         starts_at = COALESCE($3, starts_at),
         ends_at = COALESCE($4, ends_at)
     WHERE id = $5 AND tenant_id = $6
     RETURNING *`,
    [title || null, validConfig, starts_at || null, ends_at || null, quizId, tenantId]
  );
  return r.rows[0];
};

// ── DELETE ────────────────────────────────────────────────────────────────────

const deleteQuiz = async (tenantId, userId, role, quizId) => {
  const quiz = await verifyQuizOwnership(tenantId, userId, role, quizId);

  if (quiz.status !== 'draft')
    throw { status: 400, message: 'Only draft quizzes can be deleted' };

  // Check if any sessions exist
  const sessions = await pool.query(
    'SELECT id FROM quiz_sessions WHERE quiz_id = $1 LIMIT 1',
    [quizId]
  );
  if (sessions.rows.length)
    throw { status: 409, message: 'Quiz has attempts and cannot be deleted' };

  await pool.query('DELETE FROM quizzes WHERE id = $1', [quizId]);
  return { message: 'Quiz deleted' };
};

// ── ADD QUESTION ──────────────────────────────────────────────────────────────

const addQuestion = async (tenantId, userId, role, quizId, body) => {
  const { questionId, marks } = body;

  if (!questionId) throw { status: 400, message: 'questionId required' };
  if (!marks || marks < 0) throw { status: 400, message: 'marks required and must be positive' };

  const quiz = await verifyQuizOwnership(tenantId, userId, role, quizId);
  if (quiz.status === 'published')
    throw { status: 400, message: 'Cannot add questions to a published quiz' };

  // Verify question belongs to tenant
  const question = await pool.query(
    'SELECT * FROM questions WHERE id = $1 AND tenant_id = $2',
    [questionId, tenantId]
  );
  if (!question.rows.length) throw { status: 404, message: 'Question not found' };

  // Questions can be assigned to any quiz regardless of subject, as long as they belong to the same tenant
  // Teachers can choose to organize questions by subject or not

  // Get next order index
  const orderResult = await pool.query(
    'SELECT COALESCE(MAX(order_index), 0) + 1 AS next_order FROM quiz_questions WHERE quiz_id = $1',
    [quizId]
  );
  const orderIndex = orderResult.rows[0].next_order;

  const existingLink = await pool.query(
    'SELECT id FROM quiz_questions WHERE quiz_id = $1 AND question_id = $2',
    [quizId, questionId]
  );
  if (existingLink.rows.length)
    throw { status: 409, message: 'Question already in quiz' };

  const r = await pool.query(
    `INSERT INTO quiz_questions (quiz_id, question_id, marks, order_index)
     VALUES ($1,$2,$3,$4)
     RETURNING *`,
    [quizId, questionId, marks, orderIndex]
  );

  await recalcTotalMarks(quizId);
  return r.rows[0];
};

// ── REMOVE QUESTION ───────────────────────────────────────────────────────────

const removeQuestion = async (tenantId, userId, role, quizId, questionId) => {
  const quiz = await verifyQuizOwnership(tenantId, userId, role, quizId);

  if (quiz.status === 'published')
    throw { status: 400, message: 'Cannot remove questions from a published quiz' };

  const r = await pool.query(
    'DELETE FROM quiz_questions WHERE quiz_id = $1 AND question_id = $2 RETURNING id',
    [quizId, questionId]
  );
  if (!r.rows.length) throw { status: 404, message: 'Question not in this quiz' };

  await recalcTotalMarks(quizId);
  return { message: 'Question removed' };
};

// ── PUBLISH ───────────────────────────────────────────────────────────────────

const publishQuiz = async (tenantId, userId, role, quizId) => {
  const quiz = await verifyQuizOwnership(tenantId, userId, role, quizId);

  if (quiz.status === 'published')
    throw { status: 400, message: 'Quiz is already published' };

  // Must have at least 1 question
  const count = await pool.query(
    'SELECT COUNT(*) FROM quiz_questions WHERE quiz_id = $1',
    [quizId]
  );
  if (parseInt(count.rows[0].count) === 0)
    throw { status: 400, message: 'Cannot publish quiz with no questions' };

  const r = await pool.query(
    `UPDATE quizzes SET status = 'published' WHERE id = $1 RETURNING *`,
    [quizId]
  );
  return r.rows[0];
};

// ── UNPUBLISH ─────────────────────────────────────────────────────────────────

const unpublishQuiz = async (tenantId, userId, role, quizId) => {
  const quiz = await verifyQuizOwnership(tenantId, userId, role, quizId);

  if (quiz.status !== 'published')
    throw { status: 400, message: 'Quiz is not published' };

  // Do not allow unpublish if active sessions exist
  const activeSessions = await pool.query(
    `SELECT id FROM quiz_sessions WHERE quiz_id = $1 AND status = 'active' LIMIT 1`,
    [quizId]
  );
  if (activeSessions.rows.length)
    throw { status: 409, message: 'Cannot unpublish — students are currently attempting this quiz' };

  const r = await pool.query(
    `UPDATE quizzes SET status = 'draft' WHERE id = $1 RETURNING *`,
    [quizId]
  );
  return r.rows[0];
};

module.exports = {
  createQuiz, listQuizzes, getQuiz, updateQuiz, deleteQuiz,
  addQuestion, removeQuestion, publishQuiz, unpublishQuiz,
};