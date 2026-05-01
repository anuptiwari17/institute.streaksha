'use client';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import Modal from '@/components/ui/Modal';
import {
  Plus, Search, Edit2, Trash2, Download, Upload,
  X, AlertCircle, CheckCircle
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

function QuestionForm({ question, onSave, onCancel, loading }) {
  const [form, setForm] = useState(question ? {
    type: question.type,
    content: question.content,
    correct_answer: question.correct_answer,
    subjectId: question.subject_id,
  } : {
    type: 'mcq_single',
    content: { text: '', options: ['', ''] },
    correct_answer: { index: 0 },
    subjectId: '',
  });
  const [subjects, setSubjects] = useState([]);

  useEffect(() => {
    api.get('/profile')
      .then(res => {
        setSubjects(res.data?.data?.subjects || []);
      });
  }, []);

  const handleSave = async () => {
    if (!form.content?.text) {
      alert('Question text is required');
      return;
    }
    if ((form.type === 'mcq_single' || form.type === 'mcq_multiple') && (!form.content.options || form.content.options.length < 2)) {
      alert('At least 2 options required');
      return;
    }
    if (form.correct_answer === undefined || form.correct_answer === null) {
      alert('Correct answer is required');
      return;
    }

    // Validate correct_answer based on type
    if (form.type === 'mcq_single' && form.correct_answer.index === undefined) {
      alert('Select correct option for MCQ');
      return;
    }
    if (form.type === 'mcq_multiple' && (!form.correct_answer.indices || form.correct_answer.indices.length === 0)) {
      alert('Select at least one correct option');
      return;
    }
    if (form.type === 'true_false' && form.correct_answer.value === undefined) {
      alert('Select True or False');
      return;
    }
    if (form.type === 'integer' && (form.correct_answer.value === undefined || form.correct_answer.value === null)) {
      alert('Enter correct answer');
      return;
    }
    if (form.type === 'fill_blank' && !form.correct_answer.value) {
      alert('Enter correct answer');
      return;
    }

    // Only send content and correct_answer when editing (type cannot be changed)
    if (question) {
      await onSave({
        content: form.content,
        correct_answer: form.correct_answer
      });
    } else {
      await onSave(form);
    }
  };

  const updateOption = (idx, value) => {
    const options = [...(form.content?.options || [])];
    options[idx] = value;
    setForm({ ...form, content: { ...form.content, options } });
  };

  const toggleCorrectOption = (idx) => {
    if (form.type === 'mcq_single') {
      setForm({ ...form, correct_answer: { index: idx } });
    } else if (form.type === 'mcq_multiple') {
      const indices = form.correct_answer.indices || [];
      const newIndices = indices.includes(idx)
        ? indices.filter(i => i !== idx)
        : [...indices, idx];
      setForm({ ...form, correct_answer: { indices: newIndices } });
    }
  };

  return (
    <div>
      {/* Type selector (disabled when editing) */}
      {!question && (
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A', display: 'block', marginBottom: 8 }}>
            Question Type *
          </label>
          <select
            value={form.type}
            onChange={e => setForm({ ...form, type: e.target.value, correct_answer: {}, content: { text: '', options: ['', ''] } })}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8,
              border: '1px solid #E5E5E3', fontSize: 13, fontFamily: 'inherit',
              backgroundColor: 'white'
            }}>
            <option value="mcq_single">Multiple Choice (Single Answer)</option>
            <option value="mcq_multiple">Multiple Choice (Multiple Answers)</option>
            <option value="true_false">True / False</option>
            <option value="integer">Integer Answer</option>
            <option value="fill_blank">Fill in the Blank</option>
          </select>
        </div>
      )}

      {/* Type display (when editing) */}
      {question && (
        <div style={{ marginBottom: 20, padding: '10px 12px', background: '#F5F5F3', borderRadius: 8, fontSize: 13, color: '#6B6B6B' }}>
          <strong>Type:</strong> {form.type === 'mcq_single' ? 'Multiple Choice (Single Answer)' : form.type === 'mcq_multiple' ? 'Multiple Choice (Multiple Answers)' : form.type === 'true_false' ? 'True/False' : form.type === 'integer' ? 'Integer Answer' : 'Fill in the Blank'}
          <p style={{ fontSize: 11, color: '#A3A3A0', marginTop: 4 }}>Note: Question type cannot be changed after creation</p>
        </div>
      )}

      {/* Subject selector (optional) */}
      {!question && (
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A', display: 'block', marginBottom: 8 }}>
            Subject (Optional)
          </label>
          <select
            value={form.subjectId}
            onChange={e => setForm({ ...form, subjectId: e.target.value })}
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8,
              border: '1px solid #E5E5E3', fontSize: 13, fontFamily: 'inherit',
              backgroundColor: 'white'
            }}>
            <option value="">-- Not assigned to subject --</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <p style={{ fontSize: 11, color: '#A3A3A0', marginTop: 4 }}>
            You can add this question to any subject when creating a quiz
          </p>
        </div>
      )}

      {/* Question text */}
      <div style={{ marginBottom: 20 }}>
        <label style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A', display: 'block', marginBottom: 8 }}>
          Question Text *
        </label>
        <textarea
          value={form.content?.text || ''}
          onChange={e => setForm({ ...form, content: { ...form.content, text: e.target.value } })}
          placeholder="Enter the question text"
          style={{
            width: '100%', padding: '12px', borderRadius: 8,
            border: '1px solid #E5E5E3', fontSize: 13, fontFamily: 'inherit',
            minHeight: 80, resize: 'vertical', boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Options for MCQs */}
      {(form.type === 'mcq_single' || form.type === 'mcq_multiple') && (
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A', display: 'block', marginBottom: 8 }}>
            Options * (Mark correct ones)
          </label>
          {(form.content?.options || []).map((opt, i) => (
            <div key={i} style={{ marginBottom: 8, display: 'flex', gap: 10, alignItems: 'center' }}>
              <input
                type={form.type === 'mcq_single' ? 'radio' : 'checkbox'}
                name="correct"
                checked={form.type === 'mcq_single' ? form.correct_answer.index === i : (form.correct_answer.indices || []).includes(i)}
                onChange={() => toggleCorrectOption(i)}
                style={{ width: 18, height: 18, cursor: 'pointer', flexShrink: 0 }}
              />
              <input
                value={opt}
                onChange={e => updateOption(i, e.target.value)}
                placeholder={`Option ${String.fromCharCode(65 + i)}`}
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: 8,
                  border: '1px solid #E5E5E3', fontSize: 13, fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          ))}
          <button
            onClick={() => setForm({
              ...form,
              content: { ...form.content, options: [...(form.content?.options || []), ''] }
            })}
            style={{
              background: '#F5F5F3', border: '1px solid #E5E5E3', borderRadius: 8,
              padding: '10px 12px', fontSize: 13, fontWeight: 600, color: '#6B6B6B',
              cursor: 'pointer', width: '100%'
            }}>
            + Add Option
          </button>
        </div>
      )}

      {/* True/False selector */}
      {form.type === 'true_false' && (
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A', display: 'block', marginBottom: 8 }}>
            Correct Answer *
          </label>
          <div style={{ display: 'flex', gap: 12 }}>
            {[true, false].map(val => (
              <label key={String(val)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="correct_answer"
                  checked={form.correct_answer.value === val}
                  onChange={() => setForm({ ...form, correct_answer: { value: val } })}
                  style={{ width: 18, height: 18, cursor: 'pointer' }}
                />
                <span style={{ fontSize: 13, color: '#0A0A0A' }}>{val ? 'True' : 'False'}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Integer answer */}
      {form.type === 'integer' && (
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A', display: 'block', marginBottom: 8 }}>
            Correct Answer (Number) *
          </label>
          <input
            type="number"
            value={form.correct_answer.value !== undefined ? form.correct_answer.value : ''}
            onChange={e => setForm({ ...form, correct_answer: { value: parseInt(e.target.value) || 0 } })}
            placeholder="Enter correct number"
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8,
              border: '1px solid #E5E5E3', fontSize: 13, fontFamily: 'inherit',
              boxSizing: 'border-box'
            }}
          />
        </div>
      )}

      {/* Fill in the blank answer */}
      {form.type === 'fill_blank' && (
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 13, fontWeight: 600, color: '#0A0A0A', display: 'block', marginBottom: 8 }}>
            Correct Answer (text will be case-insensitive) *
          </label>
          <input
            type="text"
            value={form.correct_answer.value || ''}
            onChange={e => setForm({ ...form, correct_answer: { value: e.target.value } })}
            placeholder="Enter correct answer"
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8,
              border: '1px solid #E5E5E3', fontSize: 13, fontFamily: 'inherit',
              boxSizing: 'border-box'
            }}
          />
          <p style={{ fontSize: 11, color: '#A3A3A0', marginTop: 4 }}>
            Note: Answers will be matched case-insensitively with whitespace trimmed
          </p>
        </div>
      )}

      {/* Buttons */}
      <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button
          onClick={onCancel}
          style={{
            padding: '10px 20px', borderRadius: 8, border: '1px solid #E5E5E3',
            background: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer'
          }}>
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          style={{
            padding: '10px 20px', borderRadius: 8, border: 'none',
            background: loading ? '#D3D3D1' : '#0A0A0A', color: 'white',
            fontSize: 13, fontWeight: 600, cursor: loading ? 'default' : 'pointer'
          }}>
          {loading ? 'Saving...' : (question ? 'Update Question' : 'Save Question')}
        </button>
      </div>
    </div>
  );
}

export default function QuestionBank() {
  const [questions, setQuestions] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [search, setSearch] = useState('');
  const [subjectId, setSubjectId] = useState('all');
  const [type, setType] = useState('all');
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editQuestion, setEditQuestion] = useState(null);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [toast, setToast] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  // Load all questions on mount
  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get('/profile'),
      api.get('/questions?limit=100'),
    ])
      .then(([profileRes, questionRes]) => {
        setSubjects(profileRes.data?.data?.subjects || []);
        setQuestions(questionRes.data?.data?.questions || []);
      })
      .catch(() => {
        setToast({ message: 'Failed to load questions', type: 'error' });
      })
      .finally(() => setLoading(false));
  }, []);

  const filteredQuestions = questions.filter(q => {
    const matchSearch = !search || q.content?.text?.toLowerCase().includes(search.toLowerCase());
    const matchSubject = subjectId === 'all' || (subjectId === 'unassigned' ? !q.subject_id : String(q.subject_id) === String(subjectId));
    const matchType = type === 'all' || q.type === type;
    return matchSearch && matchSubject && matchType;
  });

  const handleCreateQuestion = async (formData) => {
    setSaving(true);
    try {
      await api.post('/questions', formData);
      setCreateModalOpen(false);
      setToast({ message: 'Question created successfully', type: 'success' });
      // Refresh questions
      const res = await api.get('/questions?limit=100');
      setQuestions(res.data?.data?.questions || []);
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to create question', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateQuestion = async (formData) => {
    setSaving(true);
    try {
      await api.put(`/questions/${editQuestion.id}`, formData);
      setEditModalOpen(false);
      setEditQuestion(null);
      setToast({ message: 'Question updated successfully', type: 'success' });
      // Refresh questions
      const res = await api.get('/questions?limit=100');
      setQuestions(res.data?.data?.questions || []);
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to update question', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteQuestion = async (questionId) => {
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      await api.delete(`/questions/${questionId}`);
      setToast({ message: 'Question deleted', type: 'success' });
      setQuestions(questions.filter(q => q.id !== questionId));
    } catch (err) {
      setToast({ message: err.response?.data?.message || 'Failed to delete', type: 'error' });
    }
  };

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
      <div style={{ marginBottom: 32, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0A0A0A', letterSpacing: '-0.02em' }}>
            Question Bank
          </h1>
          <p style={{ fontSize: 13, color: '#6B6B6B', marginTop: 6 }}>
            Create and manage your questions. All questions are available for use in any quiz.
          </p>
        </div>
        <button
          onClick={() => setCreateModalOpen(true)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: '#0A0A0A', color: 'white', border: 'none',
            borderRadius: 8, padding: '10px 18px', fontSize: 13, fontWeight: 600,
            cursor: 'pointer'
          }}>
          <Plus size={16}/>
          New Question
        </button>
      </div>

      {/* Filters */}
      <div style={{
        background: 'white', borderRadius: 16, padding: 20,
        border: '1px solid #E5E5E3', marginBottom: 24,
        display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: 16
      }}>
        {/* Subject filter */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6B6B6B', display: 'block', marginBottom: 6 }}>
            Subject
          </label>
          <select
            value={subjectId}
            onChange={e => setSubjectId(e.target.value)}
            style={{
              width: '100%', padding: '8px 10px', borderRadius: 8,
              border: '1px solid #E5E5E3', fontSize: 13, fontFamily: 'inherit',
              backgroundColor: 'white'
            }}>
            <option value="all">All Subjects</option>
            <option value="unassigned">Unassigned</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {/* Type filter */}
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6B6B6B', display: 'block', marginBottom: 6 }}>
            Question Type
          </label>
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            style={{
              width: '100%', padding: '8px 10px', borderRadius: 8,
              border: '1px solid #E5E5E3', fontSize: 13, fontFamily: 'inherit',
              backgroundColor: 'white'
            }}>
            <option value="all">All Types</option>
            <option value="mcq_single">Single Choice</option>
            <option value="mcq_multiple">Multiple Choice</option>
            <option value="true_false">True/False</option>
            <option value="integer">Integer</option>
            <option value="fill_blank">Fill Blank</option>
          </select>
        </div>

        {/* Search */}
        <div style={{ gridColumn: 'span 1' }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#6B6B6B', display: 'block', marginBottom: 6 }}>
            Search Questions
          </label>
          <div style={{ position: 'relative' }}>
            <Search size={14} color="#A3A3A0" style={{
              position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)'
            }}/>
            <input
              type="text"
              placeholder="Search by text..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '8px 10px 8px 34px', borderRadius: 8,
                border: '1px solid #E5E5E3', fontSize: 13, fontFamily: 'inherit',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>
      </div>

      {/* Questions list */}
      <div style={{
        background: 'white', borderRadius: 20, padding: 24,
        border: '1px solid #E5E5E3'
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0A0A0A', marginBottom: 16 }}>
          Questions {filteredQuestions.length > 0 && `(${filteredQuestions.length})`}
        </h2>
        {loading ? (
          <div>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ padding: '16px 0', borderBottom: '1px solid #F5F5F3' }}>
                <Skeleton w="60%" h={16} style={{ marginBottom: 8 }}/>
                <Skeleton w="40%" h={12}/>
              </div>
            ))}
          </div>
        ) : filteredQuestions.length > 0 ? (
          <div>
            {filteredQuestions.map(q => (
              <div key={q.id} style={{
                padding: '16px', borderRadius: 12, marginBottom: 12,
                background: '#F5F5F3', display: 'flex', alignItems: 'flex-start', gap: 12,
                justifyContent: 'space-between'
              }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A', marginBottom: 6 }}>
                    {q.content?.text}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: '#6B6B6B',
                      background: 'white', padding: '4px 10px', borderRadius: 6
                    }}>
                      {typeConfig[q.type] || q.type}
                    </span>
                    {q.subject_name && (
                      <span style={{
                        fontSize: 11, fontWeight: 600, color: '#0A7FD9',
                        background: 'white', padding: '4px 10px', borderRadius: 6
                      }}>
                        {q.subject_name}
                      </span>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <button
                    onClick={() => { setEditQuestion(q); setEditModalOpen(true); }}
                    style={{
                      background: 'white', border: '1px solid #E5E5E3',
                      borderRadius: 8, padding: 8, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                    <Edit2 size={14} color="#6B6B6B"/>
                  </button>
                  <button
                    onClick={() => handleDeleteQuestion(q.id)}
                    style={{
                      background: '#FEF2F2', border: '1px solid #FECACA',
                      borderRadius: 8, padding: 8, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                    <Trash2 size={14} color="#DC2626"/>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: '40px 20px', textAlign: 'center' }}>
            <AlertCircle size={32} color="#D3D3D1" style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: 14, color: '#6B6B6B' }}>No questions found. Create your first question to get started!</p>
          </div>
        )}
      </div>

      {/* Create modal */}
      <Modal open={createModalOpen} onClose={() => setCreateModalOpen(false)} title="Create Question" size="xl">
        <QuestionForm
          onSave={handleCreateQuestion}
          onCancel={() => setCreateModalOpen(false)}
          loading={saving}
        />
      </Modal>

      {/* Edit modal */}
      <Modal open={editModalOpen} onClose={() => setEditModalOpen(false)} title="Edit Question" size="xl">
        {editQuestion && (
          <QuestionForm
            question={editQuestion}
            onSave={handleUpdateQuestion}
            onCancel={() => { setEditModalOpen(false); setEditQuestion(null); }}
            loading={saving}
          />
        )}
      </Modal>

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
