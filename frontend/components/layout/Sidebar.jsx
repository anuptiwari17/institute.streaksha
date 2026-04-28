'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { clsx } from 'clsx';
import { clearTokens, getUser } from '@/lib/auth';
import Avatar from '@/components/ui/Avatar';
import {
  LayoutDashboard, Users, BookOpen, Layers, FileQuestion,
  ClipboardList, Settings, LogOut, Building2, BarChart3,
  GraduationCap, ChevronRight
} from 'lucide-react';

const navConfig = {
  admin: [
    { label: 'Overview',  href: '/admin',           icon: LayoutDashboard },
    { label: 'Teachers',  href: '/admin/teachers',   icon: GraduationCap },
    { label: 'Students',  href: '/admin/students',   icon: Users },
    { label: 'Batches',   href: '/admin/batches',    icon: Layers },
    { label: 'Subjects',  href: '/admin/subjects',   icon: BookOpen },
    { label: 'Quizzes',   href: '/admin/quizzes',    icon: ClipboardList },
    { label: 'Settings',  href: '/admin/settings',   icon: Settings },
  ],
  teacher: [
    { label: 'Overview',   href: '/teacher',           icon: LayoutDashboard },
    { label: 'Questions',  href: '/teacher/questions', icon: FileQuestion },
    { label: 'Quizzes',    href: '/teacher/quizzes',   icon: ClipboardList },
    { label: 'Results',    href: '/teacher/results',   icon: BarChart3 },
    { label: 'Profile',    href: '/teacher/profile',   icon: Settings },
  ],
  student: [
    { label: 'Home',       href: '/student',          icon: LayoutDashboard },
    { label: 'My Results', href: '/student/results',  icon: BarChart3 },
    { label: 'Profile',    href: '/student/profile',  icon: Settings },
  ],
  super_admin: [
    { label: 'Institutions', href: '/super-admin', icon: Building2 },
  ],
};

export default function Sidebar({ role }) {
  const pathname = usePathname();
  const router = useRouter();
  const user = getUser();
  const nav = navConfig[role] || [];

  const handleLogout = async () => {
    try {
      const { default: api } = await import('@/lib/api');
      await api.post('/auth/logout');
    } catch {}
    clearTokens();
    router.push('/login');
  };

  const isActive = (href) => {
    const base = `/${role}`;
    if (href === base) return pathname === base;
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-60 h-screen bg-white border-r border-[#E5E5E3] flex flex-col fixed left-0 top-0 z-30">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#E5E5E3]">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 bg-[#0A0A0A] rounded-lg flex items-center justify-center
                          group-hover:bg-[#FF4D00] transition-colors">
            <span className="text-white text-xs font-black">S</span>
          </div>
          <div>
            <span className="font-black text-base tracking-tight text-[#0A0A0A]">Streaksha</span>
            <p className="text-[10px] text-[#A3A3A0] -mt-0.5 capitalize">
              {role?.replace('_', ' ')} portal
            </p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-3 overflow-y-auto">
        <div className="space-y-0.5">
          {nav.map(({ label, href, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link key={href} href={href}
                className={clsx(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium',
                  'transition-all duration-150 group',
                  active
                    ? 'bg-[#0A0A0A] text-white'
                    : 'text-[#6B6B6B] hover:bg-[#F5F5F3] hover:text-[#0A0A0A]'
                )}>
                <Icon size={15} strokeWidth={2}/>
                <span className="flex-1">{label}</span>
                {active && <ChevronRight size={13} className="opacity-50"/>}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Bottom */}
      <div className="p-3 border-t border-[#E5E5E3] space-y-0.5">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl">
          <Avatar name={user?.name || 'User'} size="sm"/>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-[#0A0A0A] truncate">{user?.name || 'User'}</p>
            <p className="text-[10px] text-[#A3A3A0] capitalize">{role?.replace('_', ' ')}</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm
                     font-medium text-[#6B6B6B] hover:bg-red-50 hover:text-red-500
                     transition-all duration-150 cursor-pointer">
          <LogOut size={15}/>
          Logout
        </button>
      </div>
    </aside>
  );
}