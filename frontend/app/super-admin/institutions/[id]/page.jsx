'use client';
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import { ArrowLeft, Users, BarChart3, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

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

function StatCard({ label, value, icon: Icon, color, bg, loading }) {
  return (
    <div style={{ padding: 20, background: 'white', borderRadius: 12, border: '1px solid #E5E5E3' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#7A7167', marginBottom: 12 }}>
            {label}
          </div>
          {loading ? (
            <Skeleton h={28} w="50%" />
          ) : (
            <div style={{ fontSize: 28, fontWeight: 900, color: '#0A0A0A', lineHeight: 1, letterSpacing: '-0.02em' }}>
              {value}
            </div>
          )}
        </div>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={20} color={color} />
        </div>
      </div>
    </div>
  );
}

export default function InstitutionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const institutionId = params.id;

  const [institution, setInstitution] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([
      api.get(`/tenants/${institutionId}`),
      api.get(`/tenants/${institutionId}/stats`),
    ])
      .then(([tenantRes, statsRes]) => {
        if (tenantRes.data?.data) setInstitution(tenantRes.data.data);
        if (statsRes.data?.data) setStats(statsRes.data.data);
      })
      .catch(err => {
        setError(err.response?.data?.message || 'Failed to load institution');
      })
      .finally(() => setLoading(false));
  }, [institutionId]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#FAFAF8', padding: '32px 20px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Skeleton h={32} w="40%" style={{ marginBottom: 32 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 32 }}>
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ padding: 20, background: 'white', borderRadius: 12 }}>
                <Skeleton h={14} w="60%" style={{ marginBottom: 12 }} />
                <Skeleton h={28} w="50%" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !institution) {
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
            <p style={{ fontSize: 14, margin: 0 }}>{error || 'Institution not found'}</p>
          </div>
        </div>
      </div>
    );
  }

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
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0A0A0A', margin: 0, letterSpacing: '-0.02em' }}>
              {institution.name}
            </h1>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
              {institution.status === 'active' ? (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, background: '#ECFDF5', color: '#047857', fontSize: 13, fontWeight: 600 }}>
                  <CheckCircle size={14} />
                  Active
                </span>
              ) : (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 6, background: '#FEF2F2', color: '#B91C1C', fontSize: 13, fontWeight: 600 }}>
                  <AlertCircle size={14} />
                  Inactive
                </span>
              )}
              <span style={{ fontSize: 12, color: '#7A7167' }}>
                Created {new Date(institution.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 32 }}>
          <StatCard
            label="Admins"
            value={stats?.admins || 0}
            icon={Users}
            color="#2563EB"
            bg="#EFF6FF"
            loading={false}
          />
          <StatCard
            label="Teachers"
            value={stats?.teachers || 0}
            icon={BarChart3}
            color="#10B981"
            bg="#F0FDF4"
            loading={false}
          />
          <StatCard
            label="Students"
            value={stats?.students || 0}
            icon={TrendingUp}
            color="#FF4D00"
            bg="#FFF0EB"
            loading={false}
          />
          <StatCard
            label="Batches"
            value={stats?.batches || 0}
            icon={BarChart3}
            color="#8B5CF6"
            bg="#F5F3FF"
            loading={false}
          />
          <StatCard
            label="Subjects"
            value={stats?.subjects || 0}
            icon={BarChart3}
            color="#111111"
            bg="#E7E3DD"
            loading={false}
          />
          <StatCard
            label="Quizzes"
            value={stats?.quizzes || 0}
            icon={TrendingUp}
            color="#14B8A6"
            bg="#FFF0EB"
            loading={false}
          />
          <StatCard
            label="Quiz Attempts"
            value={stats?.total_attempts || 0}
            icon={BarChart3}
            color="#0F172A"
            bg="#F5F3FF"
            loading={false}
          />
        </div>

        {/* Details Card */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #E5E5E3' }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0A0A0A', margin: '0 0 20px 0', letterSpacing: '-0.02em' }}>
            Institution Details
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#7A7167', marginBottom: 6 }}>
                Institution ID
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#0A0A0A', fontFamily: 'monospace' }}>
                {institution.id}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#7A7167', marginBottom: 6 }}>
                Status
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#0A0A0A' }}>
                {institution.status === 'active' ? 'Active' : 'Inactive'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#7A7167', marginBottom: 6 }}>
                Created On
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#0A0A0A' }}>
                {new Date(institution.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#7A7167', marginBottom: 6 }}>
                Last Updated
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, color: '#0A0A0A' }}>
                {institution.updated_at ? new Date(institution.updated_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Drilldown Navigation */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #E5E5E3', marginTop: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0A0A0A', margin: '0 0 20px 0', letterSpacing: '-0.02em' }}>
            Explore Institution
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            <button onClick={() => router.push(`/super-admin/institutions/${institutionId}/teachers`)} style={{
              padding: '12px 16px', borderRadius: 8, border: '1px solid #E5E5E3',
              background: 'white', color: '#0A0A0A', fontWeight: 600, cursor: 'pointer',
              fontSize: 14, transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FFF0EB'; e.currentTarget.style.borderColor = '#FF4D00'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#E5E5E3'; }}
            >
              👨‍🏫 Teachers
            </button>
            <button onClick={() => router.push(`/super-admin/institutions/${institutionId}/admins`)} style={{
              padding: '12px 16px', borderRadius: 8, border: '1px solid #E5E5E3',
              background: 'white', color: '#0A0A0A', fontWeight: 600, cursor: 'pointer',
              fontSize: 14, transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FFF0EB'; e.currentTarget.style.borderColor = '#FF4D00'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#E5E5E3'; }}
            >
              👤 Admins
            </button>
            <button onClick={() => router.push(`/super-admin/institutions/${institutionId}/batches`)} style={{
              padding: '12px 16px', borderRadius: 8, border: '1px solid #E5E5E3',
              background: 'white', color: '#0A0A0A', fontWeight: 600, cursor: 'pointer',
              fontSize: 14, transition: 'all 0.2s'
            }}
            onMouseEnter={e => { e.currentTarget.style.background = '#FFF0EB'; e.currentTarget.style.borderColor = '#FF4D00'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.borderColor = '#E5E5E3'; }}
            >
              📚 Batches
            </button>
          </div>
        </div>

        {/* Actions Card */}
        <div style={{ background: 'white', borderRadius: 16, padding: 24, border: '1px solid #E5E5E3', marginTop: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 900, color: '#0A0A0A', margin: '0 0 20px 0', letterSpacing: '-0.02em' }}>
            Institution Status
          </h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {institution.status === 'active' ? (
              <button style={{
                padding: '10px 16px', borderRadius: 8, border: '1px solid #E5E5E3',
                background: '#FEF2F2', color: '#B91C1C', fontWeight: 600, cursor: 'pointer',
                fontSize: 14, transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.target.style.background = '#FDE2E2'; }}
              onMouseLeave={e => { e.target.style.background = '#FEF2F2'; }}
              >
                Deactivate Institution
              </button>
            ) : (
              <button style={{
                padding: '10px 16px', borderRadius: 8, border: '1px solid #E5E5E3',
                background: '#ECFDF5', color: '#047857', fontWeight: 600, cursor: 'pointer',
                fontSize: 14, transition: 'all 0.2s'
              }}
              onMouseEnter={e => { e.target.style.background = '#D1FAE5'; }}
              onMouseLeave={e => { e.target.style.background = '#ECFDF5'; }}
              >
                Activate Institution
              </button>
            )}
          </div>
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
