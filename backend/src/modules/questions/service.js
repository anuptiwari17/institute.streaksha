const pool = require('../../config/db');
const { parse } = require('csv-parse/sync');

// ── VALIDATION ────────────────────────────────────────────────────────────────

const VALID_TYPES = ['mcq_single', 'mcq_multiple', 'integer', 'fill_blank', 'true_false'];

const buildAndValidate = (type, rawContent, rawAnswer) => {
  switch (type) {
    case 'mcq_single': {
      const { text, options } = rawContent;
      if (!text) throw { status: 400, message: 'MCQ: text required' };
      if (!Array.isArray(options) || options.length < 2)
        throw { status: 400, message: 'MCQ: at least 2 options required' };
      if (rawAnswer.index === undefined || rawAnswer.index < 0 || rawAnswer.index >= options.length)
        throw { status: 400, message: 'MCQ: valid correct index required' };
      return {
        content: { text, options },
        correct_answer: { index: rawAnswer.index },
      };
    }
    case 'mcq_multiple': {
      const { text, options } = rawContent;
      if (!text) throw { status: 400, message: 'MCQ Multiple: text required' };
      if (!Array.isArray(options) || options.length < 2)
        throw { status: 400, message: 'MCQ Multiple: at least 2 options required' };
      if (!Array.isArray(rawAnswer.indices) || rawAnswer.indices.length === 0)
        throw { status: 400, message: 'MCQ Multiple: correct indices array required' };
      return {
        content: { text, options },
        correct_answer: { indices: rawAnswer.indices },
      };
    }
    case 'integer': {
      if (!rawContent.text) throw { status: 400, message: 'Integer: text required' };
      if (rawAnswer.value === undefined || isNaN(Number(rawAnswer.value)))
        throw { status: 400, message: 'Integer: numeric answer required' };
      return {
        content: { text: rawContent.text },
        correct_answer: { value: Number(rawAnswer.value) },
      };
    }
    case 'fill_blank': {
      if (!rawContent.text) throw { status: 400, message: 'Fill blank: text required' };
      if (!rawContent.text.includes('___'))
        throw { status: 400, message: 'Fill blank: text must contain ___' };
      if (!rawAnswer.value && rawAnswer.value !== 0)
        throw { status: 400, message: 'Fill blank: answer value required' };
      return {
        content: { text: rawContent.text },
        correct_answer: { value: String(rawAnswer.value).trim().toLowerCase() },
      };
    }
    case 'true_false': {
      if (!rawContent.text) throw { status: 400, message: 'True/False: text required' };
      if (rawAnswer.value === undefined || typeof rawAnswer.value !== 'boolean')
        throw { status: 400, message: 'True/False: answer must be boolean true or false' };
      return {
        content: { text: rawContent.text },
        correct_answer: { value: rawAnswer.value },
      };
    }
    default:
      throw { status: 400, message: `Invalid question type: ${type}` };
  }
};

// ── VERIFY TEACHER OWNS SUBJECT ───────────────────────────────────────────────

const verifySubjectAccess = async (tenantId, userId, role, subjectId) => {
  if (role === 'admin') {
    const r = await pool.query(
      'SELECT id FROM subjects WHERE id = $1 AND tenant_id = $2',
      [subjectId, tenantId]
    );
    if (!r.rows.length) throw { status: 404, message: 'Subject not found' };
    return;
  }
  // Teacher must be assigned to this subject
  const r = await pool.query(
    `SELECT ta.id FROM teaching_assignments ta
     JOIN subjects s ON s.id = ta.subject_id
     WHERE ta.teacher_id = $1 AND ta.subject_id = $2 AND s.tenant_id = $3`,
    [userId, subjectId, tenantId]
  );
  if (!r.rows.length)
    throw { status: 403, message: 'You are not assigned to this subject' };
};

// ── GET SUBJECT BY NAME ───────────────────────────────────────────────────────

const getSubjectByName = async (tenantId, name) => {
  const r = await pool.query(
    'SELECT id FROM subjects WHERE tenant_id = $1 AND LOWER(name) = LOWER($2)',
    [tenantId, name]
  );
  return r.rows[0] || null;
};

// ── CREATE ────────────────────────────────────────────────────────────────────

const createQuestion = async (tenantId, userId, role, body) => {
  // Type, content, and correct_answer are REQUIRED
  // Subject is OPTIONAL - teachers can create questions without being assigned a subject
  const { type, content, correct_answer, subjectId } = body;

  if (!type || !content || correct_answer === undefined)
    throw { status: 400, message: 'type, content, and correct_answer are required' };

  if (!VALID_TYPES.includes(type))
    throw { status: 400, message: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` };

  // Validate the structure of content and correct_answer
  const { content: validContent, correct_answer: validAnswer } = buildAndValidate(type, content, correct_answer);

  // If subjectId provided, verify access
  if (subjectId) {
    if (role === 'teacher') {
      const r = await pool.query(
        `SELECT ta.id FROM teaching_assignments ta
         WHERE ta.teacher_id = $1 AND ta.subject_id = $2`,
        [userId, subjectId]
      );
      if (!r.rows.length)
        throw { status: 403, message: 'You are not assigned to this subject' };
    } else {
      // Admin can create for any subject
      const r = await pool.query(
        'SELECT id FROM subjects WHERE id = $1 AND tenant_id = $2',
        [subjectId, tenantId]
      );
      if (!r.rows.length)
        throw { status: 404, message: 'Subject not found' };
    }
  }

  // Insert question - subject_id can be NULL
  const r = await pool.query(
    `INSERT INTO questions (tenant_id, subject_id, created_by, type, difficulty, content, correct_answer)
     VALUES ($1, $2, $3, $4, NULL, $5, $6) RETURNING *`,
    [tenantId, subjectId || null, userId, type, validContent, validAnswer]
  );
  return r.rows[0];
};

// ── LIST ──────────────────────────────────────────────────────────────────────

const listQuestions = async (tenantId, userId, role, { subjectId, type, page = 1, limit = 20 }) => {
  const conditions = ['q.tenant_id = $1'];
  const params = [tenantId];

  // If teacher filters by subjectId, verify they are assigned to that subject
  if (role === 'teacher' && subjectId) {
    const access = await pool.query(
      `SELECT ta.id FROM teaching_assignments ta
       WHERE ta.teacher_id = $1 AND ta.subject_id = $2`,
      [userId, subjectId]
    );
    if (!access.rows.length)
      throw { status: 403, message: 'You are not assigned to this subject' };
  }

  // Apply filters
  if (subjectId) { params.push(subjectId); conditions.push(`q.subject_id = $${params.length}`); }
  if (type) { params.push(type); conditions.push(`q.type = $${params.length}`); }

  const where = conditions.join(' AND ');
  const offset = (page - 1) * limit;

  params.push(limit, offset);
  const query = `
    SELECT q.id, q.subject_id, q.type, q.content, q.correct_answer, q.created_at,
           s.name AS subject_name, u.name AS created_by_name
    FROM questions q
    LEFT JOIN subjects s ON s.id = q.subject_id
    LEFT JOIN users u ON u.id = q.created_by
    WHERE ${where}
    ORDER BY q.created_at DESC
    LIMIT $${params.length - 1} OFFSET $${params.length}
  `;

  const countQuery = `SELECT COUNT(*) FROM questions q WHERE ${where}`;
  const countParams = params.slice(0, -2);

  const [data, count] = await Promise.all([
    pool.query(query, params),
    pool.query(countQuery, countParams),
  ]);

  return {
    questions: data.rows,
    total: parseInt(count.rows[0].count),
    page: parseInt(page),
    totalPages: Math.ceil(count.rows[0].count / limit),
  };
};

// ── UPDATE ────────────────────────────────────────────────────────────────────

const updateQuestion = async (tenantId, userId, role, questionId, body) => {
  const existing = await pool.query(
    'SELECT * FROM questions WHERE id = $1 AND tenant_id = $2',
    [questionId, tenantId]
  );
  if (!existing.rows.length) throw { status: 404, message: 'Question not found' };

  const q = existing.rows[0];

  // Only allow update by creator or admin
  if (role === 'teacher' && q.created_by !== userId)
    throw { status: 403, message: 'You can only edit questions you created' };

  const { content, correct_answer } = body;
  const type = q.type; // type cannot be changed after creation

  let validContent = q.content;
  let validAnswer = q.correct_answer;

  // If updating content or answer, validate them
  if (content || correct_answer !== undefined) {
    const result = buildAndValidate(
      type,
      content || q.content,
      correct_answer !== undefined ? correct_answer : q.correct_answer
    );
    validContent = result.content;
    validAnswer = result.correct_answer;
  }

  const r = await pool.query(
    `UPDATE questions
     SET content = $1, correct_answer = $2
     WHERE id = $3 AND tenant_id = $4
     RETURNING *`,
    [validContent, validAnswer, questionId, tenantId]
  );
  return r.rows[0];
};

// ── DELETE ────────────────────────────────────────────────────────────────────

const deleteQuestion = async (tenantId, userId, role, questionId) => {
  const existing = await pool.query(
    'SELECT * FROM questions WHERE id = $1 AND tenant_id = $2',
    [questionId, tenantId]
  );
  if (!existing.rows.length) throw { status: 404, message: 'Question not found' };

  // Only allow delete by creator or admin
  if (role === 'teacher' && existing.rows[0].created_by !== userId)
    throw { status: 403, message: 'You can only delete questions you created' };

  // Check if question is used in any quiz
  const inUse = await pool.query(
    'SELECT id FROM quiz_questions WHERE question_id = $1 LIMIT 1',
    [questionId]
  );
  if (inUse.rows.length)
    throw { status: 409, message: 'Question is used in a quiz and cannot be deleted' };

  await pool.query('DELETE FROM questions WHERE id = $1', [questionId]);
  return { message: 'Question deleted' };
};

// ── BULK IMPORT ───────────────────────────────────────────────────────────────

const bulkImport = async (tenantId, userId, role, fileBuffer) => {
  const records = parse(fileBuffer, { columns: true, skip_empty_lines: true, trim: true });
  const results = { success: 0, failed: [] };

  for (const [i, row] of records.entries()) {
    const rowNum = i + 2; // 1-indexed + header row
    try {
      const { type, subject_name, difficulty, text,
              option_a, option_b, option_c, option_d,
              correct_index, correct_indices, correct_value } = row;

      if (!type || !subject_name || !text)
        throw new Error('type, subject_name, text are required');

      if (!VALID_TYPES.includes(type))
        throw new Error(`Invalid type: ${type}`);

      const subject = await getSubjectByName(tenantId, subject_name);
      if (!subject) throw new Error(`Subject "${subject_name}" not found`);

      await verifySubjectAccess(tenantId, userId, role, subject.id);

      // Build content + answer from flat CSV columns
      let content, correct_answer;

      if (type === 'mcq_single') {
        const options = [option_a, option_b, option_c, option_d].filter(Boolean);
        if (options.length < 2) throw new Error('MCQ needs at least 2 options');
        content = { text, options };
        correct_answer = { index: parseInt(correct_index) };
      } else if (type === 'mcq_multiple') {
        const options = [option_a, option_b, option_c, option_d].filter(Boolean);
        if (options.length < 2) throw new Error('MCQ Multiple needs at least 2 options');
        const indices = String(correct_indices).split('|').map(Number);
        content = { text, options };
        correct_answer = { indices };
      } else if (type === 'integer') {
        content = { text };
        correct_answer = { value: Number(correct_value) };
      } else if (type === 'fill_blank') {
        content = { text };
        correct_answer = { value: String(correct_value) };
      } else if (type === 'true_false') {
        content = { text };
        correct_answer = { value: correct_value.toLowerCase() === 'true' };
      }

      const { content: validContent, correct_answer: validAnswer } =
        buildAndValidate(type, content, correct_answer);

      await pool.query(
        `INSERT INTO questions (tenant_id, subject_id, created_by, type, difficulty, content, correct_answer)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [tenantId, subject.id, userId, type, parseInt(difficulty) || 3, validContent, validAnswer]
      );

      results.success++;
    } catch (err) {
      results.failed.push({ row: rowNum, reason: err.message });
    }
  }

  return results;
};

module.exports = { createQuestion, listQuestions, updateQuestion, deleteQuestion, bulkImport };