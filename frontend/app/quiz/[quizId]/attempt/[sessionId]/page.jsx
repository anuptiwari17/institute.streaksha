'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, CheckCircle2, Clock3, Loader2, PauseCircle, ShieldAlert, ShieldCheck, SkipForward, SquarePen } from 'lucide-react';

function formatClock(seconds) {
  const total = Math.max(0, Number(seconds || 0));
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

function normalizeContent(content) {
  if (!content) return { text: '', options: [] };
  if (typeof content === 'string') return { text: content, options: [] };
  return {
    text: content.text || content.question || '',
    options: Array.isArray(content.options) ? content.options : [],
  };
}

export default function QuizAttemptPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.quizId;
  const sessionId = params.sessionId;
  const mountedRef = useRef(false);
  const timerRef = useRef(null);

  const [quiz, setQuiz] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [answers, setAnswers] = useState({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [remainingSeconds, setRemainingSeconds] = useState(null);
  const [violations, setViolations] = useState(0);

  const questions = quiz?.questions || [];
  const currentQuestion = questions[currentIndex] || null;

  useEffect(() => {
    const stored = sessionStorage.getItem(`quiz-session:${sessionId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        if (parsed?.expiresAt) {
          const sec = Math.max(0, Math.floor((parsed.expiresAt - Date.now()) / 1000));
          setRemainingSeconds(sec);
        }
      } catch {
        // ignore stored payload parsing issues
      }
    }
  }, [sessionId]);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setError('');
        const [quizRes, statusRes] = await Promise.all([
          api.get(`/quizzes/${quizId}`),
          api.get(`/sessions/${sessionId}/status`),
        ]);
        if (!active) return;

        const quizData = quizRes.data?.data || null;
        const statusData = statusRes.data?.data || null;

        setQuiz(quizData);
        setStatus(statusData);
        setViolations(statusData?.violationCount || 0);

        const saved = {};
        for (const answer of statusData?.savedAnswers || []) {
          saved[answer.question_id] = answer.answer;
        }
        setAnswers(saved);

        if (statusData?.remainingSeconds != null) {
          setRemainingSeconds(statusData.remainingSeconds);
        }

        const savedQuestionIndex = quizData?.questions?.findIndex((question) => saved[question.id] != null);
        if (savedQuestionIndex >= 0) setCurrentIndex(savedQuestionIndex);
      } catch (err) {
        if (active) setError(err.response?.data?.message || 'Failed to load quiz attempt');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [quizId, sessionId]);

  useEffect(() => {
    if (remainingSeconds == null) return undefined;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setRemainingSeconds((value) => {
        if (value == null) return value;
        if (value <= 1) {
          clearInterval(timerRef.current);
          timerRef.current = null;
          handleSubmit(true);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [remainingSeconds]);

  useEffect(() => {
    if (!mountedRef.current && quiz?.questions?.length) {
      mountedRef.current = true;
      const root = document.documentElement;
      if (root.requestFullscreen) {
        root.requestFullscreen().catch(() => {
          setWarning('Fullscreen was not granted. Please enter fullscreen to continue securely.');
        });
      }
    }
  }, [quiz]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) handleViolation('tab_switch');
    };
    const onBlur = () => handleViolation('window_blur');
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) handleViolation('fullscreen_exit');
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('fullscreenchange', onFullscreenChange);
    };
  }, []);

  const handleViolation = async (type) => {
    setWarning('Quiz security rule triggered. Stay in fullscreen and on this page.');
    setViolations((value) => value + 1);
    try {
      await api.post(`/sessions/${sessionId}/violation`, { type });
    } catch {
      // keep UI warning even if logging fails
    }
  };

  const handleAnswerChange = async (question, value) => {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
    setSaving(true);
    try {
      await api.post(`/sessions/${sessionId}/answer`, {
        questionId: question.id,
        answer: value,
      });
    } catch (err) {
      setWarning(err.response?.data?.message || 'Could not save answer');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (auto = false) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await api.post(`/sessions/${sessionId}/submit`);
      const result = res.data?.data?.result;
      router.replace(`/student/results?quizId=${quizId}`);
      if (result) {
        sessionStorage.setItem(`quiz-result:${sessionId}`, JSON.stringify(result));
      }
    } catch (err) {
      setWarning(err.response?.data?.message || (auto ? 'Auto-submit failed' : 'Submit failed'));
      setSubmitting(false);
    }
  };

  const selectedAnswers = useMemo(() => answers, [answers]);

  if (loading) {
    return <div style={{ padding: 24, color: '#6B6B6B' }}>Loading attempt...</div>;
  }

  if (error) {
    return <div style={{ padding: 24, color: '#B91C1C' }}>{error}</div>;
  }

  if (!quiz || !currentQuestion) {
    return <div style={{ padding: 24, color: '#6B6B6B' }}>No questions available.</div>;
  }

  const { text, options } = normalizeContent(currentQuestion.content);
  const remainingLabel = formatClock(remainingSeconds ?? 0);

  return (
    <div style={{ fontFamily: 'Segoe UI, sans-serif', color: '#111111', padding: '8px 0 24px' }}>
      <div style={{ marginBottom: 18, display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <Link href={`/quiz/${quizId}/lobby`} style={{ textDecoration: 'none' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 16, border: '1px solid #E7E3DD', background: 'white', color: '#111111', fontSize: 13, fontWeight: 800 }}>
            <ArrowLeft size={14} /> Back to lobby
          </div>
        </Link>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 16, background: remainingSeconds != null && remainingSeconds < 300 ? '#FEF2F2' : '#F8FAFC', color: remainingSeconds != null && remainingSeconds < 300 ? '#B91C1C' : '#0F172A', fontSize: 13, fontWeight: 900 }}>
          <Clock3 size={14} /> {remainingLabel}
        </div>
      </div>

      <div style={{ borderRadius: 28, border: '1px solid #E8E1D8', background: 'linear-gradient(135deg, #FFFFFF 0%, #FBF9F7 100%)', padding: 18, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 13, color: '#7A7167', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{quiz.title}</div>
            <h1 style={{ margin: '6px 0 0', fontSize: 'clamp(24px, 3vw, 38px)', letterSpacing: '-0.05em', lineHeight: 1.08, fontWeight: 900 }}>
              Question {currentIndex + 1} of {questions.length}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button onClick={() => handleViolation('tab_switch')} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 16, border: '1px solid #E7E3DD', background: 'white', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
              <ShieldAlert size={14} /> Report rule issue
            </button>
            <button onClick={() => handleSubmit(false)} disabled={submitting} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 16, border: 'none', background: submitting ? '#D6D3D1' : '#111111', color: 'white', fontSize: 13, fontWeight: 900, cursor: submitting ? 'not-allowed' : 'pointer' }}>
              {submitting ? <Loader2 size={14} /> : <CheckCircle2 size={14} />} Submit
            </button>
          </div>
        </div>
        <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap', color: '#6F655C', fontSize: 13 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><ShieldCheck size={14} /> Violations: {violations}</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><SquarePen size={14} /> Autosave: {saving ? 'Saving...' : 'On'}</div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><PauseCircle size={14} /> Stay in fullscreen for secure submission</div>
        </div>
      </div>

      {warning && (
        <div style={{ marginBottom: 16, padding: '12px 14px', borderRadius: 16, background: '#FFF7ED', border: '1px solid #FED7AA', color: '#9A3412', fontSize: 13, fontWeight: 700 }}>
          {warning}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 0.75fr', gap: 16, alignItems: 'start' }}>
        <div style={{ background: 'white', border: '1px solid #E7E3DD', borderRadius: 24, padding: 22, minHeight: 420 }}>
          <div style={{ fontSize: 12, color: '#7A7167', fontWeight: 800, textTransform: 'uppercase', marginBottom: 10 }}>Question</div>
          <div style={{ fontSize: 20, lineHeight: 1.7, fontWeight: 700, color: '#111111' }}>
            {text}
          </div>

          <div style={{ marginTop: 20 }}>
            {currentQuestion.type === 'mcq_single' && options.length > 0 && (
              <div style={{ display: 'grid', gap: 10 }}>
                {options.map((option, index) => (
                  <label key={index} style={{ display: 'flex', alignItems: 'center', gap: 12, border: '1px solid #E7E3DD', borderRadius: 16, padding: '12px 14px', cursor: 'pointer', background: selectedAnswers[currentQuestion.id] === index + 1 ? '#F8FAFC' : 'white' }}>
                    <input
                      type="radio"
                      checked={Number(selectedAnswers[currentQuestion.id]) === index + 1}
                      onChange={() => handleAnswerChange(currentQuestion, index + 1)}
                    />
                    <span style={{ fontSize: 15, fontWeight: 600 }}>{option}</span>
                  </label>
                ))}
              </div>
            )}

            {currentQuestion.type === 'mcq_multiple' && options.length > 0 && (
              <div style={{ display: 'grid', gap: 10 }}>
                {options.map((option, index) => {
                  const current = Array.isArray(selectedAnswers[currentQuestion.id]) ? selectedAnswers[currentQuestion.id] : [];
                  const checked = current.includes(index + 1);
                  return (
                    <label key={index} style={{ display: 'flex', alignItems: 'center', gap: 12, border: '1px solid #E7E3DD', borderRadius: 16, padding: '12px 14px', cursor: 'pointer', background: checked ? '#F8FAFC' : 'white' }}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const next = checked ? current.filter((value) => value !== index + 1) : [...current, index + 1];
                          handleAnswerChange(currentQuestion, next);
                        }}
                      />
                      <span style={{ fontSize: 15, fontWeight: 600 }}>{option}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {currentQuestion.type === 'true_false' && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {['true', 'false'].map((value) => (
                  <button
                    key={value}
                    onClick={() => handleAnswerChange(currentQuestion, value)}
                    style={{ padding: '12px 16px', borderRadius: 16, border: '1px solid #E7E3DD', background: String(selectedAnswers[currentQuestion.id]) === value ? '#111111' : 'white', color: String(selectedAnswers[currentQuestion.id]) === value ? 'white' : '#111111', fontSize: 14, fontWeight: 800, cursor: 'pointer' }}
                  >
                    {value === 'true' ? 'True' : 'False'}
                  </button>
                ))}
              </div>
            )}

            {['integer', 'fill_blank'].includes(currentQuestion.type) && (
              <input
                type="text"
                value={selectedAnswers[currentQuestion.id] ?? ''}
                onChange={(e) => handleAnswerChange(currentQuestion, e.target.value)}
                placeholder="Type your answer"
                style={{ width: '100%', boxSizing: 'border-box', marginTop: 8, padding: '14px 16px', borderRadius: 16, border: '1px solid #E7E3DD', fontSize: 15, outline: 'none' }}
              />
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 22, flexWrap: 'wrap' }}>
            <button
              onClick={() => setCurrentIndex((value) => Math.max(0, value - 1))}
              disabled={currentIndex === 0}
              style={{ padding: '12px 16px', borderRadius: 16, border: '1px solid #E7E3DD', background: 'white', fontSize: 13, fontWeight: 800, cursor: currentIndex === 0 ? 'not-allowed' : 'pointer', opacity: currentIndex === 0 ? 0.6 : 1 }}
            >
              Previous
            </button>
            <button
              onClick={() => setCurrentIndex((value) => Math.min(questions.length - 1, value + 1))}
              disabled={currentIndex >= questions.length - 1}
              style={{ padding: '12px 16px', borderRadius: 16, border: 'none', background: '#111111', color: 'white', fontSize: 13, fontWeight: 800, cursor: currentIndex >= questions.length - 1 ? 'not-allowed' : 'pointer', opacity: currentIndex >= questions.length - 1 ? 0.6 : 1 }}
            >
              Next
            </button>
          </div>
        </div>

        <div style={{ background: 'white', border: '1px solid #E7E3DD', borderRadius: 24, padding: 18, position: 'sticky', top: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ fontSize: 13, color: '#7A7167', fontWeight: 800, textTransform: 'uppercase' }}>Navigator</div>
            <div style={{ fontSize: 12, color: '#8A8177', fontWeight: 700 }}>{questions.length} questions</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(52px, 1fr))', gap: 8 }}>
            {questions.map((question, index) => {
              const answered = selectedAnswers[question.id] != null;
              const active = index === currentIndex;
              return (
                <button
                  key={question.id}
                  onClick={() => setCurrentIndex(index)}
                  style={{
                    height: 48,
                    borderRadius: 14,
                    border: active ? 'none' : '1px solid #E7E3DD',
                    background: active ? '#111111' : answered ? '#ECFDF5' : '#FAF8F5',
                    color: active ? 'white' : '#111111',
                    fontSize: 13,
                    fontWeight: 900,
                    cursor: 'pointer',
                  }}
                >
                  {index + 1}
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 16, display: 'grid', gap: 8, fontSize: 12, color: '#6F655C' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 10, height: 10, borderRadius: 999, background: '#ECFDF5' }} /> Answered</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 10, height: 10, borderRadius: 999, background: '#FAF8F5' }} /> Unanswered</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 10, height: 10, borderRadius: 999, background: '#111111' }} /> Current question</div>
          </div>
        </div>
      </div>
    </div>
  );
}