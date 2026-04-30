'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { Calendar, Mail, PencilLine, ShieldCheck, Trophy } from 'lucide-react';

function StatCard({ label, value, icon: Icon }) {
  return (
    <div style={{ background: 'white', border: '1px solid #E7E3DD', borderRadius: 20, padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <div style={{ fontSize: 12, color: '#7A7167', fontWeight: 800, textTransform: 'uppercase' }}>{label}</div>
          <div style={{ marginTop: 8, fontSize: 24, fontWeight: 900, letterSpacing: '-0.05em' }}>{value}</div>
        </div>
        <div style={{ width: 42, height: 42, borderRadius: 14, background: '#FAF8F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color="#A06A3B" />
        </div>
      </div>
    </div>
  );
}

export default function StudentProfilePage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const res = await api.get('/profile');
        if (!active) return;
        const data = res.data?.data || null;
        setProfile(data);
        setName(data?.name || '');
      } catch (err) {
        if (active) setMessage(err.response?.data?.message || 'Failed to load profile');
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, []);

  const handleSave = async () => {
    if (!name.trim()) {
      setMessage('Name is required');
      return;
    }
    setSaving(true);
    setMessage('');
    try {
      await api.patch('/profile', { name: name.trim() });
      const res = await api.get('/profile');
      const data = res.data?.data || null;
      setProfile(data);
      setName(data?.name || '');
      setEditing(false);
      setMessage('Profile updated successfully');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div style={{ padding: 24, color: '#6B6B6B' }}>Loading profile...</div>;
  if (!profile) return <div style={{ padding: 24, color: '#B91C1C' }}>Profile not available</div>;

  return (
    <div style={{ fontFamily: 'Segoe UI, sans-serif', color: '#111111', padding: '8px 0 24px' }}>
      <div style={{ borderRadius: 32, padding: '28px clamp(18px, 4vw, 32px)', background: 'linear-gradient(135deg, #FFFFFF 0%, #FFF7ED 100%)', border: '1px solid #E8E1D8' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <div style={{ width: 64, height: 64, borderRadius: 22, background: '#111111', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 900 }}>
            {profile.name?.charAt(0)?.toUpperCase() || 'S'}
          </div>
          <div>
            <div style={{ fontSize: 13, color: '#7A7167', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Student Profile</div>
            <h1 style={{ margin: '6px 0 0', fontSize: 'clamp(30px, 4vw, 46px)', lineHeight: 1.05, letterSpacing: '-0.06em', fontWeight: 900 }}>{profile.name}</h1>
          </div>
        </div>

        {message && (
          <div style={{ marginBottom: 18, padding: '12px 14px', borderRadius: 16, background: '#FAF8F5', border: '1px solid #E7E3DD', color: '#5F564D', fontSize: 13, fontWeight: 700 }}>
            {message}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16 }}>
          <div style={{ background: 'white', border: '1px solid #E7E3DD', borderRadius: 24, padding: 22, display: 'grid', gap: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 900, letterSpacing: '-0.05em' }}>Account details</h2>
              {!editing && (
                <button onClick={() => setEditing(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 16, border: '1px solid #E7E3DD', background: 'white', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                  <PencilLine size={14} /> Edit
                </button>
              )}
            </div>

            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <div style={{ fontSize: 12, color: '#7A7167', fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>Full name</div>
                {editing ? (
                  <input value={name} onChange={(e) => setName(e.target.value)} style={{ width: '100%', boxSizing: 'border-box', padding: '12px 14px', borderRadius: 14, border: '1px solid #E7E3DD', fontSize: 14, outline: 'none' }} />
                ) : (
                  <div style={{ fontSize: 15, fontWeight: 700, color: '#111111' }}>{profile.name}</div>
                )}
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#7A7167', fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>
                  <Mail size={14} /> Email
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111111' }}>{profile.email}</div>
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#7A7167', fontWeight: 800, textTransform: 'uppercase', marginBottom: 6 }}>
                  <Calendar size={14} /> Joined
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: '#111111' }}>{profile.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}</div>
              </div>
            </div>

            {editing && (
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => { setEditing(false); setName(profile.name || ''); }} style={{ flex: 1, padding: '12px 14px', borderRadius: 16, border: '1px solid #E7E3DD', background: 'white', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving} style={{ flex: 1, padding: '12px 14px', borderRadius: 16, border: 'none', background: saving ? '#D6D3D1' : '#111111', color: 'white', fontSize: 13, fontWeight: 900, cursor: saving ? 'not-allowed' : 'pointer' }}>
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            )}
          </div>

          <div style={{ display: 'grid', gap: 16 }}>
            <StatCard label="Batches" value={profile.batches?.length || 0} icon={ShieldCheck} />
            <StatCard label="Completed quizzes" value={profile.total_quizzes || 0} icon={Trophy} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
          <div style={{ background: 'white', border: '1px solid #E7E3DD', borderRadius: 24, padding: 22 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, letterSpacing: '-0.04em' }}>Batches</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
              {(profile.batches || []).length > 0 ? profile.batches.map((batch) => (
                <span key={batch.id} style={{ padding: '8px 12px', borderRadius: 999, background: '#FAF8F5', border: '1px solid #E7E3DD', fontSize: 13, fontWeight: 700 }}>
                  {batch.name}
                </span>
              )) : <div style={{ color: '#7A7167', fontSize: 13 }}>No batches assigned.</div>}
            </div>
          </div>

          <div style={{ background: 'white', border: '1px solid #E7E3DD', borderRadius: 24, padding: 22 }}>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900, letterSpacing: '-0.04em' }}>Performance summary</h3>
            <div style={{ marginTop: 12, color: '#7A7167', fontSize: 13, lineHeight: 1.7 }}>
              Your quiz history and score trends are visible from the results page. This profile stays intentionally clean and focused on identity, batch access, and account updates.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}