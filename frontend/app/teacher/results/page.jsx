'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, BarChart3, Users, Target, TrendingUp } from 'lucide-react';

function StatCard({ label, value, icon: Icon, accent = '#0A0A0A' }) {
  return (
    <div style={{ background: 'white', borderRadius: 18, padding: 20, border: '1px solid #E5E5E3' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 12, background: '#F5F5F3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color={accent} />
        </div>
        <span style={{ fontSize: 12, color: '#6B6B6B', fontWeight: 600 }}>{label}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 900, color: '#0A0A0A' }}>{value}</div>
    </div>
  );
}

export default function TeacherResultsPage() {
  const router = useRouter();
  const [quizzes, setQuizzes] = useState([]);
  const [selectedQuizId, setSelectedQuizId] = useState('');
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [results, setResults] = useState([]);
  const [loadingQuizzes, setLoadingQuizzes] = useState(true);
  const [loadingResults, setLoadingResults] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let active = true;
    async function loadQuizzes() {
      try {
        const response = await api.get('/quizzes?limit=100');
        if (!active) return;
        const list = response.data?.data?.quizzes || [];
        setQuizzes(list);
        if (list.length > 0) setSelectedQuizId(String(list[0].id));
      } catch {
        if (active) setError('Failed to load quizzes');
      } finally {
        if (active) setLoadingQuizzes(false);
      }
    }

    loadQuizzes();
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!selectedQuizId) return;
    let active = true;
    setLoadingResults(true);
    setError(null);

    Promise.all([
      api.get(`/quizzes/${selectedQuizId}`),
      api.get(`/sessions/quiz/${selectedQuizId}/results`),
    ])
      .then(([quizRes, resultsRes]) => {
        if (!active) return;
        setSelectedQuiz(quizRes.data?.data || null);
        setResults(resultsRes.data?.data?.results || []);
      })
      .catch(() => {
        if (active) {
          setSelectedQuiz(null);
          setResults([]);
          setError('Failed to load quiz results');
        }
      })
      .finally(() => {
        if (active) setLoadingResults(false);
      });

    return () => { active = false; };
  }, [selectedQuizId]);

  const stats = useMemo(() => {
    if (!results.length) return null;
    const totalMarks = results[0]?.total_marks || selectedQuiz?.total_marks || 0;
    const scores = results.map(result => Number(result.scored_marks || 0));
    const attempts = results.length;
    const average = scores.reduce((sum, score) => sum + score, 0) / attempts;
    const max = Math.max(...scores);
    const passThreshold = totalMarks ? totalMarks * 0.4 : 0;
    const passed = results.filter(result => Number(result.scored_marks || 0) >= passThreshold).length;

    return {
      attempts,
      average: Number.isFinite(average) ? average.toFixed(2) : '0.00',
      max,
      passRate: attempts ? ((passed / attempts) * 100).toFixed(1) : '0.0',
      totalMarks,
    };
  }, [results, selectedQuiz]);

  if (!mounted) return null;

  return (
    <div style={{
      opacity: mounted ? 1 : 0,
      transform: mounted ? 'translateY(0)' : 'translateY(12px)',
      transition: 'all 0.5s cubic-bezier(0.16,1,0.3,1)',
      fontFamily: "'Inter', sans-serif",
    }}>
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={() => router.back()}
          style={{ background: 'white', border: '1px solid #E5E5E3', borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          <ArrowLeft size={18} color="#0A0A0A" />
        </button>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0A0A0A', letterSpacing: '-0.02em' }}>Teacher Results</h1>
          <p style={{ fontSize: 13, color: '#6B6B6B', marginTop: 4 }}>View quiz-wise analytics and student outcomes</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24 }}>
        <div style={{ background: 'white', borderRadius: 20, padding: 20, border: '1px solid #E5E5E3', height: 'fit-content' }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0A0A0A', marginBottom: 14 }}>Quizzes</h2>
          {loadingQuizzes ? (
            <div style={{ fontSize: 13, color: '#6B6B6B' }}>Loading quizzes...</div>
          ) : quizzes.length > 0 ? (
            <div style={{ display: 'grid', gap: 10 }}>
              {quizzes.map(quiz => {
                const active = String(quiz.id) === String(selectedQuizId);
                return (
                  <button
                    key={quiz.id}
                    onClick={() => setSelectedQuizId(String(quiz.id))}
                    style={{
                      textAlign: 'left', padding: 14, borderRadius: 14,
                      border: active ? '2px solid #0A0A0A' : '1px solid #E5E5E3',
                      background: active ? '#F5F5F3' : 'white', cursor: 'pointer'
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#0A0A0A', marginBottom: 4 }}>{quiz.title}</div>
                    <div style={{ fontSize: 11, color: '#6B6B6B' }}>{quiz.subject_name} · {quiz.batch_name}</div>
                    <div style={{ fontSize: 11, color: '#A3A3A0', marginTop: 6 }}>
                      {quiz.status} · {quiz.question_count || 0} questions
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div style={{ fontSize: 13, color: '#6B6B6B' }}>No quizzes found</div>
          )}
        </div>

        <div style={{ display: 'grid', gap: 24 }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 24, border: '1px solid #E5E5E3' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0A0A0A', marginBottom: 10 }}>
              {selectedQuiz?.title || 'Quiz Results'}
            </h2>
            <p style={{ fontSize: 13, color: '#6B6B6B' }}>
              {selectedQuiz ? `${selectedQuiz.subject_name} · ${selectedQuiz.batch_name}` : 'Select a quiz to see results'}
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            <StatCard label="Total Attempts" value={stats?.attempts || '—'} icon={Users} accent="#2563EB" />
            <StatCard label="Average Score" value={stats ? `${stats.average}/${stats.totalMarks}` : '—'} icon={TrendingUp} accent="#FF4D00" />
            <StatCard label="Highest Score" value={stats?.max || '—'} icon={Target} accent="#16A34A" />
            <StatCard label="Pass Rate" value={stats ? `${stats.passRate}%` : '—'} icon={BarChart3} accent="#7C3AED" />
          </div>

          <div style={{ background: 'white', borderRadius: 20, padding: 24, border: '1px solid #E5E5E3' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0A0A0A', marginBottom: 16 }}>Student Results</h2>

            {loadingResults ? (
              <div style={{ fontSize: 13, color: '#6B6B6B' }}>Loading results...</div>
            ) : error ? (
              <div style={{ fontSize: 13, color: '#DC2626' }}>{error}</div>
            ) : results.length > 0 ? (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #E5E5E3' }}>
                      <th style={{ textAlign: 'left', padding: '12px 8px', color: '#6B6B6B' }}>Student</th>
                      <th style={{ textAlign: 'center', padding: '12px 8px', color: '#6B6B6B' }}>Score</th>
                      <th style={{ textAlign: 'center', padding: '12px 8px', color: '#6B6B6B' }}>Percentage</th>
                      <th style={{ textAlign: 'center', padding: '12px 8px', color: '#6B6B6B' }}>Status</th>
                      <th style={{ textAlign: 'center', padding: '12px 8px', color: '#6B6B6B' }}>Violations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map(result => {
                      const percentage = result.total_marks ? ((result.scored_marks / result.total_marks) * 100).toFixed(1) : '0.0';
                      const passed = result.total_marks ? Number(result.scored_marks || 0) >= result.total_marks * 0.4 : false;
                      return (
                        <tr key={result.session_id || result.student_id} style={{ borderBottom: '1px solid #F5F5F3' }}>
                          <td style={{ padding: '14px 8px', color: '#0A0A0A', fontWeight: 600 }}>{result.student_name}</td>
                          <td style={{ padding: '14px 8px', textAlign: 'center', color: '#0A0A0A', fontWeight: 600 }}>{result.scored_marks}/{result.total_marks}</td>
                          <td style={{ padding: '14px 8px', textAlign: 'center', color: '#0A0A0A', fontWeight: 600 }}>{percentage}%</td>
                          <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                            <span style={{
                              display: 'inline-block', padding: '4px 10px', borderRadius: 999,
                              fontSize: 11, fontWeight: 700,
                              color: passed ? '#16A34A' : '#DC2626',
                              background: passed ? '#F0FDF4' : '#FEF2F2',
                            }}>
                              {passed ? 'Passed' : 'Failed'}
                            </span>
                          </td>
                          <td style={{ padding: '14px 8px', textAlign: 'center', color: '#6B6B6B' }}>{result.violation_count || 0}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#6B6B6B' }}>No results yet for this quiz.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
