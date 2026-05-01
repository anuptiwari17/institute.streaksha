'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, Users, BookOpen, AlertCircle } from 'lucide-react';

function Skeleton({ w = '100%', h = 20 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: 8,
      background: 'linear-gradient(90deg, #f0f0ef 25%, #e5e5e3 50%, #f0f0ef 75%)',
      backgroundSize: '200% 100%', animation: 'loading 1.5s infinite'
    }} />
  );
}

function StudentRow({ student }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '2fr 2fr 1fr',
      padding: '16px', borderBottom: '1px solid #E5E5E3', background: 'white'
    }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A' }}>{student.name}</div>
        <div style={{ fontSize: 12, color: '#7A7167', marginTop: 4 }}>{student.email}</div>
      </div>
      <div style={{ fontSize: 13, color: '#7A7167' }}>Roll: {student.roll_no || '-'}</div>
      <div style={{ textAlign: 'right', fontSize: 12 }}>
        {student.is_active ? (
          <span style={{ padding: '4px 8px', borderRadius: 4, background: '#ECFDF5', color: '#047857', fontWeight: 600 }}>
            Active
          </span>
        ) : (
          <span style={{ padding: '4px 8px', borderRadius: 4, background: '#FEF2F2', color: '#B91C1C', fontWeight: 600 }}>
            Inactive
          </span>
        )}
      </div>
    </div>
  );
}

function SubjectRow({ subject, assignment }) {
  return (
    <div style={{
      display: 'grid', gridTemplateColumns: '2fr 2fr 1fr',
      padding: '16px', borderBottom: '1px solid #E5E5E3', background: 'white'
    }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A' }}>{subject.name}</div>
      </div>
      <div style={{ fontSize: 13, color: '#7A7167' }}>
        {assignment?.teacher_name || 'Unassigned'}
      </div>
      <div style={{ textAlign: 'right', fontSize: 12, color: '#7A7167' }}>
        {assignment?.id ? 'Assigned' : 'Not Assigned'}
      </div>
    </div>
  );
}

export default function BatchDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tenantId = params.id;
  const batchId = params.batchId;

  const [batch, setBatch] = useState(null);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [activeTab, setActiveTab] = useState('students');
  const [loadingBatch, setLoadingBatch] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [error, setError] = useState('');
  const [studentPage, setStudentPage] = useState(1);
  const [totalStudents, setTotalStudents] = useState(0);

  const studentLimit = 20;
  const totalStudentPages = Math.ceil(totalStudents / studentLimit);

  useEffect(() => {
    api.get(`/api/batches/${batchId}`, { params: { tenantId } })
      .then(res => {
        if (res.data?.data) setBatch(res.data.data);
      })
      .catch(err => {
        setError(err.response?.data?.message || 'Failed to load batch');
      })
      .finally(() => setLoadingBatch(false));
  }, [tenantId, batchId]);

  useEffect(() => {
    if (activeTab === 'students') {
      setLoadingData(true);
      api.get(`/api/batches/${batchId}/students`, {
        params: { tenantId, page: studentPage, limit: studentLimit }
      })
        .then(res => {
          if (res.data?.data) {
            setStudents(res.data.data.students || []);
            setTotalStudents(res.data.data.total || 0);
          }
        })
        .catch(err => {
          setError(err.response?.data?.message || 'Failed to load students');
        })
        .finally(() => setLoadingData(false));
    } else if (activeTab === 'subjects') {
      setLoadingData(true);
      Promise.all([
        api.get(`/api/subjects`, { params: { tenantId } }),
        api.get(`/api/batches/${batchId}/assignments`, { params: { tenantId } })
      ])
        .then(([subjectsRes, assignmentsRes]) => {
          if (subjectsRes.data?.data) {
            setSubjects(Array.isArray(subjectsRes.data.data) ? subjectsRes.data.data : subjectsRes.data.data.subjects || []);
          }
          if (assignmentsRes.data?.data) {
            setAssignments(Array.isArray(assignmentsRes.data.data) ? assignmentsRes.data.data : []);
          }
        })
        .catch(err => {
          setError(err.response?.data?.message || 'Failed to load subjects');
        })
        .finally(() => setLoadingData(false));
    }
  }, [tenantId, batchId, activeTab, studentPage]);

  if (loadingBatch) {
    return (
      <div style={{ minHeight: '100vh', background: '#FAFAF8', padding: '32px 20px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Skeleton h={32} w="40%" style={{ marginBottom: 32 }} />
          <div style={{ padding: 24, background: 'white', borderRadius: 12 }}>
            <Skeleton h={20} w="100%" style={{ marginBottom: 16 }} />
            <Skeleton h={20} w="100%" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !batch) {
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
            <p style={{ fontSize: 14, margin: 0 }}>{error || 'Batch not found'}</p>
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
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0A0A0A', margin: 0 }}>{batch.name}</h1>
            <p style={{ fontSize: 14, color: '#7A7167', margin: '8px 0 0 0' }}>
              {batch.academic_year || 'No year specified'}
            </p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          <div style={{ padding: 20, background: 'white', borderRadius: 12, border: '1px solid #E5E5E3' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#7A7167', marginBottom: 12 }}>Students</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#0A0A0A' }}>{batch.student_count || 0}</div>
              </div>
              <Users size={20} color="#FF4D00" />
            </div>
          </div>
          <div style={{ padding: 20, background: 'white', borderRadius: 12, border: '1px solid #E5E5E3' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#7A7167', marginBottom: 12 }}>Teachers</div>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#0A0A0A' }}>{batch.teacher_count || 0}</div>
              </div>
              <BookOpen size={20} color="#10B981" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E5E5E3', overflow: 'hidden' }}>
          <div style={{ display: 'flex', borderBottom: '2px solid #E5E5E3', background: '#FAFAF8' }}>
            <button
              onClick={() => {
                setActiveTab('students');
                setStudentPage(1);
              }}
              style={{
                flex: 1, padding: 16, borderBottom: activeTab === 'students' ? '3px solid #FF4D00' : 'none',
                background: activeTab === 'students' ? 'white' : 'transparent',
                cursor: 'pointer', fontWeight: 600, fontSize: 14, color: activeTab === 'students' ? '#0A0A0A' : '#7A7167',
                transition: 'all 0.2s'
              }}
            >
              <Users size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
              Students ({batch.student_count || 0})
            </button>
            <button
              onClick={() => setActiveTab('subjects')}
              style={{
                flex: 1, padding: 16, borderBottom: activeTab === 'subjects' ? '3px solid #FF4D00' : 'none',
                background: activeTab === 'subjects' ? 'white' : 'transparent',
                cursor: 'pointer', fontWeight: 600, fontSize: 14, color: activeTab === 'subjects' ? '#0A0A0A' : '#7A7167',
                transition: 'all 0.2s'
              }}
            >
              <BookOpen size={16} style={{ display: 'inline', marginRight: 8, verticalAlign: 'middle' }} />
              Subjects
            </button>
          </div>

          {/* Content */}
          <div>
            {loadingData ? (
              <div style={{ padding: 24 }}>
                {[...Array(5)].map((_, i) => (
                  <div key={i} style={{ marginBottom: 16 }}>
                    <Skeleton h={60} />
                  </div>
                ))}
              </div>
            ) : activeTab === 'students' ? (
              <>
                {students.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: '#7A7167' }}>
                    <p style={{ margin: 0 }}>No students found</p>
                  </div>
                ) : (
                  <>
                    {/* Header Row */}
                    <div style={{
                      display: 'grid', gridTemplateColumns: '2fr 2fr 1fr',
                      padding: '12px 16px', background: '#F5F3FF', borderBottom: '1px solid #E5E5E3',
                      fontWeight: 600, fontSize: 12, color: '#7A7167', textTransform: 'uppercase'
                    }}>
                      <div>Name</div>
                      <div>Email</div>
                      <div style={{ textAlign: 'right' }}>Status</div>
                    </div>
                    {/* Data Rows */}
                    {students.map(student => (
                      <StudentRow key={student.id} student={student} />
                    ))}
                  </>
                )}
              </>
            ) : (
              <>
                {subjects.length === 0 ? (
                  <div style={{ padding: 40, textAlign: 'center', color: '#7A7167' }}>
                    <p style={{ margin: 0 }}>No subjects found</p>
                  </div>
                ) : (
                  <>
                    {/* Header Row */}
                    <div style={{
                      display: 'grid', gridTemplateColumns: '2fr 2fr 1fr',
                      padding: '12px 16px', background: '#F5F3FF', borderBottom: '1px solid #E5E5E3',
                      fontWeight: 600, fontSize: 12, color: '#7A7167', textTransform: 'uppercase'
                    }}>
                      <div>Subject</div>
                      <div>Teacher</div>
                      <div style={{ textAlign: 'right' }}>Status</div>
                    </div>
                    {/* Data Rows */}
                    {subjects.map(subject => {
                      const assignment = assignments.find(a => a.subject_id === subject.id);
                      return <SubjectRow key={subject.id} subject={subject} assignment={assignment} />;
                    })}
                  </>
                )}
              </>
            )}
          </div>

          {/* Pagination for Students */}
          {activeTab === 'students' && totalStudentPages > 1 && !loadingData && (
            <div style={{ padding: 16, borderTop: '1px solid #E5E5E3', display: 'flex', justifyContent: 'center', gap: 8 }}>
              <button
                onClick={() => setStudentPage(p => Math.max(1, p - 1))}
                disabled={studentPage === 1}
                style={{
                  padding: '8px 16px', borderRadius: 6, border: '1px solid #E5E5E3',
                  background: studentPage === 1 ? '#F5F3FF' : 'white', cursor: studentPage === 1 ? 'not-allowed' : 'pointer',
                  fontWeight: 500, fontSize: 13
                }}
              >
                Previous
              </button>
              <span style={{ fontSize: 13, color: '#7A7167', padding: '8px 0' }}>
                Page {studentPage} of {totalStudentPages}
              </span>
              <button
                onClick={() => setStudentPage(p => Math.min(totalStudentPages, p + 1))}
                disabled={studentPage === totalStudentPages}
                style={{
                  padding: '8px 16px', borderRadius: 6, border: '1px solid #E5E5E3',
                  background: studentPage === totalStudentPages ? '#F5F3FF' : 'white', cursor: studentPage === totalStudentPages ? 'not-allowed' : 'pointer',
                  fontWeight: 500, fontSize: 13
                }}
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
