'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';

export default function Register() {
  const router = useRouter();
  const [step, setStep] = useState('form'); // form | verify
  const [form, setForm] = useState({ instituteName: '', name: '', email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.post('/auth/register', form);
      // OTP is sent automatically by backend on register — just move to verify step
      setStep('verify');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally { setLoading(false); }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/verify-registration', { email: form.email, otp });
      localStorage.setItem('accessToken', res.data.data.accessToken);
      localStorage.setItem('refreshToken', res.data.data.refreshToken);
      router.push('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally { setLoading(false); }
  };

  return (
    <main className="min-h-screen bg-black text-white flex">
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 border-r border-zinc-800">
        <span className="text-xl font-black tracking-tight">Streaksha</span>
        <div>
          <p className="text-5xl font-black tracking-tighter leading-tight mb-4">
            Your institute.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-pink-500">
              Supercharged.
            </span>
          </p>
          <p className="text-zinc-500 text-sm max-w-xs">
            Run quizzes, track performance, and manage your entire academic workflow in one place.
          </p>
        </div>
        <p className="text-zinc-700 text-xs">© 2025 Streaksha</p>
      </div>

      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-8">
            <span className="text-xl font-black tracking-tight">Streaksha</span>
          </div>

          {step === 'form' ? (
            <>
              <h1 className="text-3xl font-black tracking-tight mb-1">Create account</h1>
              <p className="text-zinc-500 text-sm mb-8">Register your institute on Streaksha</p>

              {error && (
                <p className="bg-red-900/30 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-xl mb-6">{error}</p>
              )}

              <form onSubmit={handleRegister} className="flex flex-col gap-4">
                {[
                  { name: 'instituteName', label: 'Institute Name', placeholder: 'DPS Ludhiana' },
                  { name: 'name', label: 'Your Name', placeholder: 'Rahul Sharma' },
                  { name: 'email', label: 'Work Email', placeholder: 'rahul@institute.com', type: 'email' },
                  { name: 'password', label: 'Password', placeholder: '••••••••', type: 'password' },
                ].map((f) => (
                  <div key={f.name}>
                    <label className="text-xs text-zinc-500 mb-1.5 block">{f.label}</label>
                    <input name={f.name} type={f.type || 'text'} placeholder={f.placeholder}
                      value={form[f.name]} onChange={handleChange} required
                      className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-zinc-500 placeholder:text-zinc-700 transition"
                    />
                  </div>
                ))}
                <button type="submit" disabled={loading}
                  className="mt-2 bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-100 transition text-sm disabled:opacity-40">
                  {loading ? 'Creating...' : 'Create Account →'}
                </button>
              </form>
            </>
          ) : (
            <>
              <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 rounded-2xl flex items-center justify-center mb-6">
                <span className="text-2xl">📬</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight mb-1">Check your inbox</h1>
              <p className="text-zinc-500 text-sm mb-8">
                We sent a 6-digit OTP to <span className="text-white">{form.email}</span>
              </p>

              {error && (
                <p className="bg-red-900/30 border border-red-800 text-red-400 text-sm px-4 py-3 rounded-xl mb-6">{error}</p>
              )}

              <form onSubmit={handleVerify} className="flex flex-col gap-4">
                <input type="text" placeholder="000000" value={otp}
                  onChange={(e) => setOtp(e.target.value)} maxLength={6} required
                  className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-xl px-4 py-4 text-2xl font-bold tracking-[0.5em] text-center focus:outline-none focus:border-zinc-500 placeholder:text-zinc-700 transition"
                />
                <button type="submit" disabled={loading}
                  className="bg-white text-black font-bold py-3 rounded-xl hover:bg-zinc-100 transition text-sm disabled:opacity-40">
                  {loading ? 'Verifying...' : 'Verify & Enter →'}
                </button>
                <button type="button" onClick={() => setStep('form')}
                  className="text-zinc-600 text-sm hover:text-zinc-400 transition">← Go back</button>
              </form>
            </>
          )}

          <p className="text-zinc-600 text-sm mt-8 text-center">
            Already registered?{' '}
            <Link href="/login" className="text-zinc-400 hover:text-white transition">Sign in</Link>
          </p>
        </div>
      </div>
    </main>
  );
}