'use client';

import { useEffect, useState } from 'react';
import { Calendar, Edit2, Mail, Save, X } from 'lucide-react';
import api from '@/lib/api';

function StatCard({ label, value }) {
  return (
    <div style={{ background: '#F5F5F3', borderRadius: 14, padding: 16, textAlign: 'center' }}>
      <div style={{ fontSize: 22, fontWeight: 900, color: '#0A0A0A' }}>{value}</div>
      <div style={{ fontSize: 11, color: '#6B6B6B', marginTop: 4 }}>{label}</div>
    </div>
  );
}

export default function TeacherProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [form, setForm] = useState({ name: '' });

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      setLoading(true);
      try {
        const response = await api.get('/profile');
        if (!active) return;
        const data = response.data?.data || null;
        setProfile(data);
        setForm({ name: data?.name || '' });
      } catch {
        if (active) setMessage({ type: 'error', text: 'Failed to load profile' });
      } finally {
        if (active) setLoading(false);
      }
    }

    loadProfile();
    return () => { active = false; };
  }, []);

  const handleSave = async () => {
    if (!form.name.trim()) {
      setMessage({ type: 'error', text: 'Name is required' });
      return;
    }

    setSaving(true);
    try {
      await api.patch('/profile', { name: form.name.trim() });
      const response = await api.get('/profile');
      const data = response.data?.data || null;
      setProfile(data);
      setForm({ name: data?.name || '' });
      setEditing(false);
      setMessage({ type: 'success', text: 'Profile updated successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: 32, color: '#6B6B6B' }}>Loading profile...</div>;
  }

  if (!profile) {
    return <div style={{ padding: 32, color: '#DC2626' }}>Failed to load profile</div>;
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0A0A0A', letterSpacing: '-0.02em' }}>My Profile</h1>
        <p style={{ fontSize: 13, color: '#6B6B6B', marginTop: 6 }}>View and update your teacher account details</p>
      </div>

      <div style={{ background: 'white', borderRadius: 20, padding: 32, border: '1px solid #E5E5E3', maxWidth: 860 }}>
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'linear-gradient(135deg, #111827, #FF4D00)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 900, margin: '0 auto 16px' }}>
            {profile.name?.charAt(0)?.toUpperCase() || 'T'}
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: '#0A0A0A', marginBottom: 4 }}>{profile.name}</h2>
          <p style={{ fontSize: 13, color: '#6B6B6B' }}>{profile.role} · {profile.email}</p>
        </div>

        {message && (
          <div style={{
            marginBottom: 20,
            padding: '12px 14px',
            borderRadius: 12,
            background: message.type === 'success' ? '#F0FDF4' : '#FEF2F2',
            border: `1px solid ${message.type === 'success' ? '#BBEDD5' : '#FECACA'}`,
            color: '#0A0A0A',
            fontSize: 13,
            fontWeight: 500,
          }}>
            {message.text}
          </div>
        )}

        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            style={{
              width: '100%', marginBottom: 28, padding: '10px 16px', borderRadius: 10,
              border: '1px solid #E5E5E3', background: 'white', fontSize: 13, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
            }}
          >
            <Edit2 size={14} />
            Edit Name
          </button>
        ) : null}

        <div style={{ display: 'grid', gap: 20 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#6B6B6B', display: 'block', marginBottom: 6 }}>Full Name</label>
            {editing ? (
              <input
                type="text"
                value={form.name}
                onChange={e => setForm({ name: e.target.value })}
                style={{ width: '100%', padding: '12px', borderRadius: 10, border: '1px solid #E5E5E3', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box' }}
              />
            ) : (
              <div style={{ padding: '12px', fontSize: 13, color: '#0A0A0A', fontWeight: 500 }}>{profile.name}</div>
            )}
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#6B6B6B', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Mail size={14} />
              Email Address
            </label>
            <div style={{ padding: '12px', fontSize: 13, color: '#6B6B6B', fontWeight: 500 }}>{profile.email}</div>
          </div>

          <div>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#6B6B6B', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
              <Calendar size={14} />
              Joined
            </label>
            <div style={{ padding: '12px', fontSize: 13, color: '#6B6B6B', fontWeight: 500 }}>
              {profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12 }}>
            <StatCard label="Assigned Subjects" value={profile.subjects?.length || 0} />
            <StatCard label="Assigned Batches" value={profile.batches?.length || 0} />
            <StatCard label="Quizzes Created" value={profile.total_quizzes || 0} />
            <StatCard label="Published Quizzes" value={profile.published_quizzes || 0} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0A0A0A', marginBottom: 10 }}>Subjects</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(profile.subjects || []).length > 0 ? profile.subjects.map(subject => (
                  <span key={subject.id} style={{ background: '#F5F5F3', borderRadius: 999, padding: '6px 10px', fontSize: 12, fontWeight: 600, color: '#0A0A0A' }}>
                    {subject.name}
                  </span>
                )) : <span style={{ fontSize: 12, color: '#A3A3A0' }}>No subjects assigned</span>}
              </div>
            </div>
            <div>
              <h3 style={{ fontSize: 13, fontWeight: 700, color: '#0A0A0A', marginBottom: 10 }}>Batches</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {(profile.batches || []).length > 0 ? profile.batches.map(batch => (
                  <span key={batch.id} style={{ background: '#F5F5F3', borderRadius: 999, padding: '6px 10px', fontSize: 12, fontWeight: 600, color: '#0A0A0A' }}>
                    {batch.name}
                  </span>
                )) : <span style={{ fontSize: 12, color: '#A3A3A0' }}>No batches assigned</span>}
              </div>
            </div>
          </div>
        </div>

        {editing && (
          <div style={{ display: 'flex', gap: 12, marginTop: 28 }}>
            <button
              onClick={() => {
                setEditing(false);
                setForm({ name: profile.name || '' });
              }}
              style={{ flex: 1, padding: '10px 16px', borderRadius: 10, border: '1px solid #E5E5E3', background: 'white', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <X size={14} />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ flex: 1, padding: '10px 16px', borderRadius: 10, border: 'none', background: saving ? '#D3D3D1' : '#0A0A0A', color: 'white', fontSize: 13, fontWeight: 600, cursor: saving ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <Save size={14} />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
