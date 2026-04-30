'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';
import {
  BarChart3, BookOpen, CheckCircle, ClipboardList,
  ArrowRight, ChevronRight, Plus, Zap
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
function StatCard({ label, value, icon: Icon, color, bg, loading, href }) {
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
          <span style={{ fontSize: 13, color: '#6B6B6B', fontWeight: 500 }}>{label}</span>
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

// ── Quiz row ──────────────────────────────────────────────────────────────────
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
    published: { label: 'Published', color: '#16A34A', bg: '#F0FDF4' },
    draft:     { label: 'Draft', color: '#6B6B6B', bg: '#F5F5F3' },
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
export default function TeacherOverview() {
  const user = getUser();
  const [profile, setProfile] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    Promise.all([
      api.get('/profile').catch(() => null),
      api.get('/quizzes?limit=5&page=1').catch(() => null),
    ]).then(([profileRes, quizzesRes]) => {
      if (profileRes?.data?.data) {
        setProfile({
          ...profileRes.data.data,
          batches: profileRes.data.data.batches || [],
          subjects: profileRes.data.data.subjects || [],
        });
      }
      if (quizzesRes?.data?.data?.quizzes) setQuizzes(quizzesRes.data.data.quizzes);
    }).finally(() => setLoading(false));
    return () => clearTimeout(timer);
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const stats = {
    batches: profile?.batches?.length || 0,
    subjects: profile?.subjects?.length || 0,
    total_quizzes: profile?.total_quizzes || 0,
    published_quizzes: profile?.published_quizzes || 0,
  };

  const statCards = [
    { label: 'Assigned Batches', value: stats.batches, icon: BookOpen,    color: '#2563EB', bg: '#EFF6FF' },
    { label: 'Subjects',         value: stats.subjects, icon: BarChart3,   color: '#FF4D00', bg: '#FFF0EB' },
    { label: 'Total Quizzes',    value: stats.total_quizzes, icon: ClipboardList, color: '#9333EA', bg: '#FAF5FF' },
    { label: 'Published',        value: stats.published_quizzes, icon: CheckCircle, color: '#16A34A', bg: '#F0FDF4' },
  ];

  const quickActions = [
    { label: 'Create Question', desc: 'Add to question bank', href: '/teacher/questions?new=true', icon: Plus, color: '#2563EB', bg: '#EFF6FF' },
    { label: 'Create Quiz',     desc: 'Build new quiz',      href: '/teacher/quizzes/new', icon: Zap, color: '#FF4D00', bg: '#FFF0EB' },
  ];

  return (
    <div style={{
      opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(12px)',
      transition: 'all 0.5s cubic-bezier(0.16,1,0.3,1)',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div>
          <p style={{ fontSize: 13, color: '#A3A3A0', fontWeight: 500, marginBottom: 4 }}>
            {greeting} 👋
          </p>
          <h1 style={{ fontSize: 'clamp(26px,3vw,36px)', fontWeight: 900,
                        letterSpacing: '-0.04em', color: '#0A0A0A', lineHeight: 1.1 }}>
            {loading ? 'Welcome' : `Welcome, ${user?.name?.split(' ')[0] || 'Teacher'}`}
          </h1>
          <p style={{ fontSize: 14, color: '#6B6B6B', marginTop: 6 }}>
            Manage your quizzes, questions, and student results.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                     gap: 20, marginBottom: 36 }}>
        {statCards.map((card, i) => (
          <StatCard key={i} {...card} loading={loading} />
        ))}
      </div>

      {/* Quick Actions */}
      <div style={{ marginBottom: 40 }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0A0A0A', marginBottom: 14 }}>
          Quick Actions
        </h2>
        <div style={{ display: 'grid', gap: 12 }}>
          {quickActions.map((action, i) => (
            <QuickAction key={i} {...action} />
          ))}
        </div>
      </div>

      {/* Recent Quizzes */}
      <div style={{
        background: 'white', borderRadius: 20, padding: 24,
        border: '1px solid #E5E5E3',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                       marginBottom: 16 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0A0A0A' }}>
            Recent Quizzes
          </h2>
          <Link href="/teacher/quizzes" style={{
            fontSize: 13, fontWeight: 600, color: '#2563EB', textDecoration: 'none'
          }}>
            View all →
          </Link>
        </div>
        <div>
          {loading ? (
            <>
              <QuizRow loading />
              <QuizRow loading />
              <QuizRow loading />
            </>
          ) : quizzes.length > 0 ? (
            quizzes.map(quiz => <QuizRow key={quiz.id} quiz={quiz} />)
          ) : (
            <div style={{ padding: '32px 16px', textAlign: 'center' }}>
              <ClipboardList size={32} color="#D3D3D1" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14, color: '#6B6B6B' }}>No quizzes yet</p>
              <p style={{ fontSize: 12, color: '#A3A3A0', marginTop: 4 }}>
                Create your first quiz to get started
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
