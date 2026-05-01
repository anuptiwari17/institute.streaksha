'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Building2, Users, BookOpen, BarChart3, AlertCircle, Eye, EyeOff } from 'lucide-react';

function Skeleton({ w = '100%', h = 20 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: 8,
      background: 'linear-gradient(90deg, #f0f0ef 25%, #e5e5e3 50%, #f0f0ef 75%)',
      backgroundSize: '200% 100%', animation: 'loading 1.5s infinite'
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

export default function SuperAdminProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [newName, setNewName] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({ current: '', new: '', confirm: '' });
  const [message, setMessage] = useState('');

  useEffect(() => {
    api.get('/api/profile')
      .then(res => {
        if (res.data?.data) {
          setUser(res.data.data);
          setNewName(res.data.data.name);
          setStats(res.data.data.stats);
        }
      })
      .catch(err => {
        setError(err.response?.data?.message || 'Failed to load profile');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleUpdateName = async () => {
    if (!newName.trim()) {
      setMessage('Name cannot be empty');
      return;
    }

    try {
      const res = await api.patch('/api/profile', { name: newName });
      if (res.data?.data) {
        setUser(res.data.data);
        setEditMode(false);
        setMessage('Name updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to update name');
    }
  };

  const handleChangePassword = async () => {
    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      setMessage('All fields are required');
      return;
    }

    if (passwordData.new !== passwordData.confirm) {
      setMessage('New passwords do not match');
      return;
    }

    if (passwordData.new.length < 8) {
      setMessage('New password must be at least 8 characters');
      return;
    }

    try {
      await api.post('/api/profile/change-password', {
        currentPassword: passwordData.current,
        newPassword: passwordData.new
      });
      setMessage('Password changed successfully!');
      setShowChangePassword(false);
      setPasswordData({ current: '', new: '', confirm: '' });
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Failed to change password');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#FAFAF8', padding: '32px 20px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <Skeleton h={32} w="40%" style={{ marginBottom: 32 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 32 }}>
            {[...Array(6)].map((_, i) => (
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

  if (error || !user) {
    return (
      <div style={{ minHeight: '100vh', background: '#FAFAF8', padding: '32px 20px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ padding: 40, background: 'white', borderRadius: 16, textAlign: 'center', color: '#B91C1C' }}>
            <AlertCircle size={32} style={{ margin: '0 auto 12px', opacity: 0.7 }} />
            <p style={{ fontSize: 14, margin: 0 }}>{error || 'Failed to load profile'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAF8', padding: '32px 20px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Message */}
        {message && (
          <div style={{
            padding: 12, borderRadius: 8, marginBottom: 24,
            background: message.includes('successfully') ? '#ECFDF5' : '#FEF2F2',
            color: message.includes('successfully') ? '#047857' : '#B91C1C',
            fontSize: 13, fontWeight: 600
          }}>
            {message}
          </div>
        )}

        {/* Header */}
        <h1 style={{ fontSize: 28, fontWeight: 900, color: '#0A0A0A', margin: '0 0 32px 0' }}>
          Super Admin Profile
        </h1>

        {/* Profile Card */}
        <div style={{ background: 'white', borderRadius: 12, border: '1px solid #E5E5E3', padding: 24, marginBottom: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#7A7167', marginBottom: 8 }}>Full Name</div>
              {editMode ? (
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  style={{
                    padding: '8px 12px', borderRadius: 6, border: '1px solid #E5E5E3',
                    fontSize: 14, fontFamily: 'inherit', width: '100%', maxWidth: 300
                  }}
                />
              ) : (
                <div style={{ fontSize: 16, fontWeight: 600, color: '#0A0A0A' }}>{user.name}</div>
              )}
            </div>
            {editMode ? (
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={handleUpdateName}
                  style={{
                    padding: '8px 16px', borderRadius: 6, background: '#FF4D00', color: 'white',
                    border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13
                  }}
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setEditMode(false);
                    setNewName(user.name);
                  }}
                  style={{
                    padding: '8px 16px', borderRadius: 6, background: '#E5E5E3', color: '#0A0A0A',
                    border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditMode(true)}
                style={{
                  padding: '8px 16px', borderRadius: 6, background: 'white', border: '1px solid #E5E5E3',
                  cursor: 'pointer', fontWeight: 600, fontSize: 13
                }}
              >
                Edit
              </button>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 20, marginBottom: 24, paddingTop: 24, borderTop: '1px solid #E5E5E3' }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#7A7167', marginBottom: 8 }}>Email</div>
              <div style={{ fontSize: 14, color: '#0A0A0A', fontWeight: 500 }}>{user.email}</div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#7A7167', marginBottom: 8 }}>Role</div>
              <div style={{ fontSize: 14, color: '#0A0A0A', fontWeight: 500 }}>Super Administrator</div>
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#7A7167', marginBottom: 8 }}>Member Since</div>
              <div style={{ fontSize: 14, color: '#0A0A0A', fontWeight: 500 }}>
                {new Date(user.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>

          <button
            onClick={() => setShowChangePassword(!showChangePassword)}
            style={{
              padding: '8px 16px', borderRadius: 6, background: 'white', border: '1px solid #E5E5E3',
              cursor: 'pointer', fontWeight: 600, fontSize: 13, color: '#FF4D00'
            }}
          >
            {showChangePassword ? 'Cancel' : 'Change Password'}
          </button>

          {/* Change Password Section */}
          {showChangePassword && (
            <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid #E5E5E3' }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#7A7167', marginBottom: 8 }}>
                  Current Password
                </label>
                <input
                  type="password"
                  value={passwordData.current}
                  onChange={(e) => setPasswordData({ ...passwordData, current: e.target.value })}
                  style={{
                    width: '100%', maxWidth: 400, padding: '8px 12px', borderRadius: 6,
                    border: '1px solid #E5E5E3', fontSize: 14, fontFamily: 'inherit'
                  }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#7A7167', marginBottom: 8 }}>
                  New Password
                </label>
                <input
                  type="password"
                  value={passwordData.new}
                  onChange={(e) => setPasswordData({ ...passwordData, new: e.target.value })}
                  style={{
                    width: '100%', maxWidth: 400, padding: '8px 12px', borderRadius: 6,
                    border: '1px solid #E5E5E3', fontSize: 14, fontFamily: 'inherit'
                  }}
                />
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#7A7167', marginBottom: 8 }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={passwordData.confirm}
                  onChange={(e) => setPasswordData({ ...passwordData, confirm: e.target.value })}
                  style={{
                    width: '100%', maxWidth: 400, padding: '8px 12px', borderRadius: 6,
                    border: '1px solid #E5E5E3', fontSize: 14, fontFamily: 'inherit'
                  }}
                />
              </div>
              <button
                onClick={handleChangePassword}
                style={{
                  padding: '8px 16px', borderRadius: 6, background: '#FF4D00', color: 'white',
                  border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13
                }}
              >
                Update Password
              </button>
            </div>
          )}
        </div>

        {/* Platform Statistics */}
        {stats && (
          <>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0A0A0A', margin: '0 0 20px 0' }}>
              Platform Overview
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
              <StatCard
                label="Institutions"
                value={stats.institutions || 0}
                icon={Building2}
                color="#2563EB"
                bg="#EFF6FF"
                loading={false}
              />
              <StatCard
                label="Admins"
                value={stats.admins || 0}
                icon={Users}
                color="#FF4D00"
                bg="#FFF0EB"
                loading={false}
              />
              <StatCard
                label="Teachers"
                value={stats.teachers || 0}
                icon={BarChart3}
                color="#10B981"
                bg="#F0FDF4"
                loading={false}
              />
              <StatCard
                label="Students"
                value={stats.students || 0}
                icon={Users}
                color="#8B5CF6"
                bg="#F5F3FF"
                loading={false}
              />
              <StatCard
                label="Batches"
                value={stats.batches || 0}
                icon={BarChart3}
                color="#111111"
                bg="#E7E3DD"
                loading={false}
              />
              <StatCard
                label="Quizzes"
                value={stats.quizzes || 0}
                icon={BookOpen}
                color="#14B8A6"
                bg="#FFF0EB"
                loading={false}
              />
              <StatCard
                label="Quiz Attempts"
                value={stats.total_attempts || 0}
                icon={BarChart3}
                color="#0F172A"
                bg="#F5F3FF"
                loading={false}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
