'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';
import {
  Users, GraduationCap, BookOpen, ClipboardList,
  TrendingUp, Activity, AlertTriangle, ArrowRight,
  ChevronRight, BarChart3, Zap, Clock
} from 'lucide-react';

// ── Skeleton loader ───────────────────────────────────────────────────────────
function Skeleton({ w = '100%', h = 20, radius = 8, className = '' }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: radius,
      background: 'linear-gradient(90deg, #F0F0EE 25%, #E8E8E6 50%, #F0F0EE 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s infinite',
    }} className={className}/>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, bg, delta, loading, href }) {
  const inner = (
    <div style={{
      background: 'white', borderRadius: 20, padding: '24px',
      border: '1px solid #E5E5E3', transition: 'all 0.2s',
      cursor: href ? 'pointer' : 'default', height: '100%',
    }}
      onMouseEnter={e => { if (href) { e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; } }}
      onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <div style={{ width: 44, height: 44, background: bg, borderRadius: 14,
                       display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} color={color}/>
        </div>
        {href && <ChevronRight size={16} color="#C0C0BC"/>}
      </div>
      {loading ? (
        <>
          <Skeleton h={36} w="60%" radius={8} />
          <div style={{ marginTop: 8 }}><Skeleton h={14} w="80%" radius={6} /></div>
        </>
      ) : (
        <>
          <div style={{ fontSize: 36, fontWeight: 900, color: '#0A0A0A',
                         letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 6 }}>
            {value ?? '—'}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 13, color: '#6B6B6B', fontWeight: 500 }}>{label}</span>
            {delta !== undefined && (
              <span style={{ fontSize: 12, fontWeight: 700,
                              color: delta >= 0 ? '#16A34A' : '#EF4444' }}>
                {delta >= 0 ? '+' : ''}{delta}%
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
  return href ? <Link href={href} style={{ textDecoration: 'none' }}>{inner}</Link> : inner;
}

// ── Quick action card ─────────────────────────────────────────────────────────
function QuickAction({ label, desc, href, icon: Icon, color, bg }) {
  return (
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div style={{
        background: bg, borderRadius: 16, padding: '18px 20px',
        border: `1px solid ${color}22`, display: 'flex', alignItems: 'center', gap: 14,
        transition: 'all 0.2s', cursor: 'pointer',
      }}
        onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px ${color}18`; }}
        onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
        <div style={{ width: 40, height: 40, background: color, borderRadius: 12,
                       display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Icon size={18} color="white"/>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0A', marginBottom: 2 }}>{label}</div>
          <div style={{ fontSize: 12, color: '#6B6B6B' }}>{desc}</div>
        </div>
        <ArrowRight size={15} color="#C0C0BC"/>
      </div>
    </Link>
  );
}

// ── Recent quiz row ───────────────────────────────────────────────────────────
function QuizRow({ quiz, loading }) {
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0',
                   borderBottom: '1px solid #F5F5F3' }}>
      <Skeleton w={40} h={40} radius={10}/>
      <div style={{ flex: 1 }}>
        <Skeleton h={14} w="60%" radius={6}/>
        <div style={{ marginTop: 6 }}><Skeleton h={11} w="40%" radius={4}/></div>
      </div>
      <Skeleton w={60} h={24} radius={99}/>
    </div>
  );

  const statusConfig = {
    published: { label: 'Live', color: '#16A34A', bg: '#F0FDF4' },
    draft:     { label: 'Draft', color: '#6B6B6B', bg: '#F5F5F3' },
    archived:  { label: 'Archived', color: '#2563EB', bg: '#EFF6FF' },
  };
  const s = statusConfig[quiz.status] || statusConfig.draft;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 0',
                   borderBottom: '1px solid #F5F5F3' }}>
      <div style={{ width: 40, height: 40, background: '#F5F5F3', borderRadius: 10,
                     display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <ClipboardList size={16} color="#6B6B6B"/>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A',
                       whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {quiz.title}
        </div>
        <div style={{ fontSize: 12, color: '#A3A3A0', marginTop: 2 }}>
          {quiz.subject_name} · {quiz.batch_name} · {quiz.question_count} Qs
        </div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 700, color: s.color, background: s.bg,
                      padding: '4px 10px', borderRadius: 99, flexShrink: 0 }}>
        {s.label}
      </span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AdminOverview() {
  const user = getUser();
  const [stats, setStats] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Parallel fetch — fast
    Promise.all([
      api.get('/profile').catch(() => null),
      api.get('/quizzes?limit=5&page=1').catch(() => null),
    ]).then(([profileRes, quizzesRes]) => {
      if (profileRes?.data?.data?.stats) setStats(profileRes.data.data.stats);
      if (quizzesRes?.data?.data?.quizzes) setQuizzes(quizzesRes.data.data.quizzes);
    }).finally(() => setLoading(false));
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const statCards = [
    { label: 'Total Students', value: stats?.students, icon: Users,         color: '#2563EB', bg: '#EFF6FF', href: '/admin/students' },
    { label: 'Teachers',       value: stats?.teachers, icon: GraduationCap, color: '#FF4D00', bg: '#FFF0EB', href: '/admin/teachers' },
    { label: 'Quizzes',        value: stats?.quizzes,  icon: ClipboardList, color: '#16A34A', bg: '#F0FDF4', href: '/admin/quizzes'  },
    { label: 'Total Attempts', value: stats?.total_attempts, icon: Activity, color: '#9333EA', bg: '#FAF5FF', href: null },
  ];

  const quickActions = [
    { label: 'Add teachers',    desc: 'Onboard new staff',          href: '/admin/teachers',  icon: GraduationCap, color: '#FF4D00', bg: '#FFF0EB' },
    { label: 'Import students', desc: 'Bulk CSV upload',            href: '/admin/students',  icon: Users,         color: '#2563EB', bg: '#EFF6FF' },
    { label: 'Create batch',    desc: 'New class or group',         href: '/admin/batches',   icon: BookOpen,      color: '#16A34A', bg: '#F0FDF4' },
    { label: 'View quizzes',    desc: 'All published & drafts',     href: '/admin/quizzes',   icon: ClipboardList, color: '#9333EA', bg: '#FAF5FF' },
  ];

  return (
    <div style={{
      opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(12px)',
      transition: 'all 0.5s cubic-bezier(0.16,1,0.3,1)',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                       flexWrap: 'wrap', gap: 16 }}>
          <div>
            <p style={{ fontSize: 13, color: '#A3A3A0', fontWeight: 500, marginBottom: 4 }}>
              {greeting} 👋
            </p>
            <h1 style={{ fontSize: 'clamp(26px,3vw,36px)', fontWeight: 900,
                          letterSpacing: '-0.04em', color: '#0A0A0A', lineHeight: 1.1 }}>
              {loading ? 'Welcome back' : `Welcome back, ${user?.name?.split(' ')[0] || 'Admin'}`}
            </h1>
            <p style={{ fontSize: 14, color: '#6B6B6B', marginTop: 6 }}>
              Here's what's happening at your institute today.
            </p>
          </div>
          <Link href="/admin/quizzes" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#0A0A0A', color: 'white', textDecoration: 'none',
            padding: '12px 20px', borderRadius: 14, fontSize: 14, fontWeight: 700,
            transition: 'all 0.15s', flexShrink: 0,
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FF4D00'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#0A0A0A'; }}>
            <Zap size={15}/> Create quiz
          </Link>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 28 }}>
        {statCards.map(c => (
          <StatCard key={c.label} {...c} loading={loading}/>
        ))}
      </div>

      {/* Two column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 20 }}>

        {/* Recent quizzes */}
        <div style={{ background: 'white', borderRadius: 20, border: '1px solid #E5E5E3', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0A0A0A', letterSpacing: '-0.02em' }}>
              Recent Quizzes
            </h2>
            <Link href="/admin/quizzes" style={{
              fontSize: 13, fontWeight: 600, color: '#FF4D00', textDecoration: 'none',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              View all <ArrowRight size={13}/>
            </Link>
          </div>
          <p style={{ fontSize: 13, color: '#A3A3A0', marginBottom: 16 }}>
            Latest quiz activity across your institute
          </p>

          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <QuizRow key={i} loading/>)
          ) : quizzes.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#A3A3A0' }}>
              <ClipboardList size={32} style={{ margin: '0 auto 12px', opacity: 0.4 }}/>
              <p style={{ fontSize: 14, fontWeight: 500 }}>No quizzes yet</p>
              <Link href="/admin/quizzes" style={{ fontSize: 13, color: '#FF4D00',
                                                    fontWeight: 600, textDecoration: 'none' }}>
                Create your first quiz →
              </Link>
            </div>
          ) : (
            quizzes.map((q, i) => <QuizRow key={i} quiz={q}/>)
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Quick actions */}
          <div style={{ background: 'white', borderRadius: 20, border: '1px solid #E5E5E3', padding: '24px' }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0A0A0A',
                          letterSpacing: '-0.02em', marginBottom: 4 }}>
              Quick Actions
            </h2>
            <p style={{ fontSize: 13, color: '#A3A3A0', marginBottom: 16 }}>
              Common tasks at your fingertips
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {quickActions.map(a => <QuickAction key={a.label} {...a}/>)}
            </div>
          </div>

          {/* Institute health */}
          <div style={{ background: '#0A0A0A', borderRadius: 20, padding: '24px',
                         position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', right: -20, bottom: -20, width: 120, height: 120,
                           borderRadius: '50%', background: 'rgba(255,77,0,0.15)', pointerEvents: 'none' }}/>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
                           position: 'relative', zIndex: 1 }}>
              <BarChart3 size={16} color="#FF4D00"/>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#FF4D00',
                              textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Institute status
              </span>
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              {loading ? (
                <>
                  <Skeleton h={32} w="50%" radius={8}/>
                  <div style={{ marginTop: 8 }}><Skeleton h={13} w="80%" radius={6}/></div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 32, fontWeight: 900, color: 'white',
                                  letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 6 }}>
                    {stats?.published_quizzes ?? 0}
                    <span style={{ fontSize: 14, fontWeight: 500,
                                    color: 'rgba(255,255,255,0.4)', marginLeft: 8 }}>
                      live quizzes
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                    {stats?.batches ?? 0} batches · {stats?.subjects ?? 0} subjects ·{' '}
                    {stats?.questions ?? 0} questions in bank
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}