'use client';
import { useRouter } from 'next/navigation';

export default function Dashboard() {
  const router = useRouter();

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  return (
    <main className="min-h-screen bg-black text-white flex flex-col items-center justify-center gap-4">
      <h1 className="text-5xl font-black tracking-tight">Dashboard</h1>
      <p className="text-zinc-500">To be updated — full dashboard coming soon.</p>
      <button onClick={handleLogout}
        className="mt-4 border border-zinc-700 px-5 py-2 rounded-full text-sm hover:border-zinc-400 transition">
        Logout
      </button>
    </main>
  );
}