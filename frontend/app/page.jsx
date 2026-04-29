'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// ── tiny helpers ──────────────────────────────────────────────────────────────
const useInView = (threshold = 0.15) => {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
};

// ── data ──────────────────────────────────────────────────────────────────────
const FEATURES = [
  {
    tag: '01 — ASSESSMENT',
    title: 'Quizzes that run themselves',
    body: 'Create, configure, and publish tests in minutes. Server-side timers, auto-grading, instant results — no manual checking ever again.',
    accent: '#FF4D00',
    bg: '#FFF0EB',
  },
  {
    tag: '02 — INTEGRITY',
    title: 'Proctoring built right in',
    body: 'Tab-switch detection, fullscreen enforcement, violation logging. Every session is monitored. Every anomaly is flagged.',
    accent: '#0A0A0A',
    bg: '#F5F5F3',
  },
  {
    tag: '03 — INSIGHTS',
    title: 'Data every teacher actually wants',
    body: 'Topic-wise breakdowns, class rankings, performance over time. Stop guessing what students struggle with.',
    accent: '#2563EB',
    bg: '#EFF6FF',
  },
  {
    tag: '04 — MANAGEMENT',
    title: 'Your whole school in one place',
    body: 'Manage batches, subjects, teachers, and students under one roof. Bulk import 500 students from a single CSV.',
    accent: '#16A34A',
    bg: '#F0FDF4',
  },
];

const STATS = [
  { value: '10x', label: 'Faster result delivery' },
  { value: '100%', label: 'Paper-free assessment' },
  { value: '0', label: 'Manual checking required' },
  { value: '∞', label: 'Question bank size' },
];

const TESTIMONIALS = [
  {
    name: 'Priya Sharma',
    role: 'Principal, DPS Ludhiana',
    text: 'We replaced our entire paper-based exam system in one week. Results that used to take 3 days now take 3 seconds.',
    initials: 'PS',
    color: '#FFF0EB',
    textColor: '#FF4D00',
  },
  {
    name: 'Rahul Verma',
    role: 'Physics Teacher, DAV College',
    text: 'The question bank alone is worth it. I built 3 months of tests in one afternoon. The shuffle feature means no two students get the same paper.',
    initials: 'RV',
    color: '#EFF6FF',
    textColor: '#2563EB',
  },
  {
    name: 'Anjali Singh',
    role: 'Student, Class 12',
    text: 'The results come instantly with topic-wise breakdown. I know exactly where I lost marks. Way better than waiting a week.',
    initials: 'AS',
    color: '#F0FDF4',
    textColor: '#16A34A',
  },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Register your institute', body: 'Sign up in 2 minutes. Add your institution name and you\'re in.' },
  { step: '02', title: 'Onboard your team', body: 'Upload a CSV — teachers and students get login credentials by email automatically.' },
  { step: '03', title: 'Build your question bank', body: 'MCQ, Integer, Fill in the blanks, True/False. Import bulk questions or create one by one.' },
  { step: '04', title: 'Publish and run', body: 'Assign to a batch, set the timer, hit publish. Students get instant access on their devices.' },
];

// ── NAVBAR ────────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn);
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      transition: 'all 0.3s ease',
      background: scrolled ? 'rgba(250,250,248,0.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      borderBottom: scrolled ? '1px solid #E5E5E3' : '1px solid transparent',
    }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', height: 64,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, background: '#0A0A0A', borderRadius: 8,
                        display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: 14 }}>S</span>
          </div>
          <span style={{ fontWeight: 900, fontSize: 18, letterSpacing: '-0.03em', color: '#0A0A0A' }}>
            Streaksha
          </span>
        </div>

        {/* Links */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <a href="#features" style={{ fontSize: 14, fontWeight: 500, color: '#6B6B6B',
                                       padding: '8px 14px', borderRadius: 10, textDecoration: 'none',
                                       transition: 'all 0.15s' }}
            onMouseEnter={e => { e.target.style.color = '#0A0A0A'; e.target.style.background = '#F5F5F3'; }}
            onMouseLeave={e => { e.target.style.color = '#6B6B6B'; e.target.style.background = 'transparent'; }}>
            Features
          </a>
          <a href="#how" style={{ fontSize: 14, fontWeight: 500, color: '#6B6B6B',
                                   padding: '8px 14px', borderRadius: 10, textDecoration: 'none',
                                   transition: 'all 0.15s' }}
            onMouseEnter={e => { e.target.style.color = '#0A0A0A'; e.target.style.background = '#F5F5F3'; }}
            onMouseLeave={e => { e.target.style.color = '#6B6B6B'; e.target.style.background = 'transparent'; }}>
            How it works
          </a>
          <Link href="/login" style={{ fontSize: 14, fontWeight: 500, color: '#6B6B6B',
                                       padding: '8px 14px', borderRadius: 10, textDecoration: 'none',
                                       transition: 'all 0.15s' }}
            onMouseEnter={e => { e.target.style.color = '#0A0A0A'; e.target.style.background = '#F5F5F3'; }}
            onMouseLeave={e => { e.target.style.color = '#6B6B6B'; e.target.style.background = 'transparent'; }}>
            Login
          </Link>
          <Link href="/register" style={{
            fontSize: 14, fontWeight: 700, color: 'white', background: '#0A0A0A',
            padding: '10px 20px', borderRadius: 12, textDecoration: 'none',
            transition: 'all 0.15s', display: 'inline-block'
          }}
            onMouseEnter={e => { e.target.style.background = '#FF4D00'; e.target.style.transform = 'scale(0.98)'; }}
            onMouseLeave={e => { e.target.style.background = '#0A0A0A'; e.target.style.transform = 'scale(1)'; }}>
            Get started →
          </Link>
        </div>
      </div>
    </nav>
  );
}

// ── HERO ──────────────────────────────────────────────────────────────────────
function Hero() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setTimeout(() => setLoaded(true), 50); }, []);

  return (
    <section style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '120px 32px 80px', position: 'relative', overflow: 'hidden',
    }}>
      {/* Background grain + gradient */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 0,
        background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(255,77,0,0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
      }}/>
      {/* Floating blobs */}
      <div style={{
        position: 'absolute', width: 400, height: 400, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(255,77,0,0.06) 0%, transparent 70%)',
        top: '10%', right: '-5%', pointerEvents: 'none',
        animation: 'float 8s ease-in-out infinite',
      }}/>
      <div style={{
        position: 'absolute', width: 300, height: 300, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(37,99,235,0.05) 0%, transparent 70%)',
        bottom: '15%', left: '-3%', pointerEvents: 'none',
        animation: 'float 10s ease-in-out infinite reverse',
      }}/>

      <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 900 }}>
        {/* Tag pill */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'white', border: '1px solid #E5E5E3',
          borderRadius: 99, padding: '8px 16px', marginBottom: 40,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(12px)',
          transition: 'all 0.6s cubic-bezier(0.16,1,0.3,1)',
        }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#FF4D00',
                          animation: 'pulse 2s infinite' }}/>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#6B6B6B', letterSpacing: '-0.01em' }}>
            Built for Indian institutions
          </span>
        </div>

        {/* Main headline */}
        <h1 style={{
          fontSize: 'clamp(52px, 8vw, 100px)', fontWeight: 900,
          letterSpacing: '-0.04em', lineHeight: 0.95,
          color: '#0A0A0A', marginBottom: 32,
          opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s',
        }}>
          The smarter way<br/>
          <span style={{ color: '#FF4D00', display: 'inline-block',
                          animation: loaded ? 'slideUp 0.7s cubic-bezier(0.16,1,0.3,1) 0.2s both' : 'none' }}>
            to run exams.
          </span>
        </h1>

        {/* Subtext */}
        <p style={{
          fontSize: 20, color: '#6B6B6B', lineHeight: 1.6, maxWidth: 560,
          margin: '0 auto 48px', fontWeight: 400,
          opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 0.7s cubic-bezier(0.16,1,0.3,1) 0.2s',
        }}>
          Streaksha gives schools and coaching institutes a complete quiz platform —
          with proctoring, instant results, and analytics that actually help teachers teach.
        </p>

        {/* CTAs */}
        <div style={{
          display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap',
          opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 0.7s cubic-bezier(0.16,1,0.3,1) 0.3s',
        }}>
          <Link href="/register" style={{
            background: '#0A0A0A', color: 'white', fontWeight: 700, fontSize: 16,
            padding: '16px 32px', borderRadius: 16, textDecoration: 'none',
            boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
            transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)', display: 'inline-block',
          }}
            onMouseEnter={e => { e.target.style.background = '#FF4D00'; e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 8px 32px rgba(255,77,0,0.3)'; }}
            onMouseLeave={e => { e.target.style.background = '#0A0A0A'; e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = '0 4px 24px rgba(0,0,0,0.15)'; }}>
            Register your institute →
          </Link>
          <a href="#how" style={{
            background: 'white', color: '#0A0A0A', fontWeight: 600, fontSize: 16,
            padding: '16px 32px', borderRadius: 16, textDecoration: 'none',
            border: '1px solid #E5E5E3', display: 'inline-block',
            transition: 'all 0.2s cubic-bezier(0.16,1,0.3,1)',
          }}
            onMouseEnter={e => { e.target.style.borderColor = '#0A0A0A'; e.target.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.target.style.borderColor = '#E5E5E3'; e.target.style.transform = 'translateY(0)'; }}>
            See how it works
          </a>
        </div>

        {/* Social proof line */}
        <p style={{
          marginTop: 48, fontSize: 13, color: '#A3A3A0', fontWeight: 500,
          opacity: loaded ? 1 : 0, transition: 'all 0.7s ease 0.5s',
        }}>
          Trusted by schools and coaching centres across India
        </p>
      </div>

      {/* Hero dashboard mockup */}
      <div style={{
        marginTop: 72, width: '100%', maxWidth: 1000, position: 'relative', zIndex: 1,
        opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0) scale(1)' : 'translateY(32px) scale(0.97)',
        transition: 'all 0.9s cubic-bezier(0.16,1,0.3,1) 0.4s',
      }}>
        <DashboardMockup />
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(3deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(0.8); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}

// ── DASHBOARD MOCKUP ──────────────────────────────────────────────────────────
function DashboardMockup() {
  return (
    <div style={{
      background: 'white', borderRadius: 24, border: '1px solid #E5E5E3',
      boxShadow: '0 24px 80px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)',
      overflow: 'hidden',
    }}>
      {/* Browser chrome */}
      <div style={{ background: '#F5F5F3', borderBottom: '1px solid #E5E5E3',
                    padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['#FF5F57','#FFBD2E','#28CA41'].map(c => (
            <div key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }}/>
          ))}
        </div>
        <div style={{ flex: 1, background: 'white', borderRadius: 8, padding: '5px 12px',
                      fontSize: 12, color: '#A3A3A0', border: '1px solid #E5E5E3',
                      maxWidth: 280, margin: '0 auto' }}>
          app.streaksha.com/admin
        </div>
      </div>

      {/* Dashboard content */}
      <div style={{ display: 'flex', height: 420 }}>
        {/* Sidebar */}
        <div style={{ width: 180, background: '#FAFAF8', borderRight: '1px solid #F0F0EE',
                      padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                         marginBottom: 12 }}>
            <div style={{ width: 24, height: 24, background: '#0A0A0A', borderRadius: 6,
                           display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ color: 'white', fontSize: 10, fontWeight: 900 }}>S</span>
            </div>
            <span style={{ fontWeight: 900, fontSize: 13, color: '#0A0A0A' }}>Streaksha</span>
          </div>
          {[
            { label: 'Overview', active: true },
            { label: 'Teachers', active: false },
            { label: 'Students', active: false },
            { label: 'Batches', active: false },
            { label: 'Quizzes', active: false },
          ].map(item => (
            <div key={item.label} style={{
              padding: '8px 10px', borderRadius: 10, fontSize: 12, fontWeight: 500,
              background: item.active ? '#0A0A0A' : 'transparent',
              color: item.active ? 'white' : '#6B6B6B',
            }}>
              {item.label}
            </div>
          ))}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: '24px', overflow: 'hidden' }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#0A0A0A',
                         letterSpacing: '-0.03em', marginBottom: 4 }}>
            Good morning, Admin 👋
          </div>
          <div style={{ fontSize: 12, color: '#A3A3A0', marginBottom: 20 }}>
            DPS Ludhiana — 3 quizzes live today
          </div>

          {/* Stat cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 20 }}>
            {[
              { label: 'Students', value: '847', color: '#FF4D00', bg: '#FFF0EB' },
              { label: 'Teachers', value: '34', color: '#2563EB', bg: '#EFF6FF' },
              { label: 'Quizzes', value: '128', color: '#16A34A', bg: '#F0FDF4' },
              { label: 'Attempts', value: '2.4k', color: '#9333EA', bg: '#FAF5FF' },
            ].map(s => (
              <div key={s.label} style={{
                background: s.bg, borderRadius: 12, padding: '12px',
                border: `1px solid ${s.color}22`,
              }}>
                <div style={{ fontSize: 20, fontWeight: 900, color: s.color,
                               letterSpacing: '-0.03em' }}>{s.value}</div>
                <div style={{ fontSize: 11, color: '#6B6B6B', fontWeight: 500 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Quiz table preview */}
          <div style={{ background: '#FAFAF8', borderRadius: 12, border: '1px solid #E5E5E3',
                         overflow: 'hidden' }}>
            <div style={{ padding: '10px 14px', borderBottom: '1px solid #E5E5E3',
                           fontSize: 11, fontWeight: 700, color: '#A3A3A0',
                           textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Recent Quizzes
            </div>
            {[
              { name: 'Physics Unit Test 3', batch: 'Class 12-A', status: 'Live', statusColor: '#16A34A', statusBg: '#F0FDF4' },
              { name: 'Chemistry Mid-Term', batch: 'Class 11-B', status: 'Draft', statusColor: '#6B6B6B', statusBg: '#F5F5F3' },
              { name: 'Maths Weekly Quiz', batch: 'JEE Batch', status: 'Done', statusColor: '#2563EB', statusBg: '#EFF6FF' },
            ].map((q, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '10px 14px', borderBottom: i < 2 ? '1px solid #F0F0EE' : 'none',
              }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#0A0A0A' }}>{q.name}</div>
                  <div style={{ fontSize: 11, color: '#A3A3A0' }}>{q.batch}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, color: q.statusColor,
                                background: q.statusBg, padding: '3px 10px', borderRadius: 99 }}>
                  {q.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── STATS TICKER ─────────────────────────────────────────────────────────────
function StatsTicker() {
  return (
    <section style={{ padding: '60px 0', background: '#0A0A0A', overflow: 'hidden' }}>
      <div style={{
        display: 'flex', gap: 0,
        animation: 'marquee 20s linear infinite',
        width: 'max-content',
      }}>
        {[...STATS, ...STATS].map((s, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', gap: 48,
            padding: '0 60px', borderRight: '1px solid rgba(255,255,255,0.1)',
          }}>
            <div>
              <div style={{ fontSize: 48, fontWeight: 900, color: 'white',
                             letterSpacing: '-0.04em', lineHeight: 1 }}>
                {s.value}
              </div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)',
                             fontWeight: 500, marginTop: 4 }}>
                {s.label}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── FEATURES ─────────────────────────────────────────────────────────────────
function Features() {
  const [ref, visible] = useInView();
  return (
    <section id="features" ref={ref} style={{ padding: '120px 32px', maxWidth: 1200,
                                               margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 72, maxWidth: 560 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#FF4D00',
                        textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Everything you need
        </span>
        <h2 style={{ fontSize: 'clamp(36px,5vw,60px)', fontWeight: 900,
                      letterSpacing: '-0.03em', color: '#0A0A0A', marginTop: 12,
                      lineHeight: 1.05 }}>
          One platform.<br/>Every assessment need.
        </h2>
      </div>

      {/* Feature grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
        {FEATURES.map((f, i) => (
          <div key={i} style={{
            background: f.bg, borderRadius: 24, padding: '40px',
            border: `1px solid ${f.accent}22`,
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(24px)',
            transition: `all 0.7s cubic-bezier(0.16,1,0.3,1) ${i * 0.1}s`,
            cursor: 'default',
            position: 'relative', overflow: 'hidden',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 16px 48px ${f.accent}18`; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
            {/* Decorative circle */}
            <div style={{
              position: 'absolute', right: -20, top: -20,
              width: 120, height: 120, borderRadius: '50%',
              background: `${f.accent}10`, pointerEvents: 'none',
            }}/>
            <div style={{ fontSize: 11, fontWeight: 700, color: f.accent,
                           textTransform: 'uppercase', letterSpacing: '0.08em',
                           marginBottom: 20 }}>
              {f.tag}
            </div>
            <h3 style={{ fontSize: 28, fontWeight: 900, color: '#0A0A0A',
                          letterSpacing: '-0.03em', marginBottom: 14, lineHeight: 1.1 }}>
              {f.title}
            </h3>
            <p style={{ fontSize: 15, color: '#6B6B6B', lineHeight: 1.7 }}>
              {f.body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── HOW IT WORKS ──────────────────────────────────────────────────────────────
function HowItWorks() {
  const [ref, visible] = useInView();
  return (
    <section id="how" style={{ padding: '120px 32px', background: '#F5F5F3' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 80 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#FF4D00',
                          textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Get started in minutes
          </span>
          <h2 style={{ fontSize: 'clamp(36px,5vw,60px)', fontWeight: 900,
                        letterSpacing: '-0.03em', color: '#0A0A0A', marginTop: 12,
                        lineHeight: 1.05 }}>
            From signup to first quiz<br/>in under an hour.
          </h2>
        </div>

        <div ref={ref} style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24 }}>
          {HOW_IT_WORKS.map((h, i) => (
            <div key={i} style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(24px)',
              transition: `all 0.7s cubic-bezier(0.16,1,0.3,1) ${i * 0.12}s`,
            }}>
              <div style={{
                fontSize: 11, fontWeight: 700, color: '#FF4D00',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                marginBottom: 16,
              }}>
                Step {h.step}
              </div>
              {/* Step number big */}
              <div style={{
                fontSize: 72, fontWeight: 900, color: '#E5E5E3',
                letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 16,
              }}>
                {h.step}
              </div>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#0A0A0A',
                            letterSpacing: '-0.02em', marginBottom: 10 }}>
                {h.title}
              </h3>
              <p style={{ fontSize: 14, color: '#6B6B6B', lineHeight: 1.7 }}>
                {h.body}
              </p>
            </div>
          ))}
        </div>

        {/* CTA inside section */}
        <div style={{ textAlign: 'center', marginTop: 72 }}>
          <Link href="/register" style={{
            background: '#0A0A0A', color: 'white', fontWeight: 700, fontSize: 16,
            padding: '16px 40px', borderRadius: 16, textDecoration: 'none',
            display: 'inline-block', transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.target.style.background = '#FF4D00'; e.target.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.target.style.background = '#0A0A0A'; e.target.style.transform = 'translateY(0)'; }}>
            Start for free →
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── QUIZ ENGINE HIGHLIGHT ─────────────────────────────────────────────────────
function QuizEngineSection() {
  const [ref, visible] = useInView();
  const features = [
    'Server-side timer — client can\'t cheat time',
    'Tab-switch + fullscreen violation detection',
    'Auto-save every 30s — no lost answers',
    'Question randomization per student',
    'Instant scoring on submit',
    'Violation report for every session',
  ];

  return (
    <section style={{ padding: '120px 32px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div ref={ref} style={{
          background: '#0A0A0A', borderRadius: 32, overflow: 'hidden',
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          opacity: visible ? 1 : 0, transform: visible ? 'scale(1)' : 'scale(0.97)',
          transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1)',
        }}>
          {/* Left text */}
          <div style={{ padding: '64px' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#FF4D00',
                            textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Quiz engine
            </span>
            <h2 style={{ fontSize: 'clamp(28px,3.5vw,44px)', fontWeight: 900,
                          letterSpacing: '-0.03em', color: 'white', marginTop: 16,
                          lineHeight: 1.1, marginBottom: 32 }}>
              HackerEarth-grade<br/>
              <span style={{ color: '#FF4D00' }}>proctoring</span> for<br/>
              every school.
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {features.map((f, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12,
                  opacity: visible ? 1 : 0,
                  transition: `all 0.5s ease ${0.3 + i * 0.08}s`,
                  transform: visible ? 'translateX(0)' : 'translateX(-12px)',
                }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6,
                                  background: '#FF4D00', flexShrink: 0, marginTop: 1,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ color: 'white', fontSize: 11, fontWeight: 700 }}>✓</span>
                  </div>
                  <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>
                    {f}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right — quiz mockup */}
          <div style={{ background: '#111', display: 'flex', alignItems: 'center',
                         justifyContent: 'center', padding: 40 }}>
            <QuizMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

function QuizMockup() {
  const [selected, setSelected] = useState(null);
  return (
    <div style={{ background: '#1A1A1A', borderRadius: 20, width: '100%',
                   maxWidth: 380, border: '1px solid rgba(255,255,255,0.08)',
                   overflow: 'hidden' }}>
      {/* Timer bar */}
      <div style={{ background: '#222', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.06)',
                     display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
          Physics — Unit Test 3
        </span>
        <span style={{ fontSize: 14, fontWeight: 800, color: '#FF4D00', fontVariantNumeric: 'tabular-nums' }}>
          23:47
        </span>
      </div>

      {/* Progress */}
      <div style={{ height: 3, background: 'rgba(255,255,255,0.08)' }}>
        <div style={{ width: '40%', height: '100%', background: '#FF4D00',
                       transition: 'width 0.3s ease' }}/>
      </div>

      <div style={{ padding: 20 }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 12,
                       fontWeight: 500 }}>
          Question 4 of 10
        </div>
        <p style={{ fontSize: 14, color: 'white', lineHeight: 1.6, marginBottom: 20,
                     fontWeight: 500 }}>
          A body is thrown vertically upward with velocity u. The maximum height attained is:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {['u²/g', 'u²/2g', '2u²/g', 'u/2g'].map((opt, i) => (
            <button key={i} onClick={() => setSelected(i)} style={{
              padding: '11px 14px', borderRadius: 10, border: '1px solid',
              textAlign: 'left', cursor: 'pointer', fontSize: 13, fontWeight: 500,
              transition: 'all 0.15s',
              background: selected === i ? '#FF4D00' : 'rgba(255,255,255,0.04)',
              borderColor: selected === i ? '#FF4D00' : 'rgba(255,255,255,0.1)',
              color: selected === i ? 'white' : 'rgba(255,255,255,0.7)',
            }}>
              <span style={{ opacity: 0.5, marginRight: 8, fontSize: 11 }}>
                {String.fromCharCode(65 + i)}.
              </span>
              {opt}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button style={{ flex: 1, padding: '10px', borderRadius: 10,
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'rgba(255,255,255,0.5)', fontSize: 13, cursor: 'pointer' }}>
            ← Prev
          </button>
          <button style={{ flex: 1, padding: '10px', borderRadius: 10,
                            background: '#FF4D00', border: 'none',
                            color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
            Next →
          </button>
        </div>
      </div>
    </div>
  );
}

// ── TESTIMONIALS ─────────────────────────────────────────────────────────────
function Testimonials() {
  const [ref, visible] = useInView();
  return (
    <section style={{ padding: '120px 32px', background: '#F5F5F3' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 72 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#FF4D00',
                          textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            What educators say
          </span>
          <h2 style={{ fontSize: 'clamp(36px,5vw,56px)', fontWeight: 900,
                        letterSpacing: '-0.03em', color: '#0A0A0A', marginTop: 12,
                        lineHeight: 1.05 }}>
            Real schools. Real results.
          </h2>
        </div>
        <div ref={ref} style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
          {TESTIMONIALS.map((t, i) => (
            <div key={i} style={{
              background: 'white', borderRadius: 24, padding: '36px',
              border: '1px solid #E5E5E3',
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(24px)',
              transition: `all 0.7s cubic-bezier(0.16,1,0.3,1) ${i * 0.12}s`,
            }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}>
              {/* Quote mark */}
              <div style={{ fontSize: 48, color: '#E5E5E3', lineHeight: 1,
                             fontWeight: 900, marginBottom: 16, fontFamily: 'Georgia, serif' }}>
                "
              </div>
              <p style={{ fontSize: 15, color: '#3A3A3A', lineHeight: 1.75,
                           marginBottom: 28, fontWeight: 400 }}>
                {t.text}
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: '50%',
                               background: t.color, display: 'flex', alignItems: 'center',
                               justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 13, fontWeight: 800, color: t.textColor }}>
                    {t.initials}
                  </span>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0A' }}>
                    {t.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#A3A3A0' }}>
                    {t.role}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── PRICING TEASER ────────────────────────────────────────────────────────────
function PricingTeaser() {
  const [ref, visible] = useInView();
  return (
    <section style={{ padding: '120px 32px' }}>
      <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#FF4D00',
                        textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Pricing
        </span>
        <h2 style={{ fontSize: 'clamp(36px,5vw,60px)', fontWeight: 900,
                      letterSpacing: '-0.03em', color: '#0A0A0A', marginTop: 12,
                      lineHeight: 1.05, marginBottom: 20 }}>
          One flat price.<br/>No surprises.
        </h2>
        <p style={{ fontSize: 17, color: '#6B6B6B', lineHeight: 1.7, marginBottom: 48 }}>
          Flat annual subscription per institution. No per-student fees. No hidden charges.
          GST invoice included — your finance team will love you.
        </p>
        <div ref={ref} style={{
          background: '#0A0A0A', borderRadius: 28, padding: '52px 48px',
          opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1)',
          position: 'relative', overflow: 'hidden',
        }}>
          {/* BG decoration */}
          <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200,
                         borderRadius: '50%', background: 'rgba(255,77,0,0.1)', pointerEvents: 'none' }}/>
          <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', marginBottom: 8,
                         fontWeight: 500 }}>
            Starting from
          </div>
          <div style={{ fontSize: 64, fontWeight: 900, color: 'white',
                         letterSpacing: '-0.04em', lineHeight: 1, marginBottom: 8 }}>
            ₹999
            <span style={{ fontSize: 20, color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
              /month
            </span>
          </div>
          <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 40 }}>
            Billed annually · GST invoice provided · Up to 500 students
          </div>
          <Link href="/register" style={{
            background: '#FF4D00', color: 'white', fontWeight: 700, fontSize: 16,
            padding: '16px 36px', borderRadius: 14, textDecoration: 'none',
            display: 'inline-block', transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.target.style.background = 'white'; e.target.style.color = '#FF4D00'; e.target.style.transform = 'translateY(-2px)'; }}
            onMouseLeave={e => { e.target.style.background = '#FF4D00'; e.target.style.color = 'white'; e.target.style.transform = 'translateY(0)'; }}>
            Get started today →
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── FINAL CTA ─────────────────────────────────────────────────────────────────
function FinalCTA() {
  return (
    <section style={{ padding: '0 32px 120px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{
          background: 'linear-gradient(135deg, #FF4D00 0%, #FF6B35 100%)',
          borderRadius: 32, padding: '80px 64px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexWrap: 'wrap', gap: 40, position: 'relative', overflow: 'hidden',
        }}>
          {/* BG decoration */}
          <div style={{ position: 'absolute', right: -60, bottom: -60, width: 300, height: 300,
                         borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }}/>
          <div style={{ position: 'absolute', right: 100, top: -40, width: 200, height: 200,
                         borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }}/>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{ fontSize: 'clamp(32px,4vw,52px)', fontWeight: 900, color: 'white',
                          letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 12 }}>
              Ready to go paper-free?
            </h2>
            <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.75)', maxWidth: 440 }}>
              Join schools across India running smarter assessments with Streaksha.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
            <Link href="/register" style={{
              background: 'white', color: '#FF4D00', fontWeight: 800, fontSize: 16,
              padding: '16px 36px', borderRadius: 14, textDecoration: 'none',
              transition: 'all 0.2s', display: 'inline-block',
            }}
              onMouseEnter={e => { e.target.style.transform = 'translateY(-2px)'; e.target.style.boxShadow = '0 8px 24px rgba(0,0,0,0.2)'; }}
              onMouseLeave={e => { e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = 'none'; }}>
              Register your institute →
            </Link>
            <Link href="/login" style={{
              background: 'rgba(255,255,255,0.15)', color: 'white', fontWeight: 600, fontSize: 16,
              padding: '16px 36px', borderRadius: 14, textDecoration: 'none',
              border: '1px solid rgba(255,255,255,0.3)', transition: 'all 0.2s', display: 'inline-block',
            }}
              onMouseEnter={e => { e.target.style.background = 'rgba(255,255,255,0.25)'; }}
              onMouseLeave={e => { e.target.style.background = 'rgba(255,255,255,0.15)'; }}>
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

// ── FOOTER ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer style={{ borderTop: '1px solid #E5E5E3', padding: '48px 32px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto',
                     display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                     flexWrap: 'wrap', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 28, height: 28, background: '#0A0A0A', borderRadius: 7,
                         display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontSize: 12, fontWeight: 900 }}>S</span>
          </div>
          <span style={{ fontWeight: 900, fontSize: 16, color: '#0A0A0A' }}>Streaksha</span>
        </div>
        <p style={{ fontSize: 13, color: '#A3A3A0' }}>
          © 2025 Streaksha. Quiz platform for Indian institutions.
        </p>
        <div style={{ display: 'flex', gap: 24 }}>
          {['Privacy', 'Terms', 'Contact'].map(l => (
            <a key={l} href="#" style={{ fontSize: 13, color: '#A3A3A0', textDecoration: 'none',
                                          transition: 'color 0.15s' }}
              onMouseEnter={e => { e.target.style.color = '#0A0A0A'; }}
              onMouseLeave={e => { e.target.style.color = '#A3A3A0'; }}>
              {l}
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

// ── PAGE ──────────────────────────────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div style={{ background: '#FAFAF8', minHeight: '100vh',
                   fontFamily: "'Inter', sans-serif" }}>
      <Navbar />
      <Hero />
      <StatsTicker />
      <Features />
      <HowItWorks />
      <QuizEngineSection />
      <Testimonials />
      <PricingTeaser />
      <FinalCTA />
      <Footer />
    </div>
  );
}