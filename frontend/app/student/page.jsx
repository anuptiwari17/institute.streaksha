'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  LayoutGrid,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react';

function formatDateTime(value) {
  if (!value) return 'No schedule yet';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'No schedule yet';
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function getQuizState(quiz, attemptByQuiz) {
  const now = new Date();
  const startsAt = quiz.starts_at ? new Date(quiz.starts_at) : null;
  const endsAt = quiz.ends_at ? new Date(quiz.ends_at) : null;
  const hasAttempt = Boolean(attemptByQuiz?.[quiz.id]);

  if (hasAttempt) return 'completed';
  if (startsAt && startsAt > now) return 'upcoming';
  if (startsAt && endsAt && startsAt <= now && endsAt >= now) return 'active';
  if (startsAt && !endsAt && startsAt <= now) return 'active';
  return 'upcoming';
}

function StatCard({ label, value, hint, icon: Icon, accent }) {
  return (
    <div style={{
      background: 'white',
      border: '1px solid #E7E3DD',
      borderRadius: 24,
      padding: 22,
      boxShadow: '0 1px 0 rgba(0,0,0,0.02)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#6B5E52', letterSpacing: '0.02em', textTransform: 'uppercase' }}>
            {label}
          </div>
          <div style={{ fontSize: 'clamp(28px, 4vw, 40px)', fontWeight: 900, color: '#121212', lineHeight: 1, marginTop: 10, letterSpacing: '-0.05em' }}>
            {value}
          </div>
          <div style={{ fontSize: 13, color: '#7A7167', marginTop: 8 }}>
            {hint}
          </div>
        </div>
        <div style={{ width: 48, height: 48, borderRadius: 16, background: accent.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={20} color={accent.fg} />
        </div>
      </div>
    </div>
  );
}

function QuizCard({ quiz, state, latestAttempt }) {
  const tone = {
    upcoming: { label: 'Upcoming', bg: '#EEF2FF', fg: '#3730A3', action: 'View lobby', href: `/quiz/${quiz.id}/lobby` },
    active: { label: 'Active', bg: '#ECFDF5', fg: '#047857', action: 'Start now', href: `/quiz/${quiz.id}/lobby` },
    completed: { label: 'Completed', bg: '#FFF7ED', fg: '#C2410C', action: 'View results', href: '/student/results' },
  }[state];

  return (
    <div style={{
      background: 'white',
      border: '1px solid #E7E3DD',
      borderRadius: 24,
      padding: 22,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      minHeight: 240,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 999, background: tone.bg, color: tone.fg, fontSize: 12, fontWeight: 800, marginBottom: 12 }}>
            {tone.label}
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 900, lineHeight: 1.15, letterSpacing: '-0.04em', color: '#111111', margin: 0 }}>
            {quiz.title}
          </h3>
          <div style={{ fontSize: 13, color: '#7A7167', marginTop: 8 }}>
            {quiz.subject_name} · {quiz.batch_name}
          </div>
        </div>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: '#F7F2EC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <LayoutGrid size={18} color="#A06A3B" />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 10 }}>
        <div style={{ background: '#FAF8F5', borderRadius: 16, padding: 12 }}>
          <div style={{ fontSize: 11, color: '#7A7167', fontWeight: 700, textTransform: 'uppercase' }}>Duration</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#111111', marginTop: 4 }}>{quiz.config?.duration_mins || 0} min</div>
        </div>
        <div style={{ background: '#FAF8F5', borderRadius: 16, padding: 12 }}>
          <div style={{ fontSize: 11, color: '#7A7167', fontWeight: 700, textTransform: 'uppercase' }}>Questions</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#111111', marginTop: 4 }}>{quiz.question_count || 0}</div>
        </div>
        <div style={{ background: '#FAF8F5', borderRadius: 16, padding: 12 }}>
          <div style={{ fontSize: 11, color: '#7A7167', fontWeight: 700, textTransform: 'uppercase' }}>Marks</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#111111', marginTop: 4 }}>{quiz.total_marks || 0}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: 8, fontSize: 13, color: '#6F655C' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock3 size={14} />
          <span>{quiz.starts_at ? `Starts ${formatDateTime(quiz.starts_at)}` : 'No start time set'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Target size={14} />
          <span>{quiz.ends_at ? `Ends ${formatDateTime(quiz.ends_at)}` : 'Open schedule'}</span>
        </div>
        {latestAttempt?.percentage != null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle2 size={14} />
            <span>Last attempt: {latestAttempt.percentage}%{latestAttempt.grade ? ` · Grade ${latestAttempt.grade}` : ''}</span>
          </div>
        )}
      </div>

      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <div style={{ fontSize: 12, color: '#8A8177' }}>
          {state === 'completed' && latestAttempt?.start_time ? `Attempted on ${formatDateTime(latestAttempt.start_time)}` : 'Carefully follow the quiz rules'}
        </div>
        <Link href={tone.href} style={{ textDecoration: 'none' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 14, background: '#111111', color: 'white', fontSize: 13, fontWeight: 800 }}>
            {tone.action}
            <ArrowRight size={14} />
          </div>
        </Link>
      </div>
    </div>
  );
}

export default function StudentDashboardPage() {
  const user = getUser();
  const [profile, setProfile] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const inFlightRef = useRef(false);

  const loadDashboard = async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    try {
      setError('');
      const [profileRes, quizzesRes, historyRes] = await Promise.all([
        api.get('/profile'),
        api.get('/quizzes', { params: { limit: 100, page: 1 } }),
        api.get('/profile/my-quizzes', { params: { limit: 100, page: 1 } }),
      ]);

      setProfile(profileRes.data?.data || null);
      setQuizzes(quizzesRes.data?.data?.quizzes || []);
      setHistory(historyRes.data?.data?.quizzes || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load student dashboard');
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  };

  useEffect(() => {
    loadDashboard();
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        loadDashboard();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') {
        loadDashboard();
      }
    }, 60000);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      clearInterval(timer);
    };
  }, []);

  const attemptByQuiz = useMemo(() => {
    const map = {};
    for (const item of history) {
      if (!map[item.quiz_id]) map[item.quiz_id] = item;
    }
    return map;
  }, [history]);

  const groupedQuizzes = useMemo(() => {
    const buckets = { upcoming: [], active: [], completed: [] };
    for (const quiz of quizzes) {
      const state = getQuizState(quiz, attemptByQuiz);
      buckets[state].push(quiz);
    }
    return buckets;
  }, [quizzes, attemptByQuiz]);

  const attempts = history.length;
  const completedAttempts = history.filter((item) => item.percentage != null);
  const averageScore = completedAttempts.length
    ? Math.round(completedAttempts.reduce((sum, item) => sum + Number(item.percentage || 0), 0) / completedAttempts.length)
    : 0;
  const passedCount = completedAttempts.filter((item) => Number(item.percentage || 0) >= 35).length;
  const passRate = completedAttempts.length ? Math.round((passedCount / completedAttempts.length) * 100) : 0;

  const statCards = [
    { label: 'Assigned Quizzes', value: quizzes.length, hint: 'Visible to your enrolled batches', icon: BookOpen, accent: { bg: '#EEF2FF', fg: '#3730A3' } },
    { label: 'Total Attempts', value: attempts, hint: 'All quiz sessions recorded', icon: LayoutGrid, accent: { bg: '#ECFDF5', fg: '#047857' } },
    { label: 'Average Score', value: `${averageScore}%`, hint: 'Based on completed attempts', icon: Trophy, accent: { bg: '#FFF7ED', fg: '#C2410C' } },
    { label: 'Pass Rate', value: `${passRate}%`, hint: 'Passing attempts among scored quizzes', icon: ShieldCheck, accent: { bg: '#F5F3FF', fg: '#7C3AED' } },
  ];

  return (
    <div style={{
      fontFamily: 'Segoe UI, sans-serif',
      color: '#111111',
      padding: '8px 0 24px',
    }}>
      <div style={{
        borderRadius: 32,
        padding: '28px clamp(18px, 4vw, 32px)',
        background: 'linear-gradient(135deg, #FFF8F1 0%, #FFFFFF 55%, #EEF5FF 100%)',
        border: '1px solid #E8E1D8',
        marginBottom: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, color: '#8A8177', fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          <Sparkles size={14} />
          Student Dashboard
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr auto', gap: 20, alignItems: 'end' }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 'clamp(32px, 5vw, 54px)', lineHeight: 1.02, letterSpacing: '-0.06em', fontWeight: 900 }}>
              Welcome{user?.name ? `, ${user.name.split(' ')[0]}` : ''}
            </h1>
            <p style={{ margin: '14px 0 0', maxWidth: 720, fontSize: 'clamp(16px, 2vw, 18px)', lineHeight: 1.6, color: '#655B51' }}>
              Stay on top of your assigned quizzes, enter a focused exam mode when it is time to attempt, and review your latest performance without clutter.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <Link href="/student/results" style={{ textDecoration: 'none' }}>
              <div style={{ padding: '12px 16px', borderRadius: 16, background: '#111111', color: 'white', fontSize: 13, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                View results <ArrowRight size={14} />
              </div>
            </Link>
            <Link href="/student/profile" style={{ textDecoration: 'none' }}>
              <div style={{ padding: '12px 16px', borderRadius: 16, background: 'white', color: '#111111', fontSize: 13, fontWeight: 800, border: '1px solid #E7E3DD', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                Profile
              </div>
            </Link>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginTop: 24 }}>
          {statCards.map((card) => <StatCard key={card.label} {...card} />)}
        </div>

        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 18, color: '#6F655C', fontSize: 13 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.8)', border: '1px solid #E7E3DD' }}>
            <ShieldCheck size={14} />
            Fullscreen mode will be enforced during quizzes
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.8)', border: '1px solid #E7E3DD' }}>
            <Clock3 size={14} />
            Auto-refreshes every 30 seconds
          </div>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 20, padding: '14px 16px', borderRadius: 16, background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', fontSize: 14, fontWeight: 600 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gap: 24 }}>
        {['upcoming', 'active', 'completed'].map((section) => (
          <section key={section}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, letterSpacing: '-0.05em' }}>
                  {section === 'upcoming' ? 'Upcoming Quizzes' : section === 'active' ? 'Active Quizzes' : 'Completed Quizzes'}
                </h2>
                <p style={{ margin: '6px 0 0', fontSize: 13, color: '#7A7167' }}>
                  {section === 'upcoming' && 'Available soon or waiting for their start time.'}
                  {section === 'active' && 'Open now. Enter fullscreen and begin carefully.'}
                  {section === 'completed' && 'Your submitted quizzes and results are collected here.'}
                </p>
              </div>
              <div style={{ fontSize: 12, color: '#8A8177', fontWeight: 700 }}>
                {groupedQuizzes[section].length} total
              </div>
            </div>

            {loading ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                {[1, 2, 3].map((item) => (
                  <div key={item} style={{ height: 240, borderRadius: 24, background: '#FFFFFF', border: '1px solid #E7E3DD' }} />
                ))}
              </div>
            ) : groupedQuizzes[section].length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                {groupedQuizzes[section].map((quiz) => (
                  <QuizCard
                    key={quiz.id}
                    quiz={quiz}
                    state={getQuizState(quiz, attemptByQuiz)}
                    latestAttempt={attemptByQuiz[quiz.id]}
                  />
                ))}
              </div>
            ) : (
              <div style={{
                border: '1px dashed #DCCFC4',
                borderRadius: 24,
                padding: 28,
                background: '#FFFDFB',
                color: '#7A7167',
                fontSize: 14,
              }}>
                No {section} quizzes right now.
              </div>
            )}
          </section>
        ))}
      </div>
    </div>
  );
}