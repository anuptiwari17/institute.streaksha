'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, TrendingUp, Users, Target } from 'lucide-react';

function Skeleton({ w = '100%', h = 20, radius = 8 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: radius,
      background: 'linear-gradient(90deg, #F0F0EE 25%, #E8E8E6 50%, #F0F0EE 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.4s infinite',
    }}/>
  );
}

function StatCard({ label, value, icon: Icon, color, bg, loading }) {
  return (
    <div style={{
      background: 'white', borderRadius: 16, padding: 20,
      border: '1px solid #E5E5E3'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
        <div style={{
          width: 40, height: 40, background: bg, borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Icon size={18} color={color}/>
        </div>
        <span style={{ fontSize: 12, color: '#6B6B6B', fontWeight: 500 }}>{label}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color: '#0A0A0A' }}>
        {loading ? <Skeleton w={100} h={28}/> : value}
      </div>
    </div>
  );
}

export default function QuizResults() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.quizId;

  const [quiz, setQuiz] = useState(null);
  const [results, setResults] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!quizId) return;
    setLoading(true);
    Promise.all([
      api.get(`/quizzes/${quizId}`).catch(() => null),
      api.get(`/sessions/quiz/${quizId}/results`).catch(() => null),
    ]).then(([quizRes, resultsRes]) => {
      if (quizRes?.data?.data) setQuiz(quizRes.data.data);
      if (resultsRes?.data?.data?.results) {
        const resultsData = resultsRes.data.data.results;
        setResults(resultsData);

        // Calculate stats
        if (resultsData.length > 0) {
          const scores = resultsData.map(r => r.scored_marks || 0);
          const totalMarks = resultsData[0].total_marks || 100;
          const avgScore = (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2);
          const maxScore = Math.max(...scores);
          const minScore = Math.min(...scores);
          const passCount = resultsData.filter(r => (r.scored_marks || 0) >= (totalMarks * 0.4)).length;

          setStats({
            attempts: resultsData.length,
            avgScore,
            maxScore,
            minScore,
            passPercentage: ((passCount / resultsData.length) * 100).toFixed(1),
            totalMarks,
          });
        }
      }
    }).finally(() => setLoading(false));
  }, [quizId]);

  if (!mounted) return null;

  return (
    <div style={{
      opacity: mounted ? 1 : 0,
      transform: mounted ? 'translateY(0)' : 'translateY(12px)',
      transition: 'all 0.5s cubic-bezier(0.16,1,0.3,1)',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Header */}
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => router.back()}
          style={{
            background: 'white', border: '1px solid #E5E5E3', borderRadius: 10,
            width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = '#F5F5F3'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}>
          <ArrowLeft size={18} color="#0A0A0A"/>
        </button>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0A0A0A', letterSpacing: '-0.02em' }}>
            {loading ? <Skeleton w={300} h={32}/> : quiz?.title || 'Quiz Results'}
          </h1>
          {!loading && quiz && (
            <p style={{ fontSize: 13, color: '#6B6B6B', marginTop: 4 }}>
              {quiz.subject_name} · {quiz.batch_name}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <StatCard label="Total Attempts" value={stats?.attempts || '—'} icon={Users} color="#2563EB" bg="#EFF6FF" loading={loading}/>
        <StatCard label="Average Score" value={stats ? `${stats.avgScore}/${stats.totalMarks}` : '—'} icon={TrendingUp} color="#FF4D00" bg="#FFF0EB" loading={loading}/>
        <StatCard label="Highest Score" value={stats?.maxScore || '—'} icon={Target} color="#16A34A" bg="#F0FDF4" loading={loading}/>
        <StatCard label="Pass Percentage" value={stats ? `${stats.passPercentage}%` : '—'} icon={TrendingUp} color="#9333EA" bg="#FAF5FF" loading={loading}/>
      </div>

      {/* Results Table */}
      <div style={{
        background: 'white', borderRadius: 20, padding: 24,
        border: '1px solid #E5E5E3'
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0A0A0A', marginBottom: 16 }}>
          Student Results ({results.length})
        </h2>

        {loading ? (
          <div>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                padding: '14px 0', borderBottom: '1px solid #F5F5F3',
                display: 'flex', gap: 12
              }}>
                <Skeleton w={40} h={40} radius={10}/>
                <div style={{ flex: 1 }}>
                  <Skeleton w="40%" h={14} style={{ marginBottom: 6 }}/>
                  <Skeleton w="60%" h={12}/>
                </div>
              </div>
            ))}
          </div>
        ) : results.length > 0 ? (
          <div style={{ overflowX: 'auto' }}>
            <table style={{
              width: '100%', borderCollapse: 'collapse',
              fontSize: 13
            }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #E5E5E3' }}>
                  <th style={{ textAlign: 'left', padding: '12px 8px', fontWeight: 600, color: '#6B6B6B' }}>Student</th>
                  <th style={{ textAlign: 'center', padding: '12px 8px', fontWeight: 600, color: '#6B6B6B' }}>Score</th>
                  <th style={{ textAlign: 'center', padding: '12px 8px', fontWeight: 600, color: '#6B6B6B' }}>Percentage</th>
                  <th style={{ textAlign: 'center', padding: '12px 8px', fontWeight: 600, color: '#6B6B6B' }}>Status</th>
                  <th style={{ textAlign: 'center', padding: '12px 8px', fontWeight: 600, color: '#6B6B6B' }}>Attempts</th>
                </tr>
              </thead>
              <tbody>
                {results.map((result, i) => {
                  const percentage = ((result.scored_marks / result.total_marks) * 100).toFixed(1);
                  const isPassed = result.scored_marks >= (result.total_marks * 0.4);
                  return (
                    <tr key={i} style={{ borderBottom: '1px solid #F5F5F3' }}>
                      <td style={{ padding: '14px 8px', color: '#0A0A0A', fontWeight: 500 }}>
                        {result.student_name}
                      </td>
                      <td style={{ padding: '14px 8px', textAlign: 'center', color: '#0A0A0A', fontWeight: 600 }}>
                        {result.scored_marks}/{result.total_marks}
                      </td>
                      <td style={{ padding: '14px 8px', textAlign: 'center', color: '#0A0A0A', fontWeight: 600 }}>
                        {percentage}%
                      </td>
                      <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                        <span style={{
                          fontSize: 11, fontWeight: 700,
                          color: isPassed ? '#16A34A' : '#EF4444',
                          background: isPassed ? '#F0FDF4' : '#FEF2F2',
                          padding: '4px 10px', borderRadius: 6, display: 'inline-block'
                        }}>
                          {isPassed ? 'Passed' : 'Failed'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 8px', textAlign: 'center', color: '#6B6B6B' }}>
                        {result.violation_count || 0}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <Users size={32} color="#D3D3D1" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: 14, color: '#6B6B6B' }}>No results yet</p>
            <p style={{ fontSize: 12, color: '#A3A3A0', marginTop: 4 }}>
              Students will appear here after taking the quiz
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
