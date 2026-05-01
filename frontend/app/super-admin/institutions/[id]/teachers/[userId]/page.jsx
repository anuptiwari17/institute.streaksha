'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, BarChart3, Book, AlertCircle } from 'lucide-react';

function Skeleton({ w = '100%', h = 20 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: 8,
      background: 'linear-gradient(90deg, #f0f0ef 25%, #e5e5e3 50%, #f0f0ef 75%)',
      backgroundSize: '200% 100%', animation: 'loading 1.5s infinite'
    }} />
  );
}

function StatCard({ label, value, icon: Icon, loading }) {
  return (
    <div style={{ padding: 20, background: 'white', borderRadius: 12, border: '1px solid #E5E5E3' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#7A7167', marginBottom: 12 }}>{label}</div>
          {loading ? <Skeleton h={28} w="50%" /> : (
            <div style={{ fontSize: 28, fontWeight: 900, color: '#0A0A0A' }}>{value}</div>
          )}
        </div>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: '#FFF0EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} color="#FF4D00" />
        </div>
      </div>
    </div>
  );
}

export default function TeacherDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tenantId = params.id;
  const teacherId = params.userId;

  const [teacher, setTeacher] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/api/users/${teacherId}`, { params: { tenantId } })
      .then(res => {
        if (res.data?.data) setTeacher(res.data.data);
      })
      .catch(err => {
        setError(err.response?.data?.message || 'Failed to load teacher');
      })
      .finally(() => setLoading(false));
  }, [tenantId, teacherId]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#FAFAF8', padding: '32px 20px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Skeleton h={32} w="40%" style={{ marginBottom: 32 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 32 }}>
            {[...Array(3)].map((_, i) => (
              <div key={i} style={{ padding: 20, background: 'white', borderRadius: 12 }}>
                <Skeleton h={14} w="60%" style={{ marginBottom: 12 }} />
                <Skeleton h={28} w="50%" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !teacher) {
    return (
      <div style={{ minHeight: '100vh', background: '#FAFAF8', padding: '32px 20px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <button onClick={() => router.back()} style={{
            background: 'white', border: '1px solid #E5E5E3', borderRadius: 8, padding: 8,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24
          }}>
            <ArrowLeft size={18} />
          </button>
          <div style={{ padding: 40, background: 'white', borderRadius: 16, textAlign: 'center', color: '#B91C1C' }}>
            <AlertCircle size={32} style={{ margin: '0 auto 12px', opacity: 0.7 }} />
            <p style={{ fontSize: 14, margin: 0 }}>{error || 'Teacher not found'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF8', padding: '32px 20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <button onClick={() => router.back()} style={{
            background: 'white', border: '1px solid #E5E5E3', borderRadius: 8, padding: 8,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0A0A0A', margin: 0 }}>{teacher.name}</h1>
            <p style={{ fontSize: 14, color: '#7A7167', margin: '8px 0 0 0' }}>{teacher.email}</p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 32 }}>
          <StatCard label="Assignments" value={teacher.assignments?.length || 0} icon={BarChart3} loading={false} />
          <StatCard label="Subjects" value={teacher.subjects?.length || 0} icon={Book} loading={false} />
          <StatCard label="Batches" value={new Set(teacher.assignments?.map(a => a.batch_id) || []).size} icon={BarChart3} loading={false} />
        </div>

        {/* Assignments */}
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E5E5E3', padding: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0A0A0A', margin: '0 0 20px 0' }}>Assignments</h2>
          
          {teacher.assignments && teacher.assignments.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #E5E5E3', background: '#F5F3FF' }}>
                    <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#7A7167' }}>Subject</th>
                    <th style={{ padding: 12, textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#7A7167' }}>Batch</th>
                  </tr>
                </thead>
                <tbody>
                  {teacher.assignments.map((assignment, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #E5E5E3' }}>
                      <td style={{ padding: 12, fontSize: 14, color: '#0A0A0A', fontWeight: 500 }}>{assignment.subject_name}</td>
                      <td style={{ padding: 12, fontSize: 14, color: '#7A7167' }}>{assignment.batch_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: 40, textAlign: 'center', color: '#7A7167' }}>
              <p style={{ margin: 0 }}>No assignments found</p>
            </div>
          )}
        </div>

        {/* Subjects */}
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E5E5E3', padding: 24, marginTop: 24 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0A0A0A', margin: '0 0 20px 0' }}>Subjects</h2>
          
          {teacher.subjects && teacher.subjects.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
              {teacher.subjects.map(subject => (
                <div key={subject.id} style={{ padding: 16, borderRadius: 8, border: '1px solid #E5E5E3', background: '#FAFAF8' }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A' }}>{subject.name}</div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: 40, textAlign: 'center', color: '#7A7167' }}>
              <p style={{ margin: 0 }}>No subjects found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
