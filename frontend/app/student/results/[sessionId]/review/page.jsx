'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, CheckCircle2, Circle, FileText, ShieldAlert, Trophy } from 'lucide-react';

function formatDate(value) {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'N/A';
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function parseContent(content) {
  if (!content) return { text: '', options: [] };
  if (typeof content === 'string') return { text: content, options: [] };
  return {
    text: content.text || content.question || '',
    options: Array.isArray(content.options) ? content.options : [],
  };
}

function answerToLabel(question, answer) {
  if (answer == null) return 'Not answered';
  if (question.type === 'mcq_single' && question.content?.options) {
    const index = Number(answer);
    return question.content.options[index] || String(answer);
  }
  if (question.type === 'mcq_multiple' && Array.isArray(answer)) {
    return answer.map((choice) => question.content?.options?.[Number(choice)] || choice).join(', ');
  }
  if (typeof answer === 'object') return JSON.stringify(answer);
  return String(answer);
}

function formatCorrectAnswer(question, answer) {
  if (answer == null) return 'N/A';
  if (question.type === 'mcq_single') {
    const index = Number(answer.index);
    return question.content?.options?.[index] || `Option ${index + 1}`;
  }
  if (question.type === 'mcq_multiple') {
    const indices = Array.isArray(answer.indices) ? answer.indices.map(Number) : [];
    return indices.map((index) => question.content?.options?.[index] || `Option ${index + 1}`).join(', ');
  }
  if (question.type === 'integer' || question.type === 'fill_blank') {
    return String(answer.value);
  }
  if (question.type === 'true_false') {
    return String(answer.value);
  }
  return JSON.stringify(answer);
}

function QuestionCard({ item }) {
  const { text, options } = parseContent(item.content);
  const correct = item.correct_answer ?? null;
  const yourAnswer = item.answer ?? null;

  return (
    <div style={{ background: 'white', border: '1px solid #E7E3DD', borderRadius: 24, padding: 22, display: 'grid', gap: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 999, background: item.is_correct ? '#ECFDF5' : '#FEF2F2', color: item.is_correct ? '#047857' : '#B91C1C', fontSize: 12, fontWeight: 800, marginBottom: 10 }}>
            {item.is_correct ? <CheckCircle2 size={13} /> : <ShieldAlert size={13} />}
            {item.is_correct ? 'Correct' : 'Incorrect'}
          </div>
          <h3 style={{ margin: 0, fontSize: 20, fontWeight: 900, letterSpacing: '-0.04em', lineHeight: 1.15 }}>
            {text}
          </h3>
          <div style={{ marginTop: 7, fontSize: 13, color: '#7A7167' }}>
            Type: {item.type} · Max marks: {item.max_marks}
          </div>
        </div>
        <div style={{ minWidth: 96, textAlign: 'right' }}>
          <div style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.05em', color: '#111111' }}>
            {item.marks_awarded ?? 0}
          </div>
          <div style={{ fontSize: 12, color: '#7A7167', fontWeight: 700 }}>Marks</div>
        </div>
      </div>

      {options.length > 0 && (
        <div style={{ display: 'grid', gap: 10 }}>
          {options.map((option, index) => {
            const selected = item.type === 'mcq_multiple'
              ? Array.isArray(yourAnswer) && yourAnswer.map(Number).includes(index)
              : Number(yourAnswer) === index;
            const answerLabel = item.type === 'mcq_multiple'
              ? Array.isArray(correct?.indices) && correct.indices.map(Number).includes(index)
              : Number(correct?.index) === index;

            return (
              <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #E7E3DD', borderRadius: 16, padding: '12px 14px', background: selected ? '#F8FAFC' : 'white' }}>
                <Circle size={14} color={answerLabel ? '#047857' : '#D4D4D8'} fill={answerLabel ? '#047857' : 'none'} />
                <span style={{ fontSize: 14, fontWeight: 600, color: '#111111' }}>{option}</span>
                {selected && <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 800, color: '#2563EB' }}>Your answer</span>}
              </div>
            );
          })}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ background: '#FAF8F5', borderRadius: 16, padding: 14 }}>
          <div style={{ fontSize: 11, color: '#7A7167', fontWeight: 800, textTransform: 'uppercase' }}>Your answer</div>
          <div style={{ marginTop: 6, fontSize: 14, fontWeight: 700 }}>{answerToLabel(item, yourAnswer)}</div>
        </div>
        <div style={{ background: '#FAF8F5', borderRadius: 16, padding: 14 }}>
          <div style={{ fontSize: 11, color: '#7A7167', fontWeight: 800, textTransform: 'uppercase' }}>Correct answer</div>
          <div style={{ marginTop: 6, fontSize: 14, fontWeight: 700 }}>{formatCorrectAnswer(item, correct)}</div>
        </div>
      </div>
    </div>
  );
}

export default function StudentReviewPage() {
  const params = useParams();
  const sessionId = params.sessionId;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [review, setReview] = useState(null);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        setError('');
        const res = await api.get(`/sessions/${sessionId}/review`);
        if (!active) return;
        setReview(res.data?.data || null);
      } catch (err) {
        if (active) setError(err.response?.data?.message || 'Failed to load review');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [sessionId]);

  const stats = useMemo(() => {
    if (!review?.result) return null;
    return review.result;
  }, [review]);

  return (
    <div style={{ fontFamily: 'Segoe UI, sans-serif', color: '#111111', padding: '8px 0 24px' }}>
      <div style={{ marginBottom: 20 }}>
        <Link href="/student/results" style={{ textDecoration: 'none' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 16, border: '1px solid #E7E3DD', background: 'white', color: '#111111', fontSize: 13, fontWeight: 800 }}>
            <ArrowLeft size={14} /> Back to results
          </div>
        </Link>
      </div>

      <div style={{ borderRadius: 32, padding: '28px clamp(18px, 4vw, 32px)', background: 'linear-gradient(135deg, #FFFFFF 0%, #EEF5FF 100%)', border: '1px solid #E8E1D8', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, color: '#8A8177', fontSize: 13, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          <FileText size={14} /> Review mode
        </div>
        <h1 style={{ margin: 0, fontSize: 'clamp(30px, 4.5vw, 50px)', lineHeight: 1.02, letterSpacing: '-0.06em', fontWeight: 900 }}>
          Session review
        </h1>
        <p style={{ margin: '12px 0 0', fontSize: 'clamp(15px, 1.8vw, 17px)', lineHeight: 1.6, color: '#655B51', maxWidth: 780 }}>
          Review your submitted answers, score details, and violation summary for this quiz attempt.
        </p>
      </div>

      {loading ? (
        <div style={{ padding: 24, color: '#6B6B6B' }}>Loading review...</div>
      ) : error ? (
        <div style={{ padding: 18, borderRadius: 16, background: '#FEF2F2', border: '1px solid #FECACA', color: '#991B1B', fontSize: 14, fontWeight: 600 }}>
          {error}
        </div>
      ) : !review ? (
        <div style={{ padding: 18, borderRadius: 16, background: '#FFF7ED', border: '1px solid #FED7AA', color: '#9A3412', fontSize: 14, fontWeight: 600 }}>
          Review data not available.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <div style={{ background: 'white', border: '1px solid #E7E3DD', borderRadius: 20, padding: 18 }}>
              <div style={{ fontSize: 12, color: '#7A7167', fontWeight: 800, textTransform: 'uppercase' }}>Status</div>
              <div style={{ marginTop: 8, fontSize: 18, fontWeight: 900 }}>{review.session?.status || 'N/A'}</div>
            </div>
            <div style={{ background: 'white', border: '1px solid #E7E3DD', borderRadius: 20, padding: 18 }}>
              <div style={{ fontSize: 12, color: '#7A7167', fontWeight: 800, textTransform: 'uppercase' }}>Score</div>
              <div style={{ marginTop: 8, fontSize: 18, fontWeight: 900 }}>{stats ? `${stats.scored_marks}/${stats.total_marks}` : 'N/A'}</div>
            </div>
            <div style={{ background: 'white', border: '1px solid #E7E3DD', borderRadius: 20, padding: 18 }}>
              <div style={{ fontSize: 12, color: '#7A7167', fontWeight: 800, textTransform: 'uppercase' }}>Percentage</div>
              <div style={{ marginTop: 8, fontSize: 18, fontWeight: 900 }}>{stats ? `${Math.round(Number(stats.percentage || 0))}%` : 'N/A'}</div>
            </div>
            <div style={{ background: 'white', border: '1px solid #E7E3DD', borderRadius: 20, padding: 18 }}>
              <div style={{ fontSize: 12, color: '#7A7167', fontWeight: 800, textTransform: 'uppercase' }}>Violations</div>
              <div style={{ marginTop: 8, fontSize: 18, fontWeight: 900 }}>{review.session?.violationCount || 0}</div>
            </div>
          </div>

          {review.violations?.length > 0 && (
            <div style={{ background: 'white', border: '1px solid #E7E3DD', borderRadius: 24, padding: 22 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <ShieldAlert size={16} />
                <h2 style={{ margin: 0, fontSize: 20, fontWeight: 900, letterSpacing: '-0.04em' }}>Violation summary</h2>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {review.violations.map((item) => (
                  <span key={item.type} style={{ padding: '8px 12px', borderRadius: 999, background: '#FAF8F5', border: '1px solid #E7E3DD', fontSize: 13, fontWeight: 700 }}>
                    {item.type}: {item.count}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gap: 16 }}>
            {(review.answers || []).map((item, index) => (
              <QuestionCard key={`${item.question_id}-${index}`} item={item} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}