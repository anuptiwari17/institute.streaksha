'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, AlertCircle, CheckCircle, Plus, Minus } from 'lucide-react';

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
      {type === 'success' ? <CheckCircle size={18} color="#16A34A"/> : <AlertCircle size={18} color="#DC2626"/>}
      <span style={{ fontSize: 13, fontWeight: 500, color: '#0A0A0A' }}>{message}</span>
    </div>
  );
}

export default function NewQuiz() {
  const router = useRouter();
  const [batches, setBatches] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    batchId: '',
    subjectId: '',
    selectedQuestions: [],
    questionMarks: {},
    duration: 60,
    shuffleQuestions: false,
    shuffleOptions: false,
    startsAt: '',
    endsAt: '',
  });

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    let active = true;
    async function loadTeacherData() {
      try {
        const [profileRes, subjectsRes] = await Promise.all([
          api.get('/profile'),
          api.get('/profile/my-subjects'),
        ]);
        if (!active) return;
        setBatches(profileRes.data?.data?.batches || []);
        setAssignments(subjectsRes.data?.data || []);
      } catch {
        if (active) setToast({ message: 'Failed to load teacher assignments', type: 'error' });
      } finally {
        if (active) setLoading(false);
      }
    }
    loadTeacherData();
    return () => { active = false; };
  }, []);

  const availableSubjects = useMemo(() => {
    if (!formData.batchId) return [];
    const filtered = assignments.filter(item => String(item.batch_id) === String(formData.batchId));
    const seen = new Map();
    filtered.forEach(item => {
      if (!seen.has(String(item.id))) seen.set(String(item.id), { id: item.id, name: item.name });
    });
    return Array.from(seen.values());
  }, [assignments, formData.batchId]);

  const selectedBatch = batches.find(batch => String(batch.id) === String(formData.batchId));
  const selectedSubject = availableSubjects.find(subject => String(subject.id) === String(formData.subjectId));

  useEffect(() => {
    if (!formData.subjectId) {
      setQuestions([]);
      return;
    }
    let active = true;
    setQuestions([]);
    api.get(`/questions?subjectId=${formData.subjectId}&limit=1000`)
      .then(res => {
        if (active) setQuestions(res.data?.data?.questions || []);
      })
      .catch(() => {
        if (active) setToast({ message: 'Failed to load questions for this subject', type: 'error' });
      });
    return () => { active = false; };
  }, [formData.subjectId]);

  const toggleQuestion = (question) => {
    const isSelected = formData.selectedQuestions.includes(question.id);
    if (isSelected) {
      setFormData(prev => {
        const nextSelected = prev.selectedQuestions.filter(id => id !== question.id);
        const nextMarks = { ...prev.questionMarks };
        delete nextMarks[question.id];
        return { ...prev, selectedQuestions: nextSelected, questionMarks: nextMarks };
      });
      return;
    }

    setFormData(prev => ({
      ...prev,
      selectedQuestions: [...prev.selectedQuestions, question.id],
      questionMarks: { ...prev.questionMarks, [question.id]: prev.questionMarks[question.id] || 1 },
    }));
  };

  const updateQuestionMarks = (questionId, value) => {
    const marks = Math.max(1, parseInt(value, 10) || 1);
    setFormData(prev => ({
      ...prev,
      questionMarks: { ...prev.questionMarks, [questionId]: marks },
    }));
  };

  const totalMarks = formData.selectedQuestions.reduce(
    (sum, questionId) => sum + (parseInt(formData.questionMarks[questionId], 10) || 1),
    0,
  );

  const handleSave = async (status) => {
    if (!formData.title.trim()) return setToast({ message: 'Quiz title required', type: 'error' });
    if (!formData.batchId) return setToast({ message: 'Please select a batch first', type: 'error' });
    if (!formData.subjectId) return setToast({ message: 'Please select a subject for this batch', type: 'error' });
    if (formData.selectedQuestions.length === 0) return setToast({ message: 'At least one question required', type: 'error' });

    setSaving(true);
    try {
      const payload = {
        title: formData.title.trim(),
        subjectId: formData.subjectId,
        batchId: formData.batchId,
        config: {
          duration_mins: formData.duration,
          shuffle_questions: formData.shuffleQuestions,
          shuffle_options: formData.shuffleOptions,
        },
        starts_at: formData.startsAt || undefined,
        ends_at: formData.endsAt || undefined,
      };

      const quizResponse = await api.post('/quizzes', payload);
      const quizId = quizResponse.data?.data?.id;

      for (const questionId of formData.selectedQuestions) {
        await api.post(`/quizzes/${quizId}/questions`, {
          questionId,
          marks: parseInt(formData.questionMarks[questionId], 10) || 1,
        });
      }

      if (status === 'published') {
        await api.post(`/quizzes/${quizId}/publish`);
      }

      setToast({ message: `Quiz ${status === 'published' ? 'published' : 'saved as draft'}`, type: 'success' });
      setTimeout(() => router.push('/teacher/quizzes'), 1200);
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to save quiz', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

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
          style={{ background: 'white', border: '1px solid #E5E5E3', borderRadius: 10, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <ArrowLeft size={18} color="#0A0A0A"/>
        </button>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0A0A0A', letterSpacing: '-0.02em' }}>Create New Quiz</h1>
          <p style={{ fontSize: 13, color: '#6B6B6B', marginTop: 4 }}>Choose a batch first, then select the subject assigned in that batch.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 350px', gap: 24 }}>
        <div>
          <div style={{ background: 'white', borderRadius: 20, padding: 24, border: '1px solid #E5E5E3', marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0A0A0A', marginBottom: 16 }}>Basic Information</h2>

            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A', display: 'block', marginBottom: 8 }}>Quiz Title *</label>
              <input
                type="text"
                placeholder="e.g., Physics Unit Test"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid #E5E5E3', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A', display: 'block', marginBottom: 8 }}>Batch *</label>
                <select
                  value={formData.batchId}
                  onChange={e => setFormData({ ...formData, batchId: e.target.value, subjectId: '', selectedQuestions: [], questionMarks: {} })}
                  style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid #E5E5E3', fontSize: 13, fontFamily: 'inherit', backgroundColor: 'white', boxSizing: 'border-box' }}>
                  <option value="">Select Batch</option>
                  {batches.map(batch => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A', display: 'block', marginBottom: 8 }}>Subject *</label>
                <select
                  value={formData.subjectId}
                  disabled={!formData.batchId}
                  onChange={e => setFormData({ ...formData, subjectId: e.target.value, selectedQuestions: [], questionMarks: {} })}
                  style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid #E5E5E3', fontSize: 13, fontFamily: 'inherit', backgroundColor: 'white', boxSizing: 'border-box', opacity: formData.batchId ? 1 : 0.6 }}>
                  <option value="">{formData.batchId ? 'Select Subject' : 'Select a batch first'}</option>
                  {availableSubjects.map(subject => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A', display: 'block', marginBottom: 8 }}>Start Time (Optional)</label>
                <input type="datetime-local" value={formData.startsAt} onChange={e => setFormData({ ...formData, startsAt: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid #E5E5E3', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A', display: 'block', marginBottom: 8 }}>End Time (Optional)</label>
                <input type="datetime-local" value={formData.endsAt} onChange={e => setFormData({ ...formData, endsAt: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid #E5E5E3', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
              </div>
            </div>
          </div>

          <div style={{ background: 'white', borderRadius: 20, padding: 24, border: '1px solid #E5E5E3', marginBottom: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0A0A0A', marginBottom: 16 }}>Settings</h2>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A', display: 'block', marginBottom: 8 }}>Duration (minutes)</label>
              <input type="number" min="1" value={formData.duration} onChange={e => setFormData({ ...formData, duration: parseInt(e.target.value, 10) || 0 })} style={{ width: '100%', padding: '12px', borderRadius: 8, border: '1px solid #E5E5E3', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }} />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', marginBottom: 16 }}>
              <input type="checkbox" checked={formData.shuffleQuestions} onChange={e => setFormData({ ...formData, shuffleQuestions: e.target.checked })} style={{ width: 18, height: 18, cursor: 'pointer' }} />
              <span style={{ fontSize: 13, color: '#0A0A0A' }}>Shuffle questions for each student</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={formData.shuffleOptions} onChange={e => setFormData({ ...formData, shuffleOptions: e.target.checked })} style={{ width: 18, height: 18, cursor: 'pointer' }} />
              <span style={{ fontSize: 13, color: '#0A0A0A' }}>Shuffle options in multiple choice</span>
            </label>
          </div>

          <div style={{ background: 'white', borderRadius: 20, padding: 24, border: '1px solid #E5E5E3' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0A0A0A', marginBottom: 16 }}>Select Questions</h2>

            {!formData.batchId ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', background: '#F5F5F3', borderRadius: 12 }}>
                <AlertCircle size={32} color="#D3D3D1" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: 14, color: '#6B6B6B' }}>Select a batch first</p>
              </div>
            ) : !formData.subjectId ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', background: '#F5F5F3', borderRadius: 12 }}>
                <AlertCircle size={32} color="#D3D3D1" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: 14, color: '#6B6B6B' }}>Select a subject for this batch</p>
              </div>
            ) : questions.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', background: '#F5F5F3', borderRadius: 12 }}>
                <AlertCircle size={32} color="#D3D3D1" style={{ margin: '0 auto 12px' }} />
                <p style={{ fontSize: 14, color: '#6B6B6B' }}>No questions available in this subject</p>
              </div>
            ) : (
              <div>
                {questions.map(question => {
                  const selected = formData.selectedQuestions.includes(question.id);
                  return (
                    <div key={question.id} style={{
                      padding: '14px', borderRadius: 12, marginBottom: 10,
                      background: selected ? '#EFF6FF' : '#F5F5F3',
                      border: selected ? '2px solid #2563EB' : '1px solid #E5E5E3',
                      cursor: 'pointer', transition: 'all 0.2s'
                    }} onClick={() => toggleQuestion(question)}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                        <input type="checkbox" checked={selected} readOnly style={{ width: 18, height: 18, cursor: 'pointer', marginTop: 2, flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A', marginBottom: 4 }}>{question.content?.text}</div>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#6B6B6B', background: 'white', padding: '2px 8px', borderRadius: 4 }}>{question.type}</span>
                            <span style={{ fontSize: 11, fontWeight: 600, color: '#0A0A0A', background: 'white', padding: '2px 8px', borderRadius: 4 }}>{question.subject_name || 'Unassigned'}</span>
                            {selected && (
                              <label style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#0A0A0A', cursor: 'pointer' }} onClick={e => e.stopPropagation()}>
                                Marks
                                <input
                                  type="number"
                                  min="1"
                                  value={formData.questionMarks[question.id] || 1}
                                  onChange={e => updateQuestionMarks(question.id, e.target.value)}
                                  style={{ width: 72, padding: '6px 8px', borderRadius: 8, border: '1px solid #E5E5E3', fontSize: 12 }}
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div style={{ position: 'sticky', top: 20, height: 'fit-content' }}>
          <div style={{ background: 'white', borderRadius: 20, padding: 20, border: '1px solid #E5E5E3' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#0A0A0A', marginBottom: 16 }}>Quiz Summary</h3>
            <SummaryRow label="Batch" value={selectedBatch?.name || '—'} />
            <SummaryRow label="Subject" value={selectedSubject?.name || '—'} />
            <SummaryRow label="Duration" value={`${formData.duration} min`} />
            <SummaryRow label="Questions Selected" value={String(formData.selectedQuestions.length)} />
            <SummaryRow label="Total Marks" value={String(totalMarks)} last />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 24 }}>
              <button onClick={() => handleSave('draft')} disabled={saving} style={{ padding: '12px', borderRadius: 8, border: '1px solid #E5E5E3', background: 'white', fontSize: 13, fontWeight: 600, cursor: saving ? 'default' : 'pointer' }}>
                {saving ? 'Saving...' : 'Save as Draft'}
              </button>
              <button onClick={() => handleSave('published')} disabled={saving} style={{ padding: '12px', borderRadius: 8, border: 'none', background: saving ? '#D3D3D1' : '#0A0A0A', color: 'white', fontSize: 13, fontWeight: 600, cursor: saving ? 'default' : 'pointer' }}>
                {saving ? 'Publishing...' : 'Publish Quiz'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

function SummaryRow({ label, value, last = false }) {
  return (
    <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: last ? 'none' : '1px solid #E5E5E3' }}>
      <div style={{ fontSize: 12, color: '#6B6B6B', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A' }}>{value}</div>
    </div>
  );
}
