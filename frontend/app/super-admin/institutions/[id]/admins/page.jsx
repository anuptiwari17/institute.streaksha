'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, Search, AlertCircle } from 'lucide-react';

function Skeleton({ w = '100%', h = 20 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: 8,
      background: 'linear-gradient(90deg, #f0f0ef 25%, #e5e5e3 50%, #f0f0ef 75%)',
      backgroundSize: '200% 100%', animation: 'loading 1.5s infinite'
    }} />
  );
}

function AdminRow({ admin, onClick }) {
  return (
    <div onClick={onClick} style={{
      display: 'grid', gridTemplateColumns: '2fr 2fr 1fr',
      padding: '16px', borderBottom: '1px solid #E5E5E3',
      cursor: 'pointer', background: 'white'
    }} onMouseEnter={e => e.currentTarget.style.background = '#FAFAF8'}
      onMouseLeave={e => e.currentTarget.style.background = 'white'}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#0A0A0A' }}>{admin.name}</div>
        <div style={{ fontSize: 12, color: '#7A7167', marginTop: 4 }}>{admin.email}</div>
      </div>
      <div style={{ fontSize: 13, color: '#7A7167' }}>
        <div style={{ fontSize: 12, color: '#0A0A0A', fontWeight: 500 }}>
          {new Date(admin.created_at).toLocaleDateString()}
        </div>
      </div>
      <div style={{ textAlign: 'right', fontSize: 12 }}>
        {admin.is_active ? (
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

export default function AdminsPage() {
  const router = useRouter();
  const params = useParams();
  const tenantId = params.id;

  const [admins, setAdmins] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    api.get(`/api/users`, {
      params: { tenantId, role: 'admin', search }
    })
      .then(res => {
        if (res.data?.data?.users) {
          setAdmins(res.data.data.users);
        }
      })
      .catch(err => {
        setError(err.response?.data?.message || 'Failed to load admins');
      })
      .finally(() => setLoading(false));
  }, [tenantId, search]);

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
          <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0A0A0A', margin: 0 }}>Institution Admins</h1>
        </div>

        {/* Search Bar */}
        <div style={{ marginBottom: 24, position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#7A7167' }} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', paddingLeft: 44, paddingRight: 16, paddingTop: 12, paddingBottom: 12,
              borderRadius: 8, border: '1px solid #E5E5E3', fontSize: 14, fontFamily: 'inherit'
            }}
          />
        </div>

        {/* Admins List */}
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E5E5E3', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: 24 }}>
              {[...Array(3)].map((_, i) => (
                <div key={i} style={{ marginBottom: 16 }}>
                  <Skeleton h={60} />
                </div>
              ))}
            </div>
          ) : error ? (
            <div style={{ padding: 24, textAlign: 'center', color: '#B91C1C' }}>
              <AlertCircle size={24} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p>{error}</p>
            </div>
          ) : admins.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#7A7167' }}>
              <p style={{ margin: 0 }}>No admins found</p>
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
              {admins.map(admin => (
                <AdminRow
                  key={admin.id}
                  admin={admin}
                  onClick={() => router.push(`/super-admin/institutions/${tenantId}/admins/${admin.id}`)}
                />
              ))}
            </>
          )}
        </div>

        {/* Count */}
        {!loading && admins.length > 0 && (
          <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: '#7A7167' }}>
            Total: {admins.length} admin{admins.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>
    </div>
  );
}
