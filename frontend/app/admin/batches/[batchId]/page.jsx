'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, Layers, Users, BookOpen, User } from 'lucide-react';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';

export default function BatchDetailPage() {
  const { batchId } = useParams();
  const toast = useToast();
  const [batch, setBatch] = useState(null);
  const [students, setStudents] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');

  const fetchData = useCallback(async () => {
    if (!batchId) return;
    setLoading(true);
    try {
      const [batchRes, studentsRes, assignmentsRes, allStudentsRes, teachersRes, subjectsRes] = await Promise.all([
        api.get(`/batches/${batchId}`),
        api.get(`/batches/${batchId}/students?limit=500`),
        api.get(`/batches/${batchId}/assignments`),
        api.get('/users?role=student&limit=500'),
        api.get('/users?role=teacher&limit=500'),
        api.get('/subjects'),
      ]);

      setBatch(batchRes.data.data || null);
      setStudents(studentsRes.data.data?.students || []);
      setAssignments(assignmentsRes.data.data || []);
      setAllStudents(allStudentsRes.data.data?.users || []);
      setTeachers(teachersRes.data.data?.users || []);
      setSubjects(subjectsRes.data.data || []);
    } catch {
      setBatch(null);
    } finally {
      setLoading(false);
    }
  }, [batchId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const enrolledSet = useMemo(() => new Set(students.map((student) => student.id)), [students]);
  const addableStudents = useMemo(
    () => allStudents.filter((student) => !enrolledSet.has(student.id)),
    [allStudents, enrolledSet]
  );

  const handleAddStudent = async () => {
    if (!selectedStudentId || !batchId) return;
    try {
      await api.post(`/batches/${batchId}/students`, { userId: selectedStudentId });
      toast({ message: 'Student enrolled in batch', type: 'success' });
      setSelectedStudentId('');
      fetchData();
    } catch (err) {
      toast({ message: err.response?.data?.message || 'Unable to enroll student', type: 'error' });
    }
  };

  const handleRemoveStudent = async (studentId) => {
    try {
      await api.delete(`/batches/${batchId}/students/${studentId}`);
      toast({ message: 'Student unenrolled', type: 'success' });
      fetchData();
    } catch (err) {
      toast({ message: err.response?.data?.message || 'Unable to unenroll student', type: 'error' });
    }
  };

  const handleAddAssignment = async () => {
    if (!selectedTeacherId || !selectedSubjectId || !batchId) return;
    try {
      await api.post(`/subjects/${selectedSubjectId}/assign`, { teacherId: selectedTeacherId, batchId });
      toast({ message: 'Teacher assigned to subject in this batch', type: 'success' });
      setSelectedTeacherId('');
      setSelectedSubjectId('');
      fetchData();
    } catch (err) {
      toast({ message: err.response?.data?.message || 'Unable to add assignment', type: 'error' });
    }
  };

  const handleDeleteAssignment = async (assignment) => {
    try {
      await api.delete(`/subjects/${assignment.subject_id}/assignments/${assignment.id}`);
      toast({ message: 'Assignment removed', type: 'success' });
      fetchData();
    } catch (err) {
      toast({ message: err.response?.data?.message || 'Unable to remove assignment', type: 'error' });
    }
  };

  if (loading) {
    return <div style={{ fontSize: 14, color: '#6B6B6B' }}>Loading batch...</div>;
  }

  if (!batch) {
    return (
      <div>
        <Link href="/admin/batches"><Button variant="secondary" icon={<ArrowLeft size={14} />}>Back to batches</Button></Link>
        <div style={{ marginTop: 16, fontSize: 14, color: '#EF4444' }}>Batch not found.</div>
      </div>
    );
  }

  const selectStyle = {
    width: '100%',
    background: 'white',
    border: '1.5px solid #E5E5E3',
    borderRadius: 12,
    padding: '11px 14px',
    fontSize: 14,
    color: '#0A0A0A',
    outline: 'none',
    fontFamily: 'inherit',
    cursor: 'pointer',
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 20 }}>
        <Link href="/admin/batches"><Button variant="secondary" icon={<ArrowLeft size={14} />}>Back to batches</Button></Link>
        <h1 style={{ marginTop: 14, marginBottom: 6, fontSize: 'clamp(24px,3vw,34px)', letterSpacing: '-0.04em', fontWeight: 900, color: '#0A0A0A' }}>
          {batch.name}
        </h1>
        <p style={{ fontSize: 13, color: '#6B6B6B' }}>{batch.academic_year || 'No academic year'} • Batch management workspace</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 12, marginBottom: 20 }}>
        <div style={{ background: 'white', border: '1px solid #E5E5E3', borderRadius: 14, padding: 14 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#A3A3A0', fontWeight: 700 }}>Students</div>
          <div style={{ marginTop: 8, fontSize: 20, fontWeight: 900, color: '#0A0A0A' }}>{students.length}</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #E5E5E3', borderRadius: 14, padding: 14 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#A3A3A0', fontWeight: 700 }}>Assignments</div>
          <div style={{ marginTop: 8, fontSize: 20, fontWeight: 900, color: '#0A0A0A' }}>{assignments.length}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14 }}>
        <section style={{ background: 'white', border: '1px solid #E5E5E3', borderRadius: 16, padding: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#0A0A0A', display: 'inline-flex', alignItems: 'center', gap: 6 }}><Users size={14} /> Manage Students</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, marginBottom: 10 }}>
            <select value={selectedStudentId} onChange={(event) => setSelectedStudentId(event.target.value)} style={selectStyle}>
              <option value="">Select student to enroll...</option>
              {addableStudents.map((student) => (
                <option key={student.id} value={student.id}>{student.name} ({student.email})</option>
              ))}
            </select>
            <Button icon={<Plus size={14} />} onClick={handleAddStudent} disabled={!selectedStudentId}>Enroll</Button>
          </div>

          {students.length === 0 ? (
            <div style={{ border: '1px dashed #E5E5E3', borderRadius: 12, padding: '16px 12px', textAlign: 'center', color: '#A3A3A0', fontSize: 14 }}>
              No students in this batch.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 420, overflowY: 'auto' }}>
              {students.map((student) => (
                <div key={student.id} style={{ border: '1px solid #F0F0EE', background: '#FAFAF8', borderRadius: 12, padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0A' }}>{student.name}</div>
                    <div style={{ marginTop: 2, fontSize: 12, color: '#6B6B6B', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><User size={11} /> {student.email}</span>
                      <span>Roll: {student.roll_no || 'N/A'}</span>
                      <span>Status: {student.is_active ? 'Active' : 'Inactive'}</span>
                    </div>
                  </div>
                  <button onClick={() => handleRemoveStudent(student.id)} style={{ background: '#FFF5F5', border: '1px solid #FED7D7', borderRadius: 9, padding: '6px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#EF4444', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Trash2 size={12} />Unenroll
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section style={{ background: 'white', border: '1px solid #E5E5E3', borderRadius: 16, padding: 14 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: '#0A0A0A', marginBottom: 10, display: 'inline-flex', alignItems: 'center', gap: 6 }}><Layers size={14} /> Subject-Teacher Assignments</div>

          <div style={{ display: 'grid', gap: 8, marginBottom: 10 }}>
            <select value={selectedSubjectId} onChange={(event) => setSelectedSubjectId(event.target.value)} style={selectStyle}>
              <option value="">Select subject...</option>
              {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
            </select>
            <select value={selectedTeacherId} onChange={(event) => setSelectedTeacherId(event.target.value)} style={selectStyle}>
              <option value="">Select teacher...</option>
              {teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.name}</option>)}
            </select>
            <Button icon={<Plus size={14} />} onClick={handleAddAssignment} disabled={!selectedTeacherId || !selectedSubjectId}>Add Assignment</Button>
          </div>

          {assignments.length === 0 ? (
            <div style={{ border: '1px dashed #E5E5E3', borderRadius: 12, padding: '16px 12px', textAlign: 'center', color: '#A3A3A0', fontSize: 14 }}>
              No assignments for this batch.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 420, overflowY: 'auto' }}>
              {assignments.map((assignment) => (
                <div key={assignment.id} style={{ border: '1px solid #F0F0EE', background: '#FAFAF8', borderRadius: 12, padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Badge variant="default">{assignment.subject_name}</Badge>
                    <Badge variant="blue">{assignment.teacher_name}</Badge>
                    <span style={{ fontSize: 11, color: '#6B6B6B', display: 'inline-flex', alignItems: 'center', gap: 4 }}><BookOpen size={11} /> {assignment.teacher_email}</span>
                  </div>
                  <button onClick={() => handleDeleteAssignment(assignment)} style={{ background: '#FFF5F5', border: '1px solid #FED7D7', borderRadius: 9, padding: '6px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#EF4444', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Trash2 size={12} />Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
