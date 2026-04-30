'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, BarChart3, CalendarClock, CheckCircle2, Search, ShieldAlert, Trophy } from 'lucide-react';

function formatDate(value) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function ResultCard({ item }) {
  const passed = Number(item.percentage || 0) >= 35;

  return (
    <div style={{
      background: 'white',
      border: '1px solid #E7E3DD',
      borderRadius: 24,
      padding: 22,
      display: 'grid',
      gap: 14,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 999, background: passed ? '#ECFDF5' : '#FEF2F2', color: passed ? '#047857' : '#B91C1C', fontSize: 12, fontWeight: 800, marginBottom: 10 }}>
            {passed ? <CheckCircle2 size={13} /> : <ShieldAlert size={13} />}
            {passed ? 'Passed' : 'Needs review'}
          </div>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.15 }}>
            {item.title}
          </h3>
          <div style={{ marginTop: 7, fontSize: 13, color: '#7A7167' }}>
            {item.subject_name} · Session {item.session_id}
          </div>
        </div>
        <div style={{ minWidth: 100, textAlign: 'right' }}>
          <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.05em', color: '#111111' }}>
            {Math.round(Number(item.percentage || 0))}%
          </div>
          <div style={{ fontSize: 12, color: '#7A7167', fontWeight: 700 }}>Score</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        <div style={{ background: '#FAF8F5', borderRadius: 16, padding: 12 }}>
          <div style={{ fontSize: 11, color: '#7A7167', fontWeight: 700, textTransform: 'uppercase' }}>Scored Marks</div>
          <div style={{ marginTop: 5, fontSize: 15, fontWeight: 800 }}>{item.scored_marks ?? 0}</div>
        </div>
        <div style={{ background: '#FAF8F5', borderRadius: 16, padding: 12 }}>
          <div style={{ fontSize: 11, color: '#7A7167', fontWeight: 700, textTransform: 'uppercase' }}>Total Marks</div>
          <div style={{ marginTop: 5, fontSize: 15, fontWeight: 800 }}>{item.total_marks || 0}</div>
        </div>
        <div style={{ background: '#FAF8F5', borderRadius: 16, padding: 12 }}>
          <div style={{ fontSize: 11, color: '#7A7167', fontWeight: 700, textTransform: 'uppercase' }}>Grade</div>
          <div style={{ marginTop: 5, fontSize: 15, fontWeight: 800 }}>{item.grade || 'N/A'}</div>
        </div>
        <div style={{ background: '#FAF8F5', borderRadius: 16, padding: 12 }}>
          <div style={{ fontSize: 11, color: '#7A7167', fontWeight: 700, textTransform: 'uppercase' }}>Rank</div>
          <div style={{ marginTop: 5, fontSize: 15, fontWeight: 800 }}>{item.rank ? `#${item.rank}` : 'N/A'}</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, fontSize: 13, color: '#6F655C' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><CalendarClock size={14} />{formatDate(item.start_time)}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><BarChart3 size={14} />Violations: {item.violation_count || 0}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Trophy size={14} />Quiz ID {item.quiz_id}</span>
      </div>
    </div>
  );
}

export default function StudentResultsPage() {
  const searchParams = useSearchParams();
  const quizIdFilter = searchParams.get('quizId');
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setError('');
        const res = await api.get('/profile/my-quizzes', { params: { limit: 100, page: 1 } });
        if (!active) return;
        setHistory(res.data?.data?.quizzes || []);
      } catch (err) {
        if (active) setError(err.response?.data?.message || 'Failed to load results');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    return history.filter((item) => {
      const matchesQuiz = quizIdFilter ? String(item.quiz_id) === String(quizIdFilter) : true;
      const text = `${item.title} ${item.subject_name} ${item.grade || ''}`.toLowerCase();
      return matchesQuiz && text.includes(search.toLowerCase());
    });
  }, [history, search, quizIdFilter]);

  return (
    <div style={{
      fontFamily: 'Segoe UI, sans-serif',
      color: '#111111',
      padding: '8px 0 24px',
    }}>
      <div style={{ marginBottom: 24 }}>
        <Link href="/student" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 16, border: '1px solid #E7E3DD', background: 'white', color: '#111111', fontSize: 13, fontWeight: 800 }}>
            <ArrowLeft size={14} />
            Back to dashboard
          </div>
        </Link>
      </div>

      <div style={{
        borderRadius: 32,
        padding: '28px clamp(18px, 4vw, 32px)',
        background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF7ED 100%)',
        border: '1px solid #E8E1D8',
        marginBottom: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: '#8A8177', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>
              Results
            </div>
            <h1 style={{ margin: 0, fontSize: 'clamp(30px, 4.5vw, 50px)', lineHeight: 1.02, letterSpacing: '-0.06em', fontWeight: 900 }}>
              Your attempts and outcomes
            </h1>
            <p style={{ margin: '12px 0 0', fontSize: 'clamp(15px, 1.8vw, 17px)', lineHeight: 1.6, color: '#655B51', maxWidth: 760 }}>
              Review your submitted quizzes, track scores, and keep an eye on violations or grades in one clean view.
            </p>
          </div>

          <div style={{ minWidth: 280, display: 'grid', gap: 10, flex: 1, maxWidth: 420 }}>
            <div style={{ position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#8A8177' }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by quiz or subject"
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '13px 14px 13px 42px',
                  borderRadius: 16,
                  border: '1px solid #E7E3DD',
                  background: 'white',
                  fontSize: 14,
                  outline: 'none',
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div style={{ marginBottom: 20, padding: '14px 16px', borderRadius: 16, background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', fontSize: 14, fontWeight: 600 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gap: 16 }}>
        {loading ? (
          <div style={{ display: 'grid', gap: 16 }}>
            {[1, 2, 3].map((item) => (
              <div key={item} style={{ height: 220, borderRadius: 24, background: 'white', border: '1px solid #E7E3DD' }} />
            ))}
          </div>
        ) : filtered.length > 0 ? (
          filtered.map((item) => <ResultCard key={item.session_id} item={item} />)
        ) : (
          <div style={{
            border: '1px dashed #DCCFC4',
            borderRadius: 24,
            padding: 28,
            background: '#FFFDFB',
            color: '#7A7167',
            fontSize: 14,
          }}>
            No results found for the current filter.
          </div>
        )}
      </div>
    </div>
  );
}