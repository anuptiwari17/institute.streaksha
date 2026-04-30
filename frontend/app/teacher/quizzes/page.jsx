'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import {
  Plus, Edit2, Trash2, Eye, BarChart3, Calendar,
  AlertCircle, CheckCircle
} from 'lucide-react';

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

function Toast({ message, type, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed', bottom: 20, right: 20,
      background: type === 'success' ? '#F0FDF4' : '#FEF2F2',
      border: `1px solid ${type === 'success' ? '#BBEDD5' : '#FECACA'}`,
      borderRadius: 12, padding: '14px 18px',
      display: 'flex', alignItems: 'center', gap: 12,
      zIndex: 9999, boxShadow: '0 10px 24px rgba(0,0,0,0.1)'
    }}>
      {type === 'success' ? (
        <CheckCircle size={18} color="#16A34A"/>
      ) : (
        <AlertCircle size={18} color="#DC2626"/>
      )}
      <span style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A' }}>
        {message}
      </span>
    </div>
  );
}

export default function QuizManagement() {
  const [quizzes, setQuizzes] = useState([]);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setLoading(true);
    api.get('/quizzes?limit=100')
      .then(res => {
        setQuizzes(res.data?.data?.quizzes || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (quizId) => {
    if (!confirm('Delete this quiz?')) return;
    try {
      await api.delete(`/quizzes/${quizId}`);
      setQuizzes(quizzes.filter(q => q.id !== quizId));
      setToast({ message: 'Quiz deleted', type: 'success' });
    } catch (err) {
      setToast({ message: 'Failed to delete', type: 'error' });
    }
  };

  const handlePublish = async (quizId) => {
    try {
      await api.post(`/quizzes/${quizId}/publish`);
      setQuizzes(quizzes.map(q => q.id === quizId ? { ...q, status: 'published' } : q));
      setToast({ message: 'Quiz published', type: 'success' });
    } catch (err) {
      setToast({ message: 'Failed to publish', type: 'error' });
    }
  };

  const handleUnpublish = async (quizId) => {
    try {
      await api.post(`/quizzes/${quizId}/unpublish`);
      setQuizzes(quizzes.map(q => q.id === quizId ? { ...q, status: 'draft' } : q));
      setToast({ message: 'Quiz unpublished', type: 'success' });
    } catch (err) {
      setToast({ message: 'Failed to unpublish', type: 'error' });
    }
  };

  const filteredQuizzes = quizzes.filter(q => {
    const matchFilter = filter === 'all' || q.status === filter;
    const matchSearch = !search || q.title.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  if (!mounted) return null;

  const statusConfig = {
    draft: { label: 'Draft', color: '#6B6B6B', bg: '#F5F5F3' },
    published: { label: 'Published', color: '#16A34A', bg: '#F0FDF4' },
  };

  return (
    <div style={{
      opacity: mounted ? 1 : 0,
      transform: mounted ? 'translateY(0)' : 'translateY(12px)',
      transition: 'all 0.5s cubic-bezier(0.16,1,0.3,1)',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Header */}
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0A0A0A', letterSpacing: '-0.02em' }}>
            Quizzes
          </h1>
          <p style={{ fontSize: 13, color: '#6B6B6B', marginTop: 6 }}>
            Manage and review your quizzes
          </p>
        </div>
        <Link href="/teacher/quizzes/new" style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: '#0A0A0A', color: 'white', textDecoration: 'none',
          borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 600,
          cursor: 'pointer', transition: 'all 0.2s'
        }}
          onMouseEnter={e => { e.currentTarget.style.background = '#1A1A1A'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#0A0A0A'; }}>
          <Plus size={16}/>
          Create Quiz
        </Link>
      </div>

      {/* Filters and Search */}
      <div style={{
        background: 'white', borderRadius: 16, padding: 16,
        border: '1px solid #E5E5E3', marginBottom: 24,
        display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap'
      }}>
        {/* Status filter */}
        <div style={{ display: 'flex', gap: 8 }}>
          {['all', 'draft', 'published'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              style={{
                padding: '8px 14px', borderRadius: 8, border: 'none',
                background: filter === status ? '#0A0A0A' : '#F5F5F3',
                color: filter === status ? 'white' : '#6B6B6B',
                fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                textTransform: 'capitalize'
              }}>
              {status === 'all' ? 'All Quizzes' : `${status.charAt(0).toUpperCase()}${status.slice(1)}`}
            </button>
          ))}
        </div>

        {/* Search */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <input
            type="text"
            placeholder="Search quizzes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '8px 12px', borderRadius: 8,
              border: '1px solid #E5E5E3', fontSize: 13, fontFamily: 'inherit',
              boxSizing: 'border-box'
            }}
          />
        </div>

        {/* Count */}
        <div style={{ fontSize: 13, color: '#6B6B6B', fontWeight: 500 }}>
          {filteredQuizzes.length} {filteredQuizzes.length === 1 ? 'quiz' : 'quizzes'}
        </div>
      </div>

      {/* Quizzes grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{
              background: 'white', borderRadius: 16, padding: 20,
              border: '1px solid #E5E5E3'
            }}>
              <Skeleton h={20} w="70%" style={{ marginBottom: 16 }}/>
              <Skeleton h={14} w="100%" style={{ marginBottom: 8 }}/>
              <Skeleton h={14} w="60%"/>
            </div>
          ))}
        </div>
      ) : filteredQuizzes.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
          {filteredQuizzes.map(quiz => {
            const s = statusConfig[quiz.status];
            return (
              <div key={quiz.id} style={{
                background: 'white', borderRadius: 16, padding: 20,
                border: '1px solid #E5E5E3', transition: 'all 0.2s'
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}>
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0A', flex: 1, minWidth: 0 }}>
                    {quiz.title}
                  </h3>
                  <span style={{
                    fontSize: 11, fontWeight: 700, color: s.color, background: s.bg,
                    padding: '4px 10px', borderRadius: 6, flexShrink: 0, marginLeft: 8
                  }}>
                    {s.label}
                  </span>
                </div>

                {/* Details */}
                <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #F5F5F3' }}>
                  <p style={{ fontSize: 12, color: '#6B6B6B', marginBottom: 4 }}>
                    {quiz.subject_name} · {quiz.batch_name}
                  </p>
                  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: '#A3A3A0' }}>
                      {quiz.question_count} questions
                    </span>
                    <span style={{ fontSize: 11, color: '#A3A3A0' }}>
                      {quiz.config?.duration || '—'} min
                    </span>
                  </div>
                </div>

                {/* Scheduling info */}
                {(quiz.starts_at || quiz.ends_at) && (
                  <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: '1px solid #F5F5F3' }}>
                    {quiz.starts_at && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6B6B6B', marginBottom: 4 }}>
                        <Calendar size={12}/>
                        Start: {new Date(quiz.starts_at).toLocaleString()}
                      </div>
                    )}
                    {quiz.ends_at && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6B6B6B' }}>
                        <Calendar size={12}/>
                        End: {new Date(quiz.ends_at).toLocaleString()}
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <Link href={`/teacher/quizzes/${quiz.id}`} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E5E3',
                    background: 'white', color: '#0A0A0A', textDecoration: 'none',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#F5F5F3'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}>
                    <Eye size={12}/>
                    View
                  </Link>

                  <Link href={`/teacher/quizzes/${quiz.id}/results`} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E5E3',
                    background: 'white', color: '#0A0A0A', textDecoration: 'none',
                    fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#F5F5F3'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}>
                    <BarChart3 size={12}/>
                    Results
                  </Link>

                  {quiz.status === 'draft' ? (
                    <button
                      onClick={() => handlePublish(quiz.id)}
                      style={{
                        padding: '8px 12px', borderRadius: 8, border: 'none',
                        background: '#16A34A', color: 'white',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                        gridColumn: '1 / 2'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#15803D'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = '#16A34A'; }}>
                      Publish
                    </button>
                  ) : (
                    <button
                      onClick={() => handleUnpublish(quiz.id)}
                      style={{
                        padding: '8px 12px', borderRadius: 8, border: '1px solid #E5E5E3',
                        background: 'white', color: '#6B6B6B',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s',
                        gridColumn: '1 / 2'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#F5F5F3'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'white'; }}>
                      Unpublish
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(quiz.id)}
                    style={{
                      padding: '8px 12px', borderRadius: 8, border: '1px solid #FECACA',
                      background: '#FEF2F2', color: '#DC2626',
                      fontSize: 12, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s'
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#FEE2E2'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = '#FEF2F2'; }}>
                    Delete
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{
          background: 'white', borderRadius: 20, padding: '60px 20px',
          border: '1px solid #E5E5E3', textAlign: 'center'
        }}>
          <AlertCircle size={48} color="#D3D3D1" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0A0A0A', marginBottom: 8 }}>
            No quizzes found
          </h3>
          <p style={{ fontSize: 13, color: '#6B6B6B', marginBottom: 20 }}>
            Create your first quiz to get started
          </p>
          <Link href="/teacher/quizzes/new" style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            background: '#0A0A0A', color: 'white', padding: '10px 18px',
            borderRadius: 8, fontSize: 13, fontWeight: 600, textDecoration: 'none',
            cursor: 'pointer', transition: 'all 0.2s'
          }}
            onMouseEnter={e => { e.currentTarget.style.background = '#1A1A1A'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#0A0A0A'; }}>
            <Plus size={16}/>
            Create Quiz
          </Link>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
