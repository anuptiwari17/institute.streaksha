'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import Badge from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { BookOpen, Plus, Trash2, Users, ClipboardList, ArrowRight, Search, Pencil } from 'lucide-react';

function SubjectModal({ open, onClose, onSuccess }) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setName('');
    setError('');
  }, [open]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!name.trim()) {
      setError('Subject name is required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      await api.post('/subjects', { name: name.trim() });
      toast({ message: 'Subject created', type: 'success' });
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save subject');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Create Subject">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input label="Subject name" placeholder="Physics" value={name} onChange={(e) => setName(e.target.value)} error={error} />
        <div className="flex justify-end gap-3">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>Create</Button>
        </div>
      </form>
    </Modal>
  );
}

function AssignmentModal({ open, onClose, subject, assignment, teachers, batches, onSuccess }) {
  const toast = useToast();
  const [form, setForm] = useState({ teacherId: '', batchId: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setForm({
      teacherId: assignment?.teacher_id || '',
      batchId: assignment?.batch_id || '',
    });
    setError('');
  }, [open, assignment]);

  const set = (field) => (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.teacherId || !form.batchId) {
      setError('Teacher and batch are required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      if (assignment) {
        await api.patch(`/subjects/${subject.id}/assignments/${assignment.id}`, form);
        toast({ message: 'Assignment updated', type: 'success' });
      } else {
        await api.post(`/subjects/${subject.id}/assign`, form);
        toast({ message: 'Teacher assigned', type: 'success' });
      }
      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to save assignment');
    } finally {
      setLoading(false);
    }
  };

  const teacherOptions = teachers.length ? teachers : [];
  const batchOptions = batches.length ? batches : [];

  return (
    <Modal open={open} onClose={onClose} title={assignment ? 'Edit Assignment' : `Assign Teacher to ${subject?.name || 'Subject'}`} size="lg">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#6B6B6B]">Teacher</label>
            <select
              value={form.teacherId}
              onChange={set('teacherId')}
              className="w-full rounded-xl border border-[#E5E5E3] bg-white px-4 py-3 text-sm text-[#0A0A0A] outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-[#0A0A0A]"
            >
              <option value="">Select teacher</option>
              {teacherOptions.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>{teacher.name} ({teacher.email})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#6B6B6B]">Batch</label>
            <select
              value={form.batchId}
              onChange={set('batchId')}
              className="w-full rounded-xl border border-[#E5E5E3] bg-white px-4 py-3 text-sm text-[#0A0A0A] outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-[#0A0A0A]"
            >
              <option value="">Select batch</option>
              {batchOptions.map((batch) => (
                <option key={batch.id} value={batch.id}>{batch.name}{batch.academic_year ? ` · ${batch.academic_year}` : ''}</option>
              ))}
            </select>
          </div>
        </div>
        <p className="text-xs text-[#6B6B6B]">
          This connects the teacher to a subject and a batch. Quizzes created by the teacher should use this pair.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading}>{assignment ? 'Save changes' : 'Assign'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function AssignmentsModal({
  open,
  onClose,
  subject,
  assignments,
  loading,
  onAdd,
  onEdit,
  onDelete,
}) {
  return (
    <Modal open={open} onClose={onClose} title={subject ? `${subject.name} assignments` : 'Assignments'} size="lg">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-[#0A0A0A]">Subject ownership</p>
          <p className="text-sm text-[#6B6B6B]">Teachers assigned to this subject and batch pair.</p>
        </div>
        <Button variant="orange" size="sm" icon={<Plus size={14} />} onClick={onAdd}>Add assignment</Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 rounded-2xl bg-[#F0F0EE] animate-pulse" />)}
        </div>
      ) : assignments.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#E5E5E3] bg-white p-8 text-center text-[#6B6B6B]">
          <Users size={30} className="mx-auto mb-3 text-[#C0C0BC]" />
          <p className="text-sm font-semibold text-[#0A0A0A]">No assignments yet</p>
          <p className="mt-1 text-sm">Assign a teacher and batch to make this subject usable for quiz creation.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="rounded-2xl border border-[#E5E5E3] bg-white p-4 transition-all hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-[#0A0A0A]">{assignment.teacher_name}</p>
                  <p className="mt-1 text-sm text-[#6B6B6B]">{assignment.email}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant="blue">{assignment.batch_name}</Badge>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEdit(assignment)}
                    className="inline-flex items-center gap-1 rounded-xl border border-[#E5E5E3] bg-white px-3 py-2 text-sm font-semibold text-[#0A0A0A] transition-colors hover:bg-[#F5F5F3]"
                  >
                    <Pencil size={13} /> Edit
                  </button>
                  <button
                    onClick={() => onDelete(assignment)}
                    className="inline-flex items-center gap-1 rounded-xl border border-[#F3C6C0] bg-[#FFF5F5] px-3 py-2 text-sm font-semibold text-[#EF4444] transition-colors hover:bg-[#ffecec]"
                  >
                    <Trash2 size={13} /> Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

export default function AdminSubjectsPage() {
  const toast = useToast();
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignmentsLoading, setAssignmentsLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [assignments, setAssignments] = useState([]);
  const [assignmentsOpen, setAssignmentsOpen] = useState(false);
  const [assignmentEditorOpen, setAssignmentEditorOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [subjectsRes, teachersRes, batchesRes] = await Promise.all([
        api.get('/subjects'),
        api.get('/users?role=teacher&limit=500'),
        api.get('/batches'),
      ]);
      setSubjects(subjectsRes.data.data || []);
      setTeachers(teachersRes.data.data?.users || []);
      setBatches(batchesRes.data.data || []);
    } catch {
      setSubjects([]);
      setTeachers([]);
      setBatches([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchAll();
  }, [fetchAll]);

  const filteredSubjects = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return subjects;
    return subjects.filter((subject) =>
      [subject.name, subject.teacher_count, subject.question_count].join(' ').toLowerCase().includes(q)
    );
  }, [search, subjects]);

  const loadAssignments = async (subject) => {
    setSelectedSubject(subject);
    setAssignmentsOpen(true);
    setAssignmentsLoading(true);
    try {
      const res = await api.get(`/subjects/${subject.id}/assignments`);
      setAssignments(res.data.data || []);
    } catch {
      setAssignments([]);
    } finally {
      setAssignmentsLoading(false);
    }
  };

  const handleDeleteSubject = async (subject) => {
    try {
      await api.delete(`/subjects/${subject.id}`);
      toast({ message: 'Subject deleted', type: 'success' });
      fetchAll();
      if (selectedSubject?.id === subject.id) {
        setAssignmentsOpen(false);
        setSelectedSubject(null);
      }
    } catch (err) {
      toast({ message: err.response?.data?.message || 'Unable to delete subject', type: 'error' });
    }
  };

  const refreshAssignments = async () => {
    if (!selectedSubject) return;
    setAssignmentsLoading(true);
    try {
      const res = await api.get(`/subjects/${selectedSubject.id}/assignments`);
      setAssignments(res.data.data || []);
    } catch {
      setAssignments([]);
    } finally {
      setAssignmentsLoading(false);
    }
  };

  const refreshSubjectViews = async () => {
    await fetchAll();
    await refreshAssignments();
  };

  const handleAddAssignment = () => {
    setSelectedAssignment(null);
    setAssignmentEditorOpen(true);
  };

  const handleEditAssignment = (assignment) => {
    setSelectedAssignment(assignment);
    setAssignmentEditorOpen(true);
  };

  const handleDeleteAssignment = async (assignment) => {
    if (!selectedSubject) return;
    try {
      await api.delete(`/subjects/${selectedSubject.id}/assignments/${assignment.id}`);
      toast({ message: 'Assignment removed', type: 'success' });
      await refreshSubjectViews();
    } catch (err) {
      toast({ message: err.response?.data?.message || 'Unable to remove assignment', type: 'error' });
    }
  };

  return (
    <div className="transition-all duration-500" style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(12px)' }}>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#FF4D00]">Admin workspace</p>
          <h1 className="mt-2 text-[clamp(28px,3vw,38px)] font-black tracking-tight text-[#0A0A0A]">Subjects</h1>
          <p className="mt-2 text-sm text-[#6B6B6B]">Manage subjects and wire them to teachers and batches.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin">
            <Button variant="secondary">Back to overview</Button>
          </Link>
          <Button variant="orange" icon={<Plus size={15} />} onClick={() => setCreateOpen(true)}>Create subject</Button>
        </div>
      </div>

      <div className="mb-5 flex max-w-md items-center gap-3 rounded-2xl border border-[#E5E5E3] bg-white px-4 py-3">
        <Search size={16} className="text-[#A3A3A0]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search subjects..."
          className="w-full bg-transparent text-sm text-[#0A0A0A] outline-none placeholder:text-[#A3A3A0]"
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-[#E5E5E3] bg-white p-5 animate-pulse">
              <div className="h-4 w-24 rounded bg-[#F0F0EE]" />
              <div className="mt-3 h-7 w-3/4 rounded bg-[#F0F0EE]" />
              <div className="mt-4 h-20 rounded-2xl bg-[#F0F0EE]" />
            </div>
          ))
        ) : filteredSubjects.length === 0 ? (
          <div className="col-span-full rounded-3xl border border-dashed border-[#E5E5E3] bg-white px-6 py-16 text-center text-[#6B6B6B]">
            <BookOpen size={36} className="mx-auto mb-4 text-[#C0C0BC]" />
            <p className="text-base font-semibold text-[#0A0A0A]">No subjects yet</p>
            <p className="mt-1 text-sm">Create your first subject to unlock quiz and question workflows.</p>
          </div>
        ) : (
          filteredSubjects.map((subject) => (
            <div key={subject.id} className="rounded-2xl border border-[#E5E5E3] bg-white p-5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-black tracking-tight text-[#0A0A0A]">{subject.name}</h2>
                  <p className="mt-1 text-sm text-[#6B6B6B]">Academic subject in this institution</p>
                </div>
                <Badge variant="orange">Active</Badge>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-[#FAFAF8] p-3">
                  <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#A3A3A0]"><Users size={13} />Teachers</div>
                  <div className="text-sm font-bold text-[#0A0A0A]">{subject.teacher_count ?? 0}</div>
                </div>
                <div className="rounded-xl bg-[#FAFAF8] p-3">
                  <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#A3A3A0]"><ClipboardList size={13} />Questions</div>
                  <div className="text-sm font-bold text-[#0A0A0A]">{subject.question_count ?? 0}</div>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between gap-3">
                <button
                  onClick={() => loadAssignments(subject)}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-[#FF4D00] transition-colors hover:text-[#e64400]"
                >
                  Manage assignments <ArrowRight size={14} />
                </button>
                <button
                  onClick={() => handleDeleteSubject(subject)}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#F3C6C0] bg-[#FFF5F5] px-3 py-2 text-sm font-semibold text-[#EF4444] transition-colors hover:bg-[#ffecec]"
                >
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <SubjectModal open={createOpen} onClose={() => setCreateOpen(false)} onSuccess={fetchAll} />

      <AssignmentsModal
        open={assignmentsOpen}
        onClose={() => setAssignmentsOpen(false)}
        subject={selectedSubject}
        assignments={assignments}
        loading={assignmentsLoading}
        onAdd={handleAddAssignment}
        onEdit={handleEditAssignment}
        onDelete={handleDeleteAssignment}
      />

      <AssignmentModal
        open={assignmentEditorOpen}
        onClose={() => setAssignmentEditorOpen(false)}
        subject={selectedSubject}
        assignment={selectedAssignment}
        teachers={teachers}
        batches={batches}
        onSuccess={refreshSubjectViews}
      />
    </div>
  );
}
