const pool = require('../../config/db');
const redis = require('../../config/redis');

// ── HELPERS ───────────────────────────────────────────────────────────────────

const shuffleArray = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const getGrade = (percentage) => {
  if (percentage >= 90) return 'A+';
  if (percentage >= 75) return 'A';
  if (percentage >= 60) return 'B';
  if (percentage >= 45) return 'C';
  if (percentage >= 35) return 'D';
  return 'F';
};

const TIMER_PREFIX = 'quiz_timer:';
const TIMER_TTL_BUFFER = 300; // 5 min buffer after quiz ends

// ── START SESSION ─────────────────────────────────────────────────────────────

const startSession = async (tenantId, userId, quizId, ipAddress) => {
  // 1. Fetch quiz
  const quizResult = await pool.query(
    `SELECT q.*, s.name AS subject_name
     FROM quizzes q
     JOIN subjects s ON s.id = q.subject_id
     WHERE q.id = $1 AND q.tenant_id = $2 AND q.status = 'published'`,
    [quizId, tenantId]
  );
  if (!quizResult.rows.length)
    throw { status: 404, message: 'Quiz not found or not published' };

  const quiz = quizResult.rows[0];

  // 2. Check student is enrolled in the batch
  const enrolled = await pool.query(
    'SELECT id FROM batch_enrollments WHERE user_id = $1 AND batch_id = $2',
    [userId, quiz.batch_id]
  );
  if (!enrolled.rows.length)
    throw { status: 403, message: 'You are not enrolled in this batch' };

  // 3. Check quiz window
  const now = new Date();
  if (quiz.starts_at && new Date(quiz.starts_at) > now)
    throw { status: 400, message: 'Quiz has not started yet' };
  if (quiz.ends_at && new Date(quiz.ends_at) < now)
    throw { status: 400, message: 'Quiz window has closed' };

  // 4. Check max attempts
  const attemptCount = await pool.query(
    `SELECT COUNT(*) FROM quiz_sessions
     WHERE quiz_id = $1 AND student_id = $2 AND status != 'abandoned'`,
    [quizId, userId]
  );
  const maxAttempts = quiz.config?.max_attempts || 1;
  if (parseInt(attemptCount.rows[0].count) >= maxAttempts)
    throw { status: 400, message: `Maximum attempts (${maxAttempts}) reached` };

  // 5. Check no active session already running
  const activeSession = await pool.query(
    `SELECT id FROM quiz_sessions
     WHERE quiz_id = $1 AND student_id = $2 AND status = 'active'`,
    [quizId, userId]
  );
  if (activeSession.rows.length)
    throw { status: 409, message: 'You already have an active session for this quiz', sessionId: activeSession.rows[0].id };

  // 6. Fetch questions
  const questionsResult = await pool.query(
    `SELECT qq.question_id, qq.marks, qq.order_index,
            q.type, q.content
     FROM quiz_questions qq
     JOIN questions q ON q.id = qq.question_id
     WHERE qq.quiz_id = $1
     ORDER BY qq.order_index ASC`,
    [quizId]
  );
  if (!questionsResult.rows.length)
    throw { status: 400, message: 'Quiz has no questions' };

  // 7. Build shuffled order
  let questionOrder = questionsResult.rows.map(q => q.question_id);
  if (quiz.config?.shuffle_questions) {
    questionOrder = shuffleArray(questionOrder);
  }

  // Shuffle options per question if needed
  const questionsMap = {};
  for (const q of questionsResult.rows) {
    let content = q.content;
    if (quiz.config?.shuffle_options && ['mcq_single', 'mcq_multiple'].includes(q.type)) {
      content = { ...q.content, options: shuffleArray(q.content.options) };
    }
    questionsMap[q.question_id] = { ...q, content };
  }

  // 8. Create session
  const sessionResult = await pool.query(
    `INSERT INTO quiz_sessions
       (quiz_id, student_id, start_time, status, shuffled_order, ip_address)
     VALUES ($1,$2,NOW(),'active',$3,$4)
     RETURNING *`,
    [quizId, userId, JSON.stringify(questionOrder), ipAddress || null]
  );
  const session = sessionResult.rows[0];

  // 9. Store timer in Redis
  const durationSeconds = (quiz.config?.duration_mins || 30) * 60;
  const expiresAt = Date.now() + durationSeconds * 1000;
  await redis.setEx(
    `${TIMER_PREFIX}${session.id}`,
    durationSeconds + TIMER_TTL_BUFFER,
    String(expiresAt)
  );

  // 10. Return session with ordered questions (no correct answers)
  const orderedQuestions = questionOrder.map((qId, idx) => ({
    index: idx + 1,
    questionId: qId,
    type: questionsMap[qId].type,
    content: questionsMap[qId].content,
    marks: questionsMap[qId].marks,
  }));

  return {
    sessionId: session.id,
    quizTitle: quiz.title,
    durationSeconds,
    expiresAt,
    totalQuestions: orderedQuestions.length,
    totalMarks: quiz.total_marks,
    questions: orderedQuestions,
  };
};

// ── SAVE ANSWER ───────────────────────────────────────────────────────────────

const saveAnswer = async (userId, sessionId, { questionId, answer }) => {
  if (!questionId || answer === undefined)
    throw { status: 400, message: 'questionId and answer required' };

  // Verify session belongs to student and is active
  const session = await pool.query(
    `SELECT qs.*, q.config, q.subject_id
     FROM quiz_sessions qs
     JOIN quizzes q ON q.id = qs.quiz_id
     WHERE qs.id = $1 AND qs.student_id = $2 AND qs.status = 'active'`,
    [sessionId, userId]
  );
  if (!session.rows.length)
    throw { status: 404, message: 'Active session not found' };

  // Check timer not expired
  const timerVal = await redis.get(`${TIMER_PREFIX}${sessionId}`);
  if (!timerVal || Date.now() > parseInt(timerVal))
    throw { status: 400, message: 'Session has expired' };

  // Verify question is in this quiz
  const questionInQuiz = await pool.query(
    `SELECT qq.marks, q.type, q.correct_answer
     FROM quiz_questions qq
     JOIN questions q ON q.id = qq.question_id
     WHERE qq.quiz_id = $1 AND qq.question_id = $2`,
    [session.rows[0].quiz_id, questionId]
  );
  if (!questionInQuiz.rows.length)
    throw { status: 400, message: 'Question does not belong to this quiz' };

  // Replace any prior answer for the same question since the table has no unique constraint
  await pool.query('DELETE FROM session_answers WHERE session_id = $1 AND question_id = $2', [sessionId, questionId]);
  await pool.query(
    `INSERT INTO session_answers (session_id, question_id, answer)
     VALUES ($1,$2,$3)`,
    [sessionId, questionId, JSON.stringify(answer)]
  );

  return { message: 'Answer saved' };
};

// ── LOG VIOLATION ─────────────────────────────────────────────────────────────

const logViolation = async (userId, sessionId, { type }) => {
  const VALID_VIOLATIONS = ['tab_switch', 'fullscreen_exit', 'window_blur'];

  if (!VALID_VIOLATIONS.includes(type))
    throw { status: 400, message: `Invalid violation type. Must be: ${VALID_VIOLATIONS.join(', ')}` };

  const session = await pool.query(
    `SELECT id FROM quiz_sessions WHERE id = $1 AND student_id = $2 AND status = 'active'`,
    [sessionId, userId]
  );
  if (!session.rows.length)
    throw { status: 404, message: 'Active session not found' };

  // Insert violation
  await pool.query(
    `INSERT INTO violations (session_id, type) VALUES ($1,$2)`,
    [sessionId, type]
  );

  // Increment violation count on session
  await pool.query(
    `UPDATE quiz_sessions SET violation_count = violation_count + 1 WHERE id = $1`,
    [sessionId]
  );

  // Get total violations for this session
  const countResult = await pool.query(
    `SELECT violation_count FROM quiz_sessions WHERE id = $1`,
    [sessionId]
  );

  return {
    message: 'Violation logged',
    totalViolations: countResult.rows[0].violation_count,
  };
};

// ── SCORE ENGINE ──────────────────────────────────────────────────────────────

const scoreSession = async (sessionId, quizId, userId, tenantId) => {
  // Fetch all quiz questions with correct answers
  const questionsResult = await pool.query(
    `SELECT qq.question_id, qq.marks,
            q.type, q.correct_answer
     FROM quiz_questions qq
     JOIN questions q ON q.id = qq.question_id
     WHERE qq.quiz_id = $1`,
    [quizId]
  );

  // Fetch all student answers
  const answersResult = await pool.query(
    `SELECT question_id, answer FROM session_answers WHERE session_id = $1`,
    [sessionId]
  );

  const answersMap = {};
  for (const a of answersResult.rows) {
    answersMap[a.question_id] = a.answer;
  }

  let scoredMarks = 0;
  const answerUpdates = [];

  for (const q of questionsResult.rows) {
    const studentAnswer = answersMap[q.question_id];
    let isCorrect = false;
    let marksAwarded = 0;

    if (studentAnswer !== undefined) {
      isCorrect = checkAnswer(q.type, q.correct_answer, studentAnswer);

      if (isCorrect) {
        marksAwarded = q.marks;
        scoredMarks += q.marks;
      }
    }

    answerUpdates.push({ questionId: q.question_id, isCorrect, marksAwarded });
  }

  // Fetch quiz total marks
  const quizResult = await pool.query(
    'SELECT total_marks FROM quizzes WHERE id = $1',
    [quizId]
  );
  const totalMarks = parseFloat(quizResult.rows[0].total_marks);
  const percentage = totalMarks > 0 ? (scoredMarks / totalMarks) * 100 : 0;
  const grade = getGrade(percentage);

  // Update all session_answers with scores in one transaction
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    for (const update of answerUpdates) {
      await client.query(
        `UPDATE session_answers
         SET is_correct = $1, marks_awarded = $2
         WHERE session_id = $3 AND question_id = $4`,
        [update.isCorrect, update.marksAwarded, sessionId, update.questionId]
      );
    }

    // Compute rank — how many students scored higher on this quiz
    const rankResult = await client.query(
      `SELECT COUNT(*) FROM results
       WHERE quiz_id = $1 AND scored_marks > $2`,
      [quizId, scoredMarks]
    );
    const rank = parseInt(rankResult.rows[0].count) + 1;

    // Insert result
    const resultRow = await client.query(
      `INSERT INTO results
         (session_id, quiz_id, user_id, tenant_id, total_marks, scored_marks,
          percentage, rank, grade, topic_breakdown)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       RETURNING *`,
      [sessionId, quizId, userId, tenantId,
       totalMarks, scoredMarks, percentage.toFixed(2),
       rank, grade, JSON.stringify({})]
    );

    // Update all previous ranks (shift everyone down by 1 if needed)
    await client.query(
      `UPDATE results SET rank = rank + 1
       WHERE quiz_id = $1 AND session_id != $2 AND scored_marks <= $3`,
      [quizId, sessionId, scoredMarks]
    );

    await client.query('COMMIT');
    return resultRow.rows[0];
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
};

// ── CHECK ANSWER ──────────────────────────────────────────────────────────────

const checkAnswer = (type, correctAnswer, studentAnswer) => {
  switch (type) {
    case 'mcq_single':
      return Number(studentAnswer) === Number(correctAnswer.index);

    case 'mcq_multiple': {
      const correct = [...correctAnswer.indices].map(Number).sort().join(',');
      const student = [...(Array.isArray(studentAnswer) ? studentAnswer : [studentAnswer])]
        .map(Number).sort().join(',');
      return correct === student;
    }

    case 'integer':
      return Number(studentAnswer) === Number(correctAnswer.value);

    case 'fill_blank':
      return String(studentAnswer).trim().toLowerCase() ===
             String(correctAnswer.value).trim().toLowerCase();

    case 'true_false':
      return String(studentAnswer).toLowerCase() === String(correctAnswer.value).toLowerCase();

    default:
      return false;
  }
};

// ── SUBMIT SESSION ────────────────────────────────────────────────────────────

const submitSession = async (tenantId, userId, sessionId) => {
  const session = await pool.query(
    `SELECT qs.*, q.config
     FROM quiz_sessions qs
     JOIN quizzes q ON q.id = qs.quiz_id
     WHERE qs.id = $1 AND qs.student_id = $2 AND qs.status = 'active'`,
    [sessionId, userId]
  );
  if (!session.rows.length)
    throw { status: 404, message: 'Active session not found' };

  const s = session.rows[0];

  // Mark session as completed
  await pool.query(
    `UPDATE quiz_sessions
     SET status = 'completed', end_time = NOW()
     WHERE id = $1`,
    [sessionId]
  );

  // Clean up Redis timer
  await redis.del(`${TIMER_PREFIX}${sessionId}`);

  // Score it
  const result = await scoreSession(sessionId, s.quiz_id, userId, tenantId);

  // Decide what to return based on show_answers_after config
  const showAnswers = s.config?.show_answers_after || 'submission';

  return {
    message: 'Quiz submitted successfully',
    result: {
      scoredMarks: result.scored_marks,
      totalMarks: result.total_marks,
      percentage: result.percentage,
      grade: result.grade,
      rank: result.rank,
      topicBreakdown: result.topic_breakdown,
    },
    showAnswers: showAnswers === 'submission',
  };
};

// ── GET SESSION STATUS (for reconnect/resume) ─────────────────────────────────

const getSessionStatus = async (userId, sessionId) => {
  const session = await pool.query(
    `SELECT qs.id, qs.status, qs.start_time, qs.shuffled_order,
            qs.violation_count, qs.quiz_id,
            q.config, q.title
     FROM quiz_sessions qs
     JOIN quizzes q ON q.id = qs.quiz_id
     WHERE qs.id = $1 AND qs.student_id = $2`,
    [sessionId, userId]
  );
  if (!session.rows.length)
    throw { status: 404, message: 'Session not found' };

  const s = session.rows[0];

  // Get remaining time from Redis
  let remainingSeconds = null;
  if (s.status === 'active') {
    const timerVal = await redis.get(`${TIMER_PREFIX}${sessionId}`);
    if (timerVal) {
      remainingSeconds = Math.max(0, Math.floor((parseInt(timerVal) - Date.now()) / 1000));
      // Auto-submit if timer expired
      if (remainingSeconds === 0) {
        await pool.query(
          `UPDATE quiz_sessions SET status = 'completed', end_time = NOW() WHERE id = $1`,
          [sessionId]
        );
        await scoreSession(sessionId, s.quiz_id, userId, null);
        return { sessionId, status: 'completed', message: 'Session auto-submitted due to timeout' };
      }
    }
  }

  // Get already saved answers
  const answers = await pool.query(
    `SELECT question_id, answer FROM session_answers WHERE session_id = $1`,
    [sessionId]
  );

  return {
    sessionId,
    status: s.status,
    quizTitle: s.title,
    remainingSeconds,
    violationCount: s.violation_count,
    savedAnswers: answers.rows,
  };
};

// ── GET QUIZ RESULTS (teacher/admin) ──────────────────────────────────────────

const getQuizResults = async (tenantId, userId, role, quizId) => {
  // Verify quiz belongs to tenant
  const quiz = await pool.query(
    'SELECT * FROM quizzes WHERE id = $1 AND tenant_id = $2',
    [quizId, tenantId]
  );
  if (!quiz.rows.length) throw { status: 404, message: 'Quiz not found' };

  if (role === 'teacher' && quiz.rows[0].created_by !== userId)
    throw { status: 403, message: 'You do not own this quiz' };

  const results = await pool.query(
    `SELECT r.id, r.scored_marks, r.total_marks, r.percentage, r.grade,
            r.rank, r.topic_breakdown, r.computed_at,
            u.name AS student_name, u.email, u.roll_no,
            qs.violation_count, qs.start_time, qs.end_time,
            qs.id AS session_id
     FROM results r
     JOIN users u ON u.id = r.user_id
     JOIN quiz_sessions qs ON qs.id = r.session_id
     WHERE r.quiz_id = $1 AND r.tenant_id = $2
     ORDER BY r.rank ASC`,
    [quizId, tenantId]
  );

  // Summary stats
  const stats = await pool.query(
    `SELECT
       COUNT(*)::int AS total_attempts,
       ROUND(AVG(percentage)::numeric, 2) AS avg_percentage,
       MAX(scored_marks) AS highest_marks,
       MIN(scored_marks) AS lowest_marks,
       COUNT(CASE WHEN percentage >= (
         SELECT (config->>'pass_percentage')::int FROM quizzes WHERE id = $1
       ) THEN 1 END)::int AS passed
     FROM results WHERE quiz_id = $1`,
    [quizId]
  );

  return {
    quiz: quiz.rows[0],
    summary: stats.rows[0],
    results: results.rows,
  };
};

// ── GET SESSION REVIEW (student sees their own answers after submission) ───────

const getSessionReview = async (tenantId, userId, role, sessionId) => {
  const session = await pool.query(
    `SELECT qs.*, q.config, q.title, q.total_marks
     FROM quiz_sessions qs
     JOIN quizzes q ON q.id = qs.quiz_id
     WHERE qs.id = $1`,
    [sessionId]
  );
  if (!session.rows.length) throw { status: 404, message: 'Session not found' };

  const s = session.rows[0];

  // Students can only review their own session
  if (role === 'student' && s.student_id !== userId)
    throw { status: 403, message: 'Forbidden' };

  // Check show_answers_after config for students
  if (role === 'student') {
    const showAfter = s.config?.show_answers_after || 'submission';
    if (showAfter === 'never')
      throw { status: 403, message: 'Answers are not available for this quiz' };
    if (s.status !== 'completed')
      throw { status: 400, message: 'Quiz not yet submitted' };
  }

  const answers = await pool.query(
      `SELECT sa.question_id, sa.answer, sa.is_correct, sa.marks_awarded,
        q.type, q.content, q.correct_answer,
        qq.marks AS max_marks
     FROM session_answers sa
     JOIN questions q ON q.id = sa.question_id
     JOIN quiz_questions qq ON qq.question_id = sa.question_id AND qq.quiz_id = $1
     WHERE sa.session_id = $2
     ORDER BY qq.order_index ASC`,
    [s.quiz_id, sessionId]
  );

  const result = await pool.query(
    'SELECT * FROM results WHERE session_id = $1',
    [sessionId]
  );

  const violations = await pool.query(
    `SELECT type, COUNT(*)::int AS count
     FROM violations WHERE session_id = $1
     GROUP BY type`,
    [sessionId]
  );

  return {
    session: {
      id: s.id,
      status: s.status,
      startedAt: s.start_time,
      submittedAt: s.end_time,
      violationCount: s.violation_count,
    },
    result: result.rows[0] || null,
    violations: violations.rows,
    answers: answers.rows,
  };
};

module.exports = {
  startSession,
  saveAnswer,
  logViolation,
  submitSession,
  getSessionStatus,
  getQuizResults,
  getSessionReview,
};