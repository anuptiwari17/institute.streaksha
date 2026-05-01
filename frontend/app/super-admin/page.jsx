'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import { getUser } from '@/lib/auth';
import {
  Building2, Users, BarChart3, TrendingUp,
  ArrowRight, ChevronRight, Plus, Settings
} from 'lucide-react';

// ── Skeleton loader ───────────────────────────────────────────────────────────
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

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color, bg, loading, href }) {
  const content = (
    <div style={{ padding: 24, background: 'white', borderRadius: 16, border: '1px solid #E5E5E3' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#7A7167', marginBottom: 12 }}>
            {label}
          </div>
          {loading ? (
            <>
              <Skeleton h={32} w="60%" style={{ marginBottom: 8 }} />
              <Skeleton h={13} w="80%" />
            </>
          ) : (
            <>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#0A0A0A', lineHeight: 1, letterSpacing: '-0.04em', marginBottom: 6 }}>
                {value}
              </div>
              <div style={{ fontSize: 12, color: '#A3A3A0' }}>across all institutions</div>
            </>
          )}
        </div>
        <div style={{ width: 56, height: 56, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={24} color={color} />
        </div>
      </div>
    </div>
  );

  return href ? (
    <Link href={href} style={{ textDecoration: 'none' }}>
      {content}
    </Link>
  ) : content;
}

// ── Institutions list ─────────────────────────────────────────────────────────
function InstitutionsList({ institutions, loading }) {
  if (loading) {
    return (
      <div style={{ display: 'grid', gap: 12 }}>
        {[...Array(5)].map((_, i) => (
          <div key={i} style={{ padding: 16, background: 'white', borderRadius: 12, border: '1px solid #E5E5E3' }}>
            <Skeleton h={18} w="40%" style={{ marginBottom: 8 }} />
            <Skeleton h={13} w="60%" />
          </div>
        ))}
      </div>
    );
  }

  if (!institutions?.length) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#7A7167' }}>
        <Building2 size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
        <p>No institutions yet</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {institutions.map(inst => (
        <Link key={inst.id} href={`/super-admin/institutions/${inst.id}`}>
          <div style={{
            padding: 16, background: 'white', borderRadius: 12, border: '1px solid #E5E5E3',
            cursor: 'pointer', transition: 'all 0.2s', display: 'flex', justifyContent: 'space-between',
            alignItems: 'center'
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#D4D4D8'; e.currentTarget.style.background = '#FAFAF8'; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#E5E5E3'; e.currentTarget.style.background = 'white'; }}
          >
            <div>
              <div style={{ fontWeight: 700, color: '#0A0A0A', marginBottom: 4 }}>{inst.name}</div>
              <div style={{ fontSize: 13, color: '#7A7167' }}>
                {inst.stats?.users || 0} users · {inst.stats?.batches || 0} batches · {inst.stats?.quizzes || 0} quizzes
              </div>
            </div>
            <ChevronRight size={18} color="#A3A3A0" />
          </div>
        </Link>
      ))}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SuperAdminOverview() {
  const user = getUser();
  const [stats, setStats] = useState(null);
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    Promise.all([
      api.get('/tenants').catch(() => ({ data: { data: { tenants: [] } } })),
    ]).then(async ([tenantsRes]) => {
      const tenantList = tenantsRes?.data?.data?.tenants || [];
      setInstitutions(tenantList);

      if (tenantList.length) {
        const statsResults = await Promise.all(
          tenantList.map((tenant) => api.get(`/tenants/${tenant.id}/stats`).catch(() => null))
        );

        const totals = statsResults.reduce((acc, res) => {
          const current = res?.data?.data || {};
          return {
            institutions: acc.institutions + 1,
            admins: acc.admins + Number(current.admins || 0),
            teachers: acc.teachers + Number(current.teachers || 0),
            students: acc.students + Number(current.students || 0),
            batches: acc.batches + Number(current.batches || 0),
            subjects: acc.subjects + Number(current.subjects || 0),
            quizzes: acc.quizzes + Number(current.quizzes || 0),
            attempts: acc.attempts + Number(current.total_attempts || 0),
          };
        }, { institutions: 0, admins: 0, teachers: 0, students: 0, batches: 0, subjects: 0, quizzes: 0, attempts: 0 });

        setStats(totals);
      } else {
        setStats({ institutions: 0, admins: 0, teachers: 0, students: 0, batches: 0, subjects: 0, quizzes: 0, attempts: 0 });
      }
    }).catch(() => null)
    .finally(() => setLoading(false));

    return () => clearTimeout(timer);
  }, []);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  if (!mounted) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF8' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 20px' }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 32, fontWeight: 900, color: '#0A0A0A', letterSpacing: '-0.02em', marginBottom: 8 }}>
            {greeting}, {user?.name?.split(' ')[0]}
          </div>
          <p style={{ fontSize: 15, color: '#7A7167', lineHeight: 1.6 }}>
            Platform overview. Manage institutions, users, and view system-wide analytics.
          </p>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16, marginBottom: 40 }}>
          <StatCard
            label="Active Institutions"
            value={stats?.institutions || 0}
            icon={Building2}
            color="#FF4D00"
            bg="#FFF0EB"
            loading={loading}
            href="/super-admin/institutions"
          />
          <StatCard
            label="Admins"
            value={stats?.admins || 0}
            icon={Users}
            color="#2563EB"
            bg="#EFF6FF"
            loading={loading}
          />
          <StatCard
            label="Teachers"
            value={stats?.teachers || 0}
            icon={BarChart3}
            color="#10B981"
            bg="#F0FDF4"
            loading={loading}
          />
          <StatCard
            label="Students"
            value={stats?.students || 0}
            icon={TrendingUp}
            color="#8B5CF6"
            bg="#F5F3FF"
            loading={loading}
          />
          <StatCard
            label="Quizzes"
            value={stats?.quizzes || 0}
            icon={TrendingUp}
            color="#111111"
            bg="#E7E3DD"
            loading={loading}
          />
        </div>

        {/* Institutions Section */}
        <div style={{ background: 'white', borderRadius: 20, padding: 24, border: '1px solid #E5E5E3', marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0A0A0A', margin: 0, letterSpacing: '-0.02em' }}>
                Institutions
              </h2>
              <p style={{ fontSize: 13, color: '#7A7167', margin: '8px 0 0 0' }}>
                {institutions.length} active
              </p>
            </div>
            <Link href="/super-admin/institutions" style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 16px', borderRadius: 12, background: '#FF4D00', color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
              <span>View All</span>
              <ArrowRight size={16} />
            </Link>
          </div>
          <InstitutionsList institutions={institutions.slice(0, 5).map((inst) => ({
            ...inst,
            stats: {
              users: inst.user_count,
              quizzes: inst.quiz_count,
              batches: inst.batch_count,
            },
          }))} loading={loading} />
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
