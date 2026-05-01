'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, Users, BookOpen } from 'lucide-react';

function Skeleton({ w = '100%', h = 20 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: 8,
      background: 'linear-gradient(90deg, #f0f0ef 25%, #e5e5e3 50%, #f0f0ef 75%)',
      backgroundSize: '200% 100%', animation: 'loading 1.5s infinite'
    }} />
  );
}

function BatchRow({ batch, onClick }) {
  return (
    <div onClick={onClick} style={{
      display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr',
      padding: '16px', borderBottom: '1px solid #E5E5E3',
      cursor: 'pointer', background: 'white'
    }} onMouseEnter={e => e.currentTarget.style.background = '#FAFAF8'}
      onMouseLeave={e => e.currentTarget.style.background = 'white'}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A' }}>{batch.name}</div>
        <div style={{ fontSize: 12, color: '#7A7167', marginTop: 4 }}>
          {batch.academic_year || 'No year specified'}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
        <Users size={16} />
        {batch.student_count || 0}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
        <BookOpen size={16} />
        {batch.teacher_count || 0}
      </div>
      <div style={{ textAlign: 'right', fontSize: 12 }}>
        {batch.is_active ? (
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

export default function BatchesPage() {
  const router = useRouter();
  const params = useParams();
  const tenantId = params.id;

  const [batches, setBatches] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  useEffect(() => {
    setLoading(true);
    api.get(`/api/batches`, {
      params: { tenantId, page, limit }
    })
      .then(res => {
        if (res.data?.data) {
          setBatches(Array.isArray(res.data.data) ? res.data.data : res.data.data.batches || []);
          setTotal(res.data.data?.total || res.data.data?.length || batches.length);
        }
      })
      .catch(err => {
        setError(err.response?.data?.message || 'Failed to load batches');
      })
      .finally(() => setLoading(false));
  }, [tenantId, page]);

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
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0A0A0A', margin: 0 }}>Batches</h1>
        </div>

        {/* Batches List */}
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E5E5E3', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 24 }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} style={{ marginBottom: 16 }}>
                  <Skeleton h={60} />
                </div>
              ))}
            </div>
          ) : error ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#B91C1C' }}>
              <p>{error}</p>
            </div>
          ) : batches.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#7A7167' }}>
              <p style={{ margin: 0 }}>No batches found</p>
            </div>
          ) : (
            <>
              {/* Header Row */}
              <div style={{
                display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr',
                padding: '12px 16px', background: '#F5F3FF', borderBottom: '1px solid #E5E5E3',
                fontWeight: 600, fontSize: 12, color: '#7A7167', textTransform: 'uppercase'
              }}>
                <div>Name</div>
                <div>Students</div>
                <div>Teachers</div>
                <div style={{ textAlign: 'right' }}>Status</div>
              </div>
              {/* Data Rows */}
              {batches.map(batch => (
                <BatchRow
                  key={batch.id}
                  batch={batch}
                  onClick={() => router.push(`/super-admin/institutions/${tenantId}/batches/${batch.id}`)}
                />
              ))}
            </>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && !loading && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 24 }}>
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              style={{
                padding: '8px 16px', borderRadius: 6, border: '1px solid #E5E5E3',
                background: page === 1 ? '#F5F3FF' : 'white', cursor: page === 1 ? 'not-allowed' : 'pointer',
                fontWeight: 500, fontSize: 13
              }}
            >
              Previous
            </button>
            <span style={{ fontSize: 13, color: '#7A7167' }}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              style={{
                padding: '8px 16px', borderRadius: 6, border: '1px solid #E5E5E3',
                background: page === totalPages ? '#F5F3FF' : 'white', cursor: page === totalPages ? 'not-allowed' : 'pointer',
                fontWeight: 500, fontSize: 13
              }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
