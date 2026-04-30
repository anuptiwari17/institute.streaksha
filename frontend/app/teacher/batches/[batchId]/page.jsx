'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, Users, BookOpen } from 'lucide-react';

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

export default function BatchDetail() {
  const router = useRouter();
  const params = useParams();
  const batchId = params.batchId;

  const [batch, setBatch] = useState(null);
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!batchId) return;
    setLoading(true);
    Promise.all([
      api.get(`/batches/${batchId}`).catch(() => null),
      api.get(`/batches/${batchId}/students`).catch(() => null),
      api.get(`/batches/${batchId}/assignments`).catch(() => null),
    ]).then(([batchRes, studentsRes, assignmentsRes]) => {
      if (batchRes?.data?.data) setBatch(batchRes.data.data);
      if (studentsRes?.data?.data?.students) setStudents(studentsRes.data.data.students);
      if (assignmentsRes?.data?.data?.assignments) setAssignments(assignmentsRes.data.data.assignments);
    }).finally(() => setLoading(false));
  }, [batchId]);

  if (!mounted) return null;

  return (
    <div style={{
      opacity: mounted ? 1 : 0,
      transform: mounted ? 'translateY(0)' : 'translateY(12px)',
      transition: 'all 0.5s cubic-bezier(0.16,1,0.3,1)',
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Header with back button */}
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
            {loading ? <Skeleton w={200} h={32}/> : batch?.name || 'Batch Details'}
          </h1>
          {!loading && batch && (
            <p style={{ fontSize: 13, color: '#6B6B6B', marginTop: 4 }}>
              Academic Year: {batch.academic_year}
            </p>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        {/* Student count */}
        <div style={{
          background: 'white', borderRadius: 16, padding: 20,
          border: '1px solid #E5E5E3'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 40, height: 40, background: '#EFF6FF', borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Users size={18} color="#2563EB"/>
            </div>
            <span style={{ fontSize: 12, color: '#6B6B6B', fontWeight: 500 }}>Total Students</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#0A0A0A' }}>
            {loading ? <Skeleton w={60} h={28}/> : students.length}
          </div>
        </div>

        {/* Subject-Teacher assignments count */}
        <div style={{
          background: 'white', borderRadius: 16, padding: 20,
          border: '1px solid #E5E5E3'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div style={{
              width: 40, height: 40, background: '#FFF0EB', borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <BookOpen size={18} color="#FF4D00"/>
            </div>
            <span style={{ fontSize: 12, color: '#6B6B6B', fontWeight: 5 }}>Subject-Teacher Pairs</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color: '#0A0A0A' }}>
            {loading ? <Skeleton w={60} h={28}/> : assignments.length}
          </div>
        </div>
      </div>

      {/* Students Section */}
      <div style={{
        background: 'white', borderRadius: 20, padding: 24,
        border: '1px solid #E5E5E3', marginBottom: 24
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0A0A0A', marginBottom: 16 }}>
          Enrolled Students
        </h2>
        {loading ? (
          <div>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                padding: '12px 0', borderBottom: '1px solid #F5F5F3',
                display: 'flex', alignItems: 'center', gap: 12
              }}>
                <Skeleton w={40} h={40} radius={10}/>
                <div style={{ flex: 1 }}>
                  <Skeleton w="40%" h={14}/>
                  <div style={{ marginTop: 6 }}><Skeleton w="60%" h={11}/></div>
                </div>
              </div>
            ))}
          </div>
        ) : students.length > 0 ? (
          <div>
            {students.map(student => (
              <div key={student.id} style={{
                padding: '14px 0', borderBottom: '1px solid #F5F5F3',
                display: 'flex', alignItems: 'center', gap: 12
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: 10,
                  background: '#F5F5F3', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#6B6B6B' }}>
                    {student.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A' }}>
                    {student.name}
                  </div>
                  <div style={{ fontSize: 12, color: '#A3A3A0', marginTop: 2 }}>
                    {student.email}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '32px 16px', textAlign: 'center' }}>
            <Users size={32} color="#D3D3D1" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: 14, color: '#6B6B6B' }}>No students enrolled</p>
          </div>
        )}
      </div>

      {/* Subject-Teacher Assignments Section */}
      <div style={{
        background: 'white', borderRadius: 20, padding: 24,
        border: '1px solid #E5E5E3'
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0A0A0A', marginBottom: 16 }}>
          Subject-Teacher Assignments
        </h2>
        {loading ? (
          <div>
            {[1, 2, 3].map(i => (
              <div key={i} style={{
                padding: '12px 0', borderBottom: '1px solid #F5F5F3',
                display: 'flex', alignItems: 'center', gap: 12
              }}>
                <Skeleton w="30%" h={14}/>
                <Skeleton w="30%" h={14}/>
              </div>
            ))}
          </div>
        ) : assignments.length > 0 ? (
          <div>
            {assignments.map((assignment, i) => (
              <div key={i} style={{
                padding: '14px 0', borderBottom: '1px solid #F5F5F3',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A' }}>
                    {assignment.subject_name}
                  </div>
                  <div style={{ fontSize: 12, color: '#A3A3A0', marginTop: 2 }}>
                    Teacher: {assignment.teacher_name}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '32px 16px', textAlign: 'center' }}>
            <BookOpen size={32} color="#D3D3D1" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: 14, color: '#6B6B6B' }}>No subject-teacher assignments</p>
          </div>
        )}
      </div>
    </div>
  );
}
