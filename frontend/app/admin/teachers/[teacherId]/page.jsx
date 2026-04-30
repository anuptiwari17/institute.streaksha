'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Plus, Pencil, Trash2, User, Mail, BookOpen, Layers } from 'lucide-react';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

function AssignmentModal({ open, onClose, title, subjects, batches, initial, onSubmit, loading }) {
  const [form, setForm] = useState({ subjectId: '', batchId: '' });

  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      setForm({
        subjectId: initial?.subjectId || '',
        batchId: initial?.batchId || '',
      });
    }, 0);
    return () => clearTimeout(timer);
  }, [open, initial]);

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

  const change = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.subjectId || !form.batchId) return;
    onSubmit(form);
  };

  return (
    <Modal open={open} onClose={onClose} title={title}>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
            Subject
          </label>
          <select value={form.subjectId} onChange={change('subjectId')} style={selectStyle} required>
            <option value="">Select subject...</option>
            {subjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: 11, fontWeight: 700, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>
            Batch
          </label>
          <select value={form.batchId} onChange={change('batchId')} style={selectStyle} required>
            <option value="">Select batch...</option>
            {batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Save</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function TeacherDetailPage() {
  const { teacherId } = useParams();
  const toast = useToast();
  const [teacher, setTeacher] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(async () => {
    if (!teacherId) return;
    setLoading(true);
    try {
      const [teacherRes, subjectsRes, batchesRes] = await Promise.all([
        api.get(`/users/${teacherId}`),
        api.get('/subjects'),
        api.get('/batches'),
      ]);
      setTeacher(teacherRes.data.data || null);
      setSubjects(subjectsRes.data.data || []);
      setBatches(batchesRes.data.data || []);
    } catch {
      setTeacher(null);
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const assignmentRows = teacher?.assignments || [];

  const assignmentCount = useMemo(() => assignmentRows.length, [assignmentRows]);

  const openAdd = () => {
    setEditingAssignment(null);
    setModalOpen(true);
  };

  const openEdit = (assignment) => {
    setEditingAssignment(assignment);
    setModalOpen(true);
  };

  const handleSave = async ({ subjectId, batchId }) => {
    if (!teacher) return;
    setSaving(true);
    try {
      if (editingAssignment) {
        if (editingAssignment.subject_id !== subjectId) {
          await api.delete(`/subjects/${editingAssignment.subject_id}/assignments/${editingAssignment.id}`);
          await api.post(`/subjects/${subjectId}/assign`, { teacherId: teacher.id, batchId });
        } else {
          await api.patch(`/subjects/${editingAssignment.subject_id}/assignments/${editingAssignment.id}`, {
            teacherId: teacher.id,
            batchId,
          });
        }
        toast({ message: 'Assignment updated', type: 'success' });
      } else {
        await api.post(`/subjects/${subjectId}/assign`, { teacherId: teacher.id, batchId });
        toast({ message: 'Assignment created', type: 'success' });
      }
      setModalOpen(false);
      setEditingAssignment(null);
      await fetchData();
    } catch (err) {
      toast({ message: err.response?.data?.message || 'Unable to save assignment', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (assignment) => {
    try {
      await api.delete(`/subjects/${assignment.subject_id}/assignments/${assignment.id}`);
      toast({ message: 'Assignment removed', type: 'success' });
      fetchData();
    } catch (err) {
      toast({ message: err.response?.data?.message || 'Unable to remove assignment', type: 'error' });
    }
  };

  if (loading) {
    return <div style={{ fontSize: 14, color: '#6B6B6B' }}>Loading teacher...</div>;
  }

  if (!teacher) {
    return (
      <div>
        <Link href="/admin/teachers"><Button variant="secondary" icon={<ArrowLeft size={14} />}>Back to teachers</Button></Link>
        <div style={{ marginTop: 16, fontSize: 14, color: '#EF4444' }}>Teacher not found.</div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22, gap: 16, flexWrap: 'wrap' }}>
        <div>
          <Link href="/admin/teachers"><Button variant="secondary" icon={<ArrowLeft size={14} />}>Back to teachers</Button></Link>
          <h1 style={{ marginTop: 14, marginBottom: 6, fontSize: 'clamp(24px,3vw,34px)', letterSpacing: '-0.04em', fontWeight: 900, color: '#0A0A0A' }}>
            {teacher.name}
          </h1>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', fontSize: 13, color: '#6B6B6B' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Mail size={13} /> {teacher.email}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><BookOpen size={13} /> {assignmentCount} assignments</span>
          </div>
        </div>
        <Button icon={<Plus size={14} />} onClick={openAdd}>Add Assignment</Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12, marginBottom: 18 }}>
        <div style={{ background: 'white', border: '1px solid #E5E5E3', borderRadius: 14, padding: 14 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#A3A3A0', fontWeight: 700 }}>Status</div>
          <div style={{ marginTop: 8 }}><Badge variant={teacher.is_active ? 'green' : 'red'}>{teacher.is_active ? 'Active' : 'Inactive'}</Badge></div>
        </div>
        <div style={{ background: 'white', border: '1px solid #E5E5E3', borderRadius: 14, padding: 14 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#A3A3A0', fontWeight: 700 }}>Unique Subjects</div>
          <div style={{ marginTop: 8, fontSize: 20, fontWeight: 900, color: '#0A0A0A' }}>{(teacher.subjects || []).length}</div>
        </div>
        <div style={{ background: 'white', border: '1px solid #E5E5E3', borderRadius: 14, padding: 14 }}>
          <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#A3A3A0', fontWeight: 700 }}>Unique Batches</div>
          <div style={{ marginTop: 8, fontSize: 20, fontWeight: 900, color: '#0A0A0A' }}>{new Set(assignmentRows.map((a) => a.batch_id)).size}</div>
        </div>
      </div>

      <div style={{ background: 'white', border: '1px solid #E5E5E3', borderRadius: 16, padding: 14 }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: '#0A0A0A', marginBottom: 10 }}>Subject + Batch Assignments</div>
        {assignmentRows.length === 0 ? (
          <div style={{ border: '1px dashed #E5E5E3', borderRadius: 12, padding: '20px 14px', textAlign: 'center', color: '#A3A3A0', fontSize: 14 }}>
            This teacher is not assigned yet.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {assignmentRows.map((assignment) => (
              <div key={assignment.id} style={{ border: '1px solid #F0F0EE', background: '#FAFAF8', borderRadius: 12, padding: 12, display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Badge variant="default">{assignment.subject_name}</Badge>
                  <Badge variant="blue">{assignment.batch_name}</Badge>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#6B6B6B' }}><User size={12} />{teacher.name}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => openEdit(assignment)} style={{ background: 'white', border: '1px solid #E5E5E3', borderRadius: 9, padding: '6px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#0A0A0A', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Pencil size={12} />Edit
                  </button>
                  <button onClick={() => handleDelete(assignment)} style={{ background: '#FFF5F5', border: '1px solid #FED7D7', borderRadius: 9, padding: '6px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', color: '#EF4444', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    <Trash2 size={12} />Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AssignmentModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingAssignment ? 'Edit Assignment' : 'Add Assignment'}
        subjects={subjects}
        batches={batches}
        initial={editingAssignment ? { subjectId: editingAssignment.subject_id, batchId: editingAssignment.batch_id } : null}
        onSubmit={handleSave}
        loading={saving}
      />
    </div>
  );
}
