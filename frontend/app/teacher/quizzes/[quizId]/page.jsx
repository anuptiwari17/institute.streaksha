'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, Calendar, Clock, Users, FileText } from 'lucide-react';

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

export default function QuizDetail() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.quizId;

  const [quiz, setQuiz] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!quizId) return;
    setLoading(true);
    api.get(`/quizzes/${quizId}`)
      .then(res => {
        if (res.data?.data) {
          setQuiz(res.data.data);
          setQuestions(res.data.data.questions || []);
        }
      })
      .finally(() => setLoading(false));
  }, [quizId]);

  const typeConfig = {
    mcq_single: 'Single Choice',
    mcq_multiple: 'Multiple Choice',
    true_false: 'True/False',
    integer: 'Integer',
    fill_blank: 'Fill Blank',
  };

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
            {loading ? <Skeleton w={300} h={32}/> : quiz?.title || 'Quiz Details'}
          </h1>
          {!loading && quiz && (
            <p style={{ fontSize: 13, color: '#6B6B6B', marginTop: 4 }}>
              {quiz.subject_name} · {quiz.batch_name}
            </p>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 24 }}>
        {/* Main Content */}
        <div>
          {/* Questions */}
          <div style={{
            background: 'white', borderRadius: 20, padding: 24,
            border: '1px solid #E5E5E3'
          }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0A0A0A', marginBottom: 16 }}>
              Questions ({questions.length})
            </h2>

            {loading ? (
              <div>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #F5F5F3' }}>
                    <Skeleton h={16} w="70%" style={{ marginBottom: 8 }}/>
                    <Skeleton h={12} w="50%"/>
                  </div>
                ))}
              </div>
            ) : questions.length > 0 ? (
              <div>
                {questions.map((q, i) => (
                  <div key={q.id} style={{
                    padding: '16px', borderRadius: 12, marginBottom: 12,
                    background: '#F5F5F3'
                  }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: '#E5E5E3', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', flexShrink: 0, fontSize: 12, fontWeight: 700,
                        color: '#6B6B6B'
                      }}>
                        {i + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A', marginBottom: 8 }}>
                          {q.content?.text}
                        </p>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <span style={{
                            fontSize: 11, fontWeight: 600, color: '#6B6B6B',
                            background: 'white', padding: '4px 10px', borderRadius: 6
                          }}>
                            {typeConfig[q.type] || q.type}
                          </span>
                          <span style={{
                            fontSize: 11, fontWeight: 600,
                            color: q.difficulty === 'easy' ? '#16A34A' : q.difficulty === 'medium' ? '#F59E0B' : '#EF4444',
                            background: 'white', padding: '4px 10px', borderRadius: 6
                          }}>
                            {q.difficulty}
                          </span>
                        </div>

                        {/* Show options for MCQ */}
                        {(q.type === 'mcq_single' || q.type === 'mcq_multiple') && q.content?.options && (
                          <div style={{ marginTop: 10 }}>
                            {q.content.options.map((opt, idx) => (
                              <div key={idx} style={{
                                fontSize: 12, color: '#6B6B6B', marginBottom: 4,
                                padding: '6px 10px', background: 'white', borderRadius: 6
                              }}>
                                {String.fromCharCode(65 + idx)}) {opt}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <FileText size={32} color="#D3D3D1" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: 14, color: '#6B6B6B' }}>No questions in this quiz</p>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Summary */}
        <div style={{ position: 'sticky', top: 20, height: 'fit-content' }}>
          <div style={{
            background: 'white', borderRadius: 20, padding: 20,
            border: '1px solid #E5E5E3'
          }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0A', marginBottom: 16 }}>
              Quiz Summary
            </h3>

            {/* Status */}
            <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #E5E5E3' }}>
              <div style={{ fontSize: 12, color: '#6B6B6B', marginBottom: 4 }}>Status</div>
              <div style={{
                fontSize: 13, fontWeight: 700,
                color: quiz?.status === 'published' ? '#16A34A' : '#6B6B6B',
                background: quiz?.status === 'published' ? '#F0FDF4' : '#F5F5F3',
                padding: '6px 12px', borderRadius: 8, display: 'inline-block',
                textTransform: 'capitalize'
              }}>
                {quiz?.status}
              </div>
            </div>

            {/* Duration */}
            <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #E5E5E3' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <Clock size={14} color="#6B6B6B"/>
                <span style={{ fontSize: 12, color: '#6B6B6B', fontWeight: 500 }}>Duration</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A', marginLeft: 22 }}>
                {quiz?.config?.duration || '—'} minutes
              </div>
            </div>

            {/* Questions */}
            <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #E5E5E3' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <FileText size={14} color="#6B6B6B"/>
                <span style={{ fontSize: 12, color: '#6B6B6B', fontWeight: 500 }}>Questions</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A', marginLeft: 22 }}>
                {questions.length}
              </div>
            </div>

            {/* Total Marks */}
            <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid #E5E5E3' }}>
              <div style={{ fontSize: 12, color: '#6B6B6B', marginBottom: 4 }}>Total Marks</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A' }}>
                {quiz?.config?.totalMarks || questions.length}
              </div>
            </div>

            {/* Schedule */}
            {(quiz?.starts_at || quiz?.ends_at) && (
              <div>
                {quiz?.starts_at && (
                  <div style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <Calendar size={14} color="#6B6B6B"/>
                      <span style={{ fontSize: 12, color: '#6B6B6B', fontWeight: 500 }}>Start</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#0A0A0A', marginLeft: 22 }}>
                      {new Date(quiz.starts_at).toLocaleString()}
                    </div>
                  </div>
                )}
                {quiz?.ends_at && (
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <Calendar size={14} color="#6B6B6B"/>
                      <span style={{ fontSize: 12, color: '#6B6B6B', fontWeight: 500 }}>End</span>
                    </div>
                    <div style={{ fontSize: 12, color: '#0A0A0A', marginLeft: 22 }}>
                      {new Date(quiz.ends_at).toLocaleString()}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
