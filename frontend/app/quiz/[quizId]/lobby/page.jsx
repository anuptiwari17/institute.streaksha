'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, BadgeCheck, Clock3, PlayCircle, ShieldAlert, ShieldCheck, Target } from 'lucide-react';

function formatDateTime(value) {
  if (!value) return 'Not scheduled';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Not scheduled';
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function QuizLobbyPage() {
  const params = useParams();
  const router = useRouter();
  const quizId = params.quizId;
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState('');
  const [startHint, setStartHint] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setError('');
        const res = await api.get(`/quizzes/${quizId}`);
        if (!active) return;
        setQuiz(res.data?.data || null);
      } catch (err) {
        if (active) setError(err.response?.data?.message || 'Failed to load quiz details');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [quizId]);

  const canStart = Boolean(quiz?.status === 'published');

  const handleStart = async () => {
    setStarting(true);
    setStartHint('');
    try {
      const res = await api.post(`/sessions/${quizId}/start`);
      const session = res.data?.data;
      if (!session?.sessionId) throw new Error('Session start response missing sessionId');
      sessionStorage.setItem(`quiz-session:${session.sessionId}`, JSON.stringify(session));
      router.push(`/quiz/${quizId}/attempt/${session.sessionId}`);
    } catch (err) {
      setStartHint(err.response?.data?.message || err.message || 'Could not start the quiz');
    } finally {
      setStarting(false);
    }
  };

  return (
    <div style={{ fontFamily: 'Segoe UI, sans-serif', color: '#111111', padding: '8px 0 24px' }}>
      <div style={{ marginBottom: 20 }}>
        <Link href="/student" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 16, border: '1px solid #E7E3DD', background: 'white', color: '#111111', fontSize: 13, fontWeight: 800 }}>
            <ArrowLeft size={14} /> Back to dashboard
          </div>
        </Link>
      </div>

      <div style={{ borderRadius: 32, padding: '28px clamp(18px, 4vw, 32px)', background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)', border: '1px solid #E8E1D8' }}>
        {loading ? (
          <div style={{ minHeight: 260, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#7A7167', fontSize: 14 }}>Loading quiz lobby...</div>
        ) : error ? (
          <div style={{ padding: 16, borderRadius: 16, background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', fontSize: 14, fontWeight: 600 }}>
            {error}
          </div>
        ) : !quiz ? (
          <div style={{ padding: 16, borderRadius: 16, background: '#FFF7ED', border: '1px solid #FED7AA', color: '#9A3412', fontSize: 14, fontWeight: 600 }}>
            Quiz not found.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 22 }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 999, background: '#ECFDF5', color: '#047857', fontSize: 12, fontWeight: 800, marginBottom: 12 }}>
                <BadgeCheck size={13} /> Ready to attempt
              </div>
              <h1 style={{ margin: 0, fontSize: 'clamp(32px, 5vw, 52px)', lineHeight: 1.02, letterSpacing: '-0.06em', fontWeight: 900 }}>
                {quiz.title}
              </h1>
              <p style={{ margin: '12px 0 0', maxWidth: 780, fontSize: 'clamp(15px, 2vw, 17px)', lineHeight: 1.6, color: '#655B51' }}>
                Read the rules carefully. The attempt will use fullscreen mode, time tracking, and violation logging to keep the quiz secure and fair.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              <div style={{ background: 'white', border: '1px solid #E7E3DD', borderRadius: 20, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#7A7167', fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>
                  <Target size={14} /> Subject
                </div>
                <div style={{ marginTop: 8, fontSize: 15, fontWeight: 800 }}>{quiz.subject_name}</div>
              </div>
              <div style={{ background: 'white', border: '1px solid #E7E3DD', borderRadius: 20, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#7A7167', fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>
                  <Clock3 size={14} /> Duration
                </div>
                <div style={{ marginTop: 8, fontSize: 15, fontWeight: 800 }}>{quiz.config?.duration_mins || 0} minutes</div>
              </div>
              <div style={{ background: 'white', border: '1px solid #E7E3DD', borderRadius: 20, padding: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#7A7167', fontSize: 12, fontWeight: 800, textTransform: 'uppercase' }}>
                  <ShieldCheck size={14} /> Schedule
                </div>
                <div style={{ marginTop: 8, fontSize: 15, fontWeight: 800 }}>{formatDateTime(quiz.starts_at)} - {formatDateTime(quiz.ends_at)}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18 }}>
              <div style={{ background: 'white', border: '1px solid #E7E3DD', borderRadius: 24, padding: 22 }}>
                <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, letterSpacing: '-0.05em' }}>Quiz rules</h2>
                <div style={{ marginTop: 14, display: 'grid', gap: 10, color: '#5F564D', fontSize: 14, lineHeight: 1.6 }}>
                  <div style={{ display: 'flex', gap: 10 }}><ShieldAlert size={16} style={{ flexShrink: 0, marginTop: 3 }} /> Do not switch tabs or leave fullscreen while the quiz is running.</div>
                  <div style={{ display: 'flex', gap: 10 }}><ShieldAlert size={16} style={{ flexShrink: 0, marginTop: 3 }} /> Copy-paste, blur, and fullscreen exit events may be logged as violations.</div>
                  <div style={{ display: 'flex', gap: 10 }}><ShieldAlert size={16} style={{ flexShrink: 0, marginTop: 3 }} /> The timer continues to run after the session starts, and answers are auto-saved.
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}><ShieldAlert size={16} style={{ flexShrink: 0, marginTop: 3 }} /> Submit only after reviewing your answers carefully.</div>
                </div>
              </div>

              <div style={{ background: '#111111', color: 'white', borderRadius: 24, padding: 22, display: 'grid', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <PlayCircle size={18} />
                  <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, letterSpacing: '-0.05em' }}>Start attempt</h2>
                </div>
                <div style={{ fontSize: 14, lineHeight: 1.7, color: '#E7E5E4' }}>
                  The quiz will start in fullscreen mode. You will be taken to the secure attempt screen once the session is created.
                </div>
                {startHint && (
                  <div style={{ padding: '12px 14px', borderRadius: 14, background: 'rgba(255,255,255,0.08)', color: '#FECACA', fontSize: 13, fontWeight: 700 }}>
                    {startHint}
                  </div>
                )}
                <button
                  onClick={handleStart}
                  disabled={!canStart || starting}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    borderRadius: 16,
                    border: 'none',
                    background: canStart && !starting ? 'white' : 'rgba(255,255,255,0.25)',
                    color: canStart && !starting ? '#111111' : '#E7E5E4',
                    fontSize: 14,
                    fontWeight: 900,
                    cursor: canStart && !starting ? 'pointer' : 'not-allowed',
                  }}
                >
                  {starting ? 'Starting...' : 'Start Quiz'}
                </button>
                <div style={{ fontSize: 12, color: '#D6D3D1' }}>
                  {canStart ? 'You can begin now.' : 'This quiz is not available yet.'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}