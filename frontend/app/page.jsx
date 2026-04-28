import Link from 'next/link';

export default function Landing() {
  return (
    <main className="min-h-screen bg-black text-white flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-6">
        <span className="text-2xl font-black tracking-tight">Streaksha</span>
        <div className="flex gap-4">
          <Link href="/login" className="text-sm text-zinc-400 hover:text-white transition">Login</Link>
          <Link href="/register" className="text-sm bg-white text-black px-4 py-2 rounded-full font-semibold hover:bg-zinc-200 transition">Get Started</Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 gap-6">
        <div className="inline-block bg-zinc-900 border border-zinc-700 text-zinc-400 text-xs px-4 py-1.5 rounded-full mb-2">
          Quiz Management Platform for Institutes
        </div>
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none">
          Build. Test.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500">
            Dominate.
          </span>
        </h1>
        <p className="text-zinc-400 text-lg max-w-md">
          Streaksha helps institutes run smart quizzes, track performance, and catch cheaters — all in one place.
        </p>
        <div className="flex gap-3 mt-2">
          <Link href="/register" className="bg-white text-black px-6 py-3 rounded-full font-bold hover:bg-zinc-200 transition text-sm">
            Register your Institute
          </Link>
          <Link href="/login" className="border border-zinc-700 px-6 py-3 rounded-full text-sm hover:border-zinc-400 transition">
            Login
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-6 text-zinc-600 text-xs">
        © 2026 Streaksha. All rights reserved.
      </footer>
    </main>
  );
}