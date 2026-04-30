'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import api from '@/lib/api';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import { ClipboardList, CalendarDays, BookOpen, Users, TrendingUp, ArrowRight, Search } from 'lucide-react';

function LoadingCard() {
  return (
    <div className="rounded-2xl border border-[#E5E5E3] bg-white p-5 animate-pulse">
      <div className="h-4 w-24 rounded bg-[#F0F0EE]" />
      <div className="mt-3 h-7 w-3/4 rounded bg-[#F0F0EE]" />
      <div className="mt-4 h-4 w-1/2 rounded bg-[#F0F0EE]" />
      <div className="mt-5 grid grid-cols-3 gap-2">
        <div className="h-16 rounded-xl bg-[#F0F0EE]" />
        <div className="h-16 rounded-xl bg-[#F0F0EE]" />
        <div className="h-16 rounded-xl bg-[#F0F0EE]" />
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color, bg }) {
  return (
    <div className="rounded-2xl border border-[#E5E5E3] bg-white p-5">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl" style={{ background: bg }}>
        <Icon size={18} color={color} />
      </div>
      <div className="text-3xl font-black tracking-tight text-[#0A0A0A]">{value}</div>
      <div className="mt-1 text-sm text-[#6B6B6B]">{label}</div>
    </div>
  );
}

export default function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);

  const fetchQuizzes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/quizzes?limit=100&page=1');
      setQuizzes(res.data.data?.quizzes || []);
    } catch {
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
    fetchQuizzes();
  }, [fetchQuizzes]);

  const filteredQuizzes = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return quizzes;
    return quizzes.filter((quiz) =>
      [quiz.title, quiz.subject_name, quiz.batch_name, quiz.created_by_name, quiz.status]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(q)
    );
  }, [quizzes, search]);

  const statusCounts = useMemo(() => ({
    published: quizzes.filter((quiz) => quiz.status === 'published').length,
    draft: quizzes.filter((quiz) => quiz.status === 'draft').length,
    archived: quizzes.filter((quiz) => quiz.status === 'archived').length,
  }), [quizzes]);

  const statusBadge = (status) => {
    if (status === 'published') return <Badge variant="green">Live</Badge>;
    if (status === 'draft') return <Badge variant="default">Draft</Badge>;
    return <Badge variant="blue">Archived</Badge>;
  };

  return (
    <div className="transition-all duration-500" style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(12px)' }}>
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#FF4D00]">Admin workspace</p>
          <h1 className="mt-2 text-[clamp(28px,3vw,38px)] font-black tracking-tight text-[#0A0A0A]">Quizzes</h1>
          <p className="mt-2 text-sm text-[#6B6B6B]">View all quizzes across the institution with the same data the backend uses.</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/admin">
            <Button variant="secondary">Back to overview</Button>
          </Link>
          <Button variant="orange" icon={<ArrowRight size={15} />} onClick={fetchQuizzes}>Refresh</Button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <StatCard label="Total quizzes" value={quizzes.length} icon={ClipboardList} color="#FF4D00" bg="#FFF0EB" />
        <StatCard label="Published" value={statusCounts.published} icon={TrendingUp} color="#16A34A" bg="#F0FDF4" />
        <StatCard label="Drafts" value={statusCounts.draft} icon={BookOpen} color="#2563EB" bg="#EFF6FF" />
      </div>

      <div className="mb-5 flex max-w-md items-center gap-3 rounded-2xl border border-[#E5E5E3] bg-white px-4 py-3">
        <Search size={16} className="text-[#A3A3A0]" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search quizzes, batches, subjects..."
          className="w-full bg-transparent text-sm text-[#0A0A0A] outline-none placeholder:text-[#A3A3A0]"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <LoadingCard key={i} />)
        ) : filteredQuizzes.length === 0 ? (
          <div className="col-span-full rounded-3xl border border-dashed border-[#E5E5E3] bg-white px-6 py-16 text-center text-[#6B6B6B]">
            <ClipboardList size={36} className="mx-auto mb-4 text-[#C0C0BC]" />
            <p className="text-base font-semibold text-[#0A0A0A]">No quizzes found</p>
            <p className="mt-1 text-sm">Create quizzes from the teacher dashboard, then they will appear here.</p>
          </div>
        ) : (
          filteredQuizzes.map((quiz) => (
            <div key={quiz.id} className="rounded-2xl border border-[#E5E5E3] bg-white p-5 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)]">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="truncate text-lg font-black tracking-tight text-[#0A0A0A]">{quiz.title}</h2>
                    {statusBadge(quiz.status)}
                  </div>
                  <p className="mt-1 text-sm text-[#6B6B6B]">{quiz.subject_name} • {quiz.batch_name}</p>
                </div>
                <div className="rounded-xl bg-[#F5F5F3] px-3 py-2 text-right">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#A3A3A0]">Marks</div>
                  <div className="text-sm font-black text-[#0A0A0A]">{quiz.total_marks ?? 0}</div>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl bg-[#FAFAF8] p-3">
                  <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#A3A3A0]"><Users size={13} />Questions</div>
                  <div className="text-sm font-bold text-[#0A0A0A]">{quiz.question_count ?? 0}</div>
                </div>
                <div className="rounded-xl bg-[#FAFAF8] p-3">
                  <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#A3A3A0]"><CalendarDays size={13} />Start</div>
                  <div className="text-sm font-bold text-[#0A0A0A]">{quiz.starts_at ? new Date(quiz.starts_at).toLocaleString() : 'Not scheduled'}</div>
                </div>
                <div className="rounded-xl bg-[#FAFAF8] p-3">
                  <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#A3A3A0]"><BookOpen size={13} />Created by</div>
                  <div className="truncate text-sm font-bold text-[#0A0A0A]">{quiz.created_by_name || 'Unknown'}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
