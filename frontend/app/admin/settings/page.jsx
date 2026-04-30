'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { useToast } from '@/components/ui/Toast';
import { Building2, Shield, CalendarDays, Users, BookOpen, ClipboardList } from 'lucide-react';

export default function AdminSettingsPage() {
  const toast = useToast();
  const [institution, setInstitution] = useState(null);
  const [stats, setStats] = useState(null);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/profile');
      const data = res.data.data;
      setInstitution(data.institution || null);
      setStats(data.stats || null);
      setName(data.institution?.name || '');
    } catch {
      setInstitution(null);
      setStats(null);
      setName('');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchProfile();
  }, [fetchProfile]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!name.trim()) {
      toast({ message: 'Institution name is required', type: 'error' });
      return;
    }

    setSaving(true);
    try {
      await api.patch('/profile/institution', { name: name.trim() });
      toast({ message: 'Institution updated', type: 'success' });
      fetchProfile();
    } catch (err) {
      toast({ message: err.response?.data?.message || 'Unable to update institution', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const statCards = [
    { label: 'Created', value: institution?.created_at ? new Date(institution.created_at).toLocaleDateString() : '—', icon: CalendarDays, color: '#FF4D00', bg: '#FFF0EB' },
    { label: 'Active', value: institution?.is_active ? 'Yes' : 'No', icon: Shield, color: '#16A34A', bg: '#F0FDF4' },
    { label: 'Users', value: stats ? `${(stats.teachers || 0) + (stats.students || 0)}` : '—', icon: Users, color: '#2563EB', bg: '#EFF6FF' },
    { label: 'Quizzes', value: stats?.quizzes ?? '—', icon: ClipboardList, color: '#9333EA', bg: '#FAF5FF' },
  ];

  return (
    <div className="transition-all duration-500" style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(12px)' }}>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#FF4D00]">Admin workspace</p>
          <h1 className="mt-2 text-[clamp(28px,3vw,38px)] font-black tracking-tight text-[#0A0A0A]">Settings</h1>
          <p className="mt-2 text-sm text-[#6B6B6B]">Update institution details and review the current platform profile.</p>
        </div>
        <Link href="/admin">
          <Button variant="secondary">Back to overview</Button>
        </Link>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="rounded-2xl border border-[#E5E5E3] bg-white p-5">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: card.bg }}>
                <Icon size={18} color={card.color} />
              </div>
              <div className="text-2xl font-black tracking-tight text-[#0A0A0A]">{loading ? '...' : card.value}</div>
              <div className="mt-1 text-sm text-[#6B6B6B]">{card.label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
        <form onSubmit={handleSubmit} className="rounded-3xl border border-[#E5E5E3] bg-white p-6">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFF0EB] text-[#FF4D00]"><Building2 size={18} /></div>
            <div>
              <h2 className="text-lg font-black tracking-tight text-[#0A0A0A]">Institution profile</h2>
              <p className="text-sm text-[#6B6B6B]">Only the name is editable right now.</p>
            </div>
          </div>

          <div className="space-y-4">
            <Input
              label="Institution name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="DPS Ludhiana"
            />
            <div className="grid gap-4 md:grid-cols-2">
              <Input label="Institution ID" value={institution?.id || '—'} readOnly />
              <Input label="Created at" value={institution?.created_at ? new Date(institution.created_at).toLocaleString() : '—'} readOnly />
            </div>
            <div className="flex justify-end">
              <Button type="submit" loading={saving} variant="orange">Save changes</Button>
            </div>
          </div>
        </form>

        <div className="rounded-3xl border border-[#E5E5E3] bg-[#0A0A0A] p-6 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#FF4D00]">Notes</p>
          <h2 className="mt-3 text-xl font-black tracking-tight">Admin scope for first version</h2>
          <ul className="mt-4 space-y-3 text-sm text-white/75">
            <li>• Manage batches, students, teachers, subjects and quizzes from the admin area.</li>
            <li>• Institution naming updates are saved through the existing profile API.</li>
            <li>• Advanced billing, notification, and analytics work can come later.</li>
          </ul>
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
            <Badge variant="orange">Ready for first version</Badge>
            <p className="mt-3 text-sm text-white/70">This page stays intentionally small so the admin can focus on operational work instead of configuration noise.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
