'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, AlertCircle } from 'lucide-react';

function Skeleton({ w = '100%', h = 20 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: 8,
      background: 'linear-gradient(90deg, #f0f0ef 25%, #e5e5e3 50%, #f0f0ef 75%)',
      backgroundSize: '200% 100%', animation: 'loading 1.5s infinite'
    }} />
  );
}

export default function AdminDetailPage() {
  const router = useRouter();
  const params = useParams();
  const tenantId = params.id;
  const adminId = params.userId;

  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/api/users/${adminId}`, { params: { tenantId } })
      .then(res => {
        if (res.data?.data) setAdmin(res.data.data);
      })
      .catch(err => {
        setError(err.response?.data?.message || 'Failed to load admin');
      })
      .finally(() => setLoading(false));
  }, [tenantId, adminId]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#FAFAF8', padding: '32px 20px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Skeleton h={32} w="40%" style={{ marginBottom: 32 }} />
          <div style={{ padding: 24, background: 'white', borderRadius: 12 }}>
            <Skeleton h={20} w="100%" style={{ marginBottom: 16 }} />
            <Skeleton h={20} w="100%" style={{ marginBottom: 16 }} />
            <Skeleton h={20} w="60%" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !admin) {
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
            <p style={{ fontSize: 14, margin: 0 }}>{error || 'Admin not found'}</p>
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
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0A0A0A', margin: 0 }}>{admin.name}</h1>
            <p style={{ fontSize: 14, color: '#7A7167', margin: '8px 0 0 0' }}>{admin.email}</p>
          </div>
        </div>

        {/* Admin Details */}
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E5E5E3', padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 24 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#7A7167', marginBottom: 8 }}>Email</div>
              <div style={{ fontSize: 14, color: '#0A0A0A', fontWeight: 500 }}>{admin.email}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#7A7167', marginBottom: 8 }}>Role</div>
              <div style={{ fontSize: 14, color: '#0A0A0A', fontWeight: 500, textTransform: 'capitalize' }}>Administrator</div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#7A7167', marginBottom: 8 }}>Created</div>
              <div style={{ fontSize: 14, color: '#0A0A0A', fontWeight: 500 }}>{new Date(admin.created_at).toLocaleDateString()}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#7A7167', marginBottom: 8 }}>Status</div>
              <div style={{
                display: 'inline-block',
                padding: '6px 12px', borderRadius: 6,
                background: admin.is_active ? '#ECFDF5' : '#FEF2F2',
                color: admin.is_active ? '#047857' : '#B91C1C',
                fontWeight: 600, fontSize: 12
              }}>
                {admin.is_active ? 'Active' : 'Inactive'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
