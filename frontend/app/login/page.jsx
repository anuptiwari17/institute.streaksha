'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { setTokens, getRoleRedirect } from '@/lib/auth';
import { Eye, EyeOff, Mail, Lock, AlertTriangle, ArrowRight } from 'lucide-react';

const FloatingOrb = ({ style }) => (
  <div style={{
    position: 'absolute', borderRadius: '50%', pointerEvents: 'none',
    filter: 'blur(60px)', ...style
  }}/>
);

export default function LoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionActive, setSessionActive] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 30); }, []);

  const set = (f) => (e) => {
    setForm(p => ({ ...p, [f]: e.target.value }));
    setError('');
    setSessionActive(false);
  };

  const handleLogin = async (force = false) => {
    if (!form.email || !form.password) { setError('Both fields are required'); return; }
    setLoading(true); setError(''); setSessionActive(false);
    try {
      const res = await api.post('/auth/login', { ...form, force });
      setTokens(res.data.data.accessToken, res.data.data.refreshToken);
      router.push(getRoleRedirect(res.data.data.user.role));
    } catch (err) {
      if (err.response?.data?.code === 'SESSION_ACTIVE') setSessionActive(true);
      else setError(err.response?.data?.message || 'Invalid credentials');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#FAFAF8', display: 'flex',
      fontFamily: "'Inter', sans-serif", position: 'relative', overflow: 'hidden',
    }}>
      <FloatingOrb style={{ width: 500, height: 500, background: 'rgba(255,77,0,0.07)', top: '-10%', right: '-5%' }}/>
      <FloatingOrb style={{ width: 350, height: 350, background: 'rgba(37,99,235,0.05)', bottom: '10%', left: '-5%' }}/>

      {/* Left panel — branding */}
      <div style={{
        width: '45%', background: '#0A0A0A', padding: '48px 56px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden',
        opacity: mounted ? 1 : 0, transform: mounted ? 'translateX(0)' : 'translateX(-20px)',
        transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1)',
      }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%',
                       border: '1px solid rgba(255,255,255,0.05)', top: '50%', left: '50%',
                       transform: 'translate(-50%,-50%)', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', width: 600, height: 600, borderRadius: '50%',
                       border: '1px solid rgba(255,255,255,0.03)', top: '50%', left: '50%',
                       transform: 'translate(-50%,-50%)', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', bottom: -80, right: -80, width: 300, height: 300,
                       borderRadius: '50%', background: 'rgba(255,77,0,0.12)', pointerEvents: 'none' }}/>

        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative', zIndex: 1 }}>
          <div style={{ width: 36, height: 36, background: '#FF4D00', borderRadius: 10,
                         display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: 16 }}>S</span>
          </div>
          <span style={{ color: 'white', fontWeight: 900, fontSize: 20, letterSpacing: '-0.03em' }}>
            Streaksha
          </span>
        </div>

        {/* Big text */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#FF4D00', textTransform: 'uppercase',
                       letterSpacing: '0.1em', marginBottom: 20 }}>
            Welcome back
          </p>
          <h2 style={{ fontSize: 'clamp(36px,4vw,54px)', fontWeight: 900, color: 'white',
                        letterSpacing: '-0.04em', lineHeight: 1.0, marginBottom: 20 }}>
            Every exam.<br/>
            Every student.<br/>
            <span style={{ color: '#FF4D00' }}>All in one place.</span>
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, maxWidth: 340 }}>
            India's smartest quiz platform for schools and coaching institutes.
          </p>
        </div>

        {/* Bottom badges */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', position: 'relative', zIndex: 1 }}>
          {['🔒 Secure sessions', '⚡ Instant results', '📊 Smart analytics'].map(b => (
            <span key={b} style={{
              fontSize: 12, color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: 99,
              padding: '6px 14px', fontWeight: 500,
            }}>{b}</span>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '48px 40px', position: 'relative', zIndex: 1,
        opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s',
      }}>
        <div style={{ width: '100%', maxWidth: 440 }}>
          {/* Header */}
          <div style={{ marginBottom: 40 }}>
            <h1 style={{ fontSize: 'clamp(32px,4vw,44px)', fontWeight: 900,
                          letterSpacing: '-0.04em', color: '#0A0A0A', lineHeight: 1.05,
                          marginBottom: 10 }}>
              Sign in
            </h1>
            <p style={{ fontSize: 15, color: '#6B6B6B' }}>
              Don't have an account?{' '}
              <Link href="/register" style={{ color: '#FF4D00', fontWeight: 700,
                                              textDecoration: 'none' }}>
                Register your institute →
              </Link>
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: '#FFF5F5', border: '1px solid #FED7D7', borderRadius: 14,
              padding: '14px 16px', marginBottom: 24,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <AlertTriangle size={15} color="#E53E3E"/>
              <span style={{ fontSize: 14, color: '#C53030', fontWeight: 500 }}>{error}</span>
            </div>
          )}

          {/* Session active warning */}
          {sessionActive && (
            <div style={{
              background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 14,
              padding: '16px', marginBottom: 24,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <AlertTriangle size={15} color="#D97706"/>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#92400E' }}>
                  Active session detected
                </span>
              </div>
              <p style={{ fontSize: 13, color: '#92400E', marginBottom: 14, lineHeight: 1.5 }}>
                You're already logged in on another device. Kill that session to continue here.
              </p>
              <button onClick={() => handleLogin(true)} style={{
                width: '100%', background: '#D97706', color: 'white',
                border: 'none', borderRadius: 10, padding: '11px',
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => { e.target.style.background = '#B45309'; }}
                onMouseLeave={e => { e.target.style.background = '#D97706'; }}>
                Kill old session & login here
              </button>
            </div>
          )}

          {/* Form */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Email */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 700, color: '#6B6B6B',
                               textTransform: 'uppercase', letterSpacing: '0.06em',
                               display: 'block', marginBottom: 8 }}>
                Email address
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} color="#A3A3A0" style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                }}/>
                <input
                  type="email" placeholder="you@institute.com"
                  value={form.email} onChange={set('email')}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  style={{
                    width: '100%', background: 'white', border: '1.5px solid #E5E5E3',
                    borderRadius: 14, padding: '14px 14px 14px 42px',
                    fontSize: 15, color: '#0A0A0A', outline: 'none',
                    transition: 'all 0.15s', fontFamily: 'inherit',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#0A0A0A'; e.target.style.boxShadow = '0 0 0 3px rgba(10,10,10,0.08)'; }}
                  onBlur={e => { e.target.style.borderColor = '#E5E5E3'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#6B6B6B',
                                 textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Password
                </label>
                <Link href="/forgot-password" style={{ fontSize: 12, color: '#FF4D00',
                                                       fontWeight: 600, textDecoration: 'none' }}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock size={15} color="#A3A3A0" style={{
                  position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                }}/>
                <input
                  type={showPass ? 'text' : 'password'} placeholder="••••••••"
                  value={form.password} onChange={set('password')}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  style={{
                    width: '100%', background: 'white', border: '1.5px solid #E5E5E3',
                    borderRadius: 14, padding: '14px 44px 14px 42px',
                    fontSize: 15, color: '#0A0A0A', outline: 'none',
                    transition: 'all 0.15s', fontFamily: 'inherit',
                  }}
                  onFocus={e => { e.target.style.borderColor = '#0A0A0A'; e.target.style.boxShadow = '0 0 0 3px rgba(10,10,10,0.08)'; }}
                  onBlur={e => { e.target.style.borderColor = '#E5E5E3'; e.target.style.boxShadow = 'none'; }}
                />
                <button onClick={() => setShowPass(p => !p)} style={{
                  position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                  background: 'none', border: 'none', cursor: 'pointer', color: '#A3A3A0',
                  padding: 0, display: 'flex',
                }}>
                  {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button onClick={() => handleLogin(false)} disabled={loading}
              style={{
                width: '100%', background: loading ? '#6B6B6B' : '#0A0A0A',
                color: 'white', border: 'none', borderRadius: 16,
                padding: '16px', fontSize: 16, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s', display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: 8, fontFamily: 'inherit',
                marginTop: 6,
              }}
              onMouseEnter={e => { if (!loading) { e.target.style.background = '#FF4D00'; e.target.style.transform = 'translateY(-1px)'; e.target.style.boxShadow = '0 8px 24px rgba(255,77,0,0.25)'; } }}
              onMouseLeave={e => { e.target.style.background = loading ? '#6B6B6B' : '#0A0A0A'; e.target.style.transform = 'translateY(0)'; e.target.style.boxShadow = 'none'; }}>
              {loading ? (
                <svg className="animate-spin" width={18} height={18} viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25"/>
                  <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" opacity="0.8"/>
                </svg>
              ) : (
                <>Sign in <ArrowRight size={16}/></>
              )}
            </button>
          </div>

          {/* Bottom note */}
          <p style={{ marginTop: 32, fontSize: 12, color: '#C0C0BC', textAlign: 'center', lineHeight: 1.6 }}>
            By signing in you agree to Streaksha&#39;s{' '}
            <a href="#" style={{ color: '#A3A3A0', textDecoration: 'none' }}>Terms</a>
            {' '}and{' '}
            <a href="#" style={{ color: '#A3A3A0', textDecoration: 'none' }}>Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
}