'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { ArrowLeft, Search, Building2, Users, BarChart3, Edit2, CheckCircle, AlertCircle } from 'lucide-react';

function Skeleton({ w = '100%', h = 20, radius = 8 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: radius,
      background: 'linear-gradient(90deg, #f0f0ef 25%, #e5e5e3 50%, #f0f0ef 75%)',
      backgroundSize: '200% 100%',
      animation: 'loading 1.5s infinite'
    }} />
  );
}

function InstitutionRow({ inst, loading, onStatusChange }) {
  if (loading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 16, padding: 16, borderBottom: '1px solid #E5E5E3', alignItems: 'center' }}>
        <Skeleton h={18} w="60%" />
        <Skeleton h={16} w="50%" />
        <Skeleton h={16} w="50%" />
        <Skeleton h={16} w="50%" />
        <Skeleton h={16} w="40%" />
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 16, padding: 16, borderBottom: '1px solid #E5E5E3', alignItems: 'center' }}>
      <div>
        <Link href={`/super-admin/institutions/${inst.id}`} style={{ color: '#0A0A0A', fontWeight: 700, textDecoration: 'none' }}>
          {inst.name}
        </Link>
      </div>
      <div style={{ fontSize: 13, color: '#7A7167' }}>
        {inst.user_count || 0} users
      </div>
      <div style={{ fontSize: 13, color: '#7A7167' }}>
        {inst.batch_count || 0} batches
      </div>
      <div style={{ fontSize: 13, color: '#7A7167' }}>
        {inst.quiz_count || 0} quizzes
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {inst.status === 'active' ? (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 6, background: '#ECFDF5', color: '#047857', fontSize: 12, fontWeight: 600 }}>
            <CheckCircle size={14} />
            Active
          </span>
        ) : (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 6, background: '#FEF2F2', color: '#B91C1C', fontSize: 12, fontWeight: 600 }}>
            <AlertCircle size={14} />
            Inactive
          </span>
        )}
      </div>
    </div>
  );
}

export default function InstitutionsPage() {
  const router = useRouter();
  const [institutions, setInstitutions] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/tenants')
      .then(res => {
        const tenants = res.data?.data?.tenants || [];
        if (Array.isArray(tenants)) setInstitutions(tenants);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = institutions.filter(inst =>
    inst.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF8' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 20px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32 }}>
          <button onClick={() => router.back()} style={{
            background: 'white', border: '1px solid #E5E5E3', borderRadius: 8, padding: 8,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0A0A0A', margin: 0, letterSpacing: '-0.02em' }}>
              Institutions
            </h1>
            <p style={{ fontSize: 13, color: '#7A7167', margin: '8px 0 0 0' }}>
              Manage all registered institutions
            </p>
          </div>
        </div>

        {/* Search */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <Search size={18} style={{ position: 'absolute', left: 14, color: '#A3A3A0' }} />
            <input
              type="text"
              placeholder="Search institutions..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '12px 14px 12px 42px', borderRadius: 12,
                border: '1px solid #E5E5E3', fontSize: 14, fontFamily: 'inherit'
              }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E5E5E3', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr auto', gap: 16, padding: 16, background: '#FAFAF8', borderBottom: '1px solid #E5E5E3', fontWeight: 700, fontSize: 13, color: '#7A7167' }}>
            <div>Institution</div>
            <div>Users</div>
            <div>Batches</div>
            <div>Quizzes</div>
            <div>Status</div>
          </div>

          {loading ? (
            [...Array(5)].map((_, i) => <InstitutionRow key={i} inst={{}} loading={true} />)
          ) : filtered.length > 0 ? (
            filtered.map(inst => <InstitutionRow key={inst.id} inst={inst} loading={false} />)
          ) : (
            <div style={{ padding: 40, textAlign: 'center', color: '#7A7167' }}>
              <Building2 size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <p>No institutions found</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
