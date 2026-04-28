'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function Login() {
  const router = useRouter();
  const [step, setStep] = useState('credentials'); // credentials | forgot | reset
  const [form, setForm] = useState({ email: '', password: '', otp: '', newPassword: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionActive, setSessionActive] = useState(false);

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value });

  const handleLogin = async (e, force = false) => {
    e.preventDefault();
    setLoading(true); setError(''); setSessionActive(false);
    try {
      const res = await api.post('/auth/login', { email: form.email, password: form.password, force });
      localStorage.setItem('accessToken', res.data.data.accessToken);
      localStorage.setItem('refreshToken', res.data.data.refreshToken);
      router.push('/dashboard');
    } catch (err) {
      if (err.response?.data?.code === 'SESSION_ACTIVE') setSessionActive(true);
      else setError(err.response?.data?.message || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  const handleForgot = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/auth/forgot-password', { email: form.email });
      setStep('reset');
    } catch (err) {
      setError(err.response?.data?.message || 'Email not found');
    } finally { setLoading(false); }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/auth/reset-password', { email: form.email, otp: form.otp, newPassword: form.newPassword });
      setStep('credentials');
      setForm({ email: form.email, password: '', otp: '', newPassword: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset');
    } finally { setLoading(false); }
  };

  const titles = {
    credentials: { h: 'Welcome back', p: 'Sign in to your Streaksha account' },
    forgot: { h: 'Forgot password?', p: 'Enter your email to receive an OTP' },
    reset: { h: 'Reset password', p: `OTP sent to ${form.email}` },
  };

  return (
    <main className="min-h-screen bg-black text-white flex">
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 border-r border-zinc-800">
        <span className="text-xl font-black tracking-tight">Streaksha</span>
        <div>
          <p className="text-5xl font-black tracking-tighter leading-tight mb-4">
            Test smarter.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500">
              Rank higher.
            </span>
          </p>
          <p className="text-zinc-500 text-sm max-w-xs">The assessment platform built for Indian institutions.</p>
        </div>
        <p className="text-zinc-700 text-xs">© 2025 Streaksha</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <span className="text-xl font-black tracking-tight">Streaksha</span>
          </div>

          <h1 className="text-3xl font-black tracking-tight mb-1">{titles[step].h}</h1>
          <p className="text-zinc-500 text-sm mb-8">{titles[step].p}</p>

          {error && (
            <p className="bg-red-900/30 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-xl mb-6">{error}</p>
          )}

          {sessionActive && (
            <div className="bg-amber-900/20 border border-amber-800 text-amber-400 text-sm px-4 py-3 rounded-xl mb-6">
              Already logged in elsewhere.{' '}
              <button onClick={(e) => handleLogin(e, true)} className="underline font-semibold">
                Kill that session and login here
              </button>
            </div>
          )}

          {step === 'credentials' && (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              {[
                { label: 'Email', field: 'email', type: 'email', placeholder: 'you@institute.com' },
                { label: 'Password', field: 'password', type: 'password', placeholder: '••••••••' },
              ].map((f) => (
                <div key={f.field}>
                  <label className="text-xs text-zinc-500 mb-1.5 block">{f.label}</label>
                  <input type={f.type} placeholder={f.placeholder} value={form[f.field]}
                    onChange={set(f.field)} required
                    className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-500 placeholder:text-zinc-700 transition"
                  />
                </div>
              ))}
              <button type="button" onClick={() => { setStep('forgot'); setError(''); }}
                className="text-xs text-zinc-600 hover:text-zinc-400 transition text-left -mt-2">
                Forgot password?
              </button>
              <button type="submit" disabled={loading}
                className="bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-100 transition text-sm disabled:opacity-40">
                {loading ? 'Logging in...' : 'Login →'}
              </button>
            </form>
          )}

          {step === 'forgot' && (
            <form onSubmit={handleForgot} className="flex flex-col gap-4">
              <div>
                <label className="text-xs text-zinc-500 mb-1.5 block">Email</label>
                <input type="email" placeholder="you@institute.com" value={form.email}
                  onChange={set('email')} required
                  className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-500 placeholder:text-zinc-700 transition"
                />
              </div>
              <button type="submit" disabled={loading}
                className="bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-100 transition text-sm disabled:opacity-40">
                {loading ? 'Sending...' : 'Send OTP →'}
              </button>
              <button type="button" onClick={() => { setStep('credentials'); setError(''); }}
                className="text-zinc-600 text-sm hover:text-zinc-400 transition">← Back to login</button>
            </form>
          )}

          {step === 'reset' && (
            <form onSubmit={handleReset} className="flex flex-col gap-4">
              <input type="text" placeholder="000000" value={form.otp}
                onChange={set('otp')} maxLength={6}
                className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-4 text-2xl font-bold tracking-[0.5em] text-center focus:outline-none focus:border-zinc-500 placeholder:text-zinc-700 transition"
              />
              <div>
                <label className="text-xs text-zinc-500 mb-1.5 block">New Password</label>
                <input type="password" placeholder="••••••••" value={form.newPassword}
                  onChange={set('newPassword')} required
                  className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-500 placeholder:text-zinc-700 transition"
                />
              </div>
              <button type="submit" disabled={loading}
                className="bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-100 transition text-sm disabled:opacity-40">
                {loading ? 'Resetting...' : 'Reset Password →'}
              </button>
              <button type="button" onClick={() => { setStep('forgot'); setError(''); }}
                className="text-zinc-600 text-sm hover:text-zinc-400 transition">← Resend OTP</button>
            </form>
          )}

          <p className="text-zinc-600 text-sm mt-8 text-center">
            New institute?{' '}
            <Link href="/register" className="text-zinc-400 hover:text-white transition">Register here</Link>
          </p>
        </div>
      </div>
    </main>
  );
}