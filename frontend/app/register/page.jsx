'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { setTokens, getRoleRedirect } from '@/lib/auth';
import { Building2, User, Mail, Lock, Eye, EyeOff, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';

const FloatingOrb = ({ style }) => (
  <div style={{ position: 'absolute', borderRadius: '50%', pointerEvents: 'none', filter: 'blur(60px)', ...style }}/>
);

// ── OTP Input (uncontrolled — bypasses React controlled-input timing issues) ──
function OtpInput({ onChange }) {
  const inputs = useRef([]);

  const readAll = () => inputs.current.map(el => el?.value || '').join('');

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (inputs.current[i].value) {
        inputs.current[i].value = '';
      } else if (i > 0) {
        inputs.current[i - 1].value = '';
        inputs.current[i - 1].focus();
      }
      onChange(readAll());
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      if (i > 0) inputs.current[i - 1].focus();
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (i < 5) inputs.current[i + 1].focus();
    } else if (/^\d$/.test(e.key)) {
      e.preventDefault();
      inputs.current[i].value = e.key;
      onChange(readAll());
      if (i < 5) inputs.current[i + 1].focus();
    } else if (e.key !== 'Tab') {
      // block all non-digit, non-nav keys
      e.preventDefault();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    for (let idx = 0; idx < 6; idx++) {
      if (inputs.current[idx]) inputs.current[idx].value = paste[idx] || '';
    }
    onChange(readAll());
    inputs.current[Math.min(paste.length, 5)]?.focus();
  };

  const boxStyle = {
    width: 52, height: 60, textAlign: 'center', fontSize: 24, fontWeight: 800,
    color: '#0A0A0A', background: 'white', border: '1.5px solid #E5E5E3',
    borderRadius: 14, outline: 'none', fontFamily: 'inherit',
    transition: 'border-color 0.15s, box-shadow 0.15s', caretColor: 'transparent',
  };

  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={el => (inputs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          defaultValue=""
          autoComplete="one-time-code"
          onKeyDown={e => handleKeyDown(i, e)}
          onPaste={handlePaste}
          onFocus={e => { e.target.style.borderColor = '#0A0A0A'; e.target.style.boxShadow = '0 0 0 3px rgba(10,10,10,0.08)'; }}
          onBlur={e => { if (!e.target.value) { e.target.style.borderColor = '#E5E5E3'; e.target.style.boxShadow = 'none'; } }}
          style={boxStyle}
        />
      ))}
    </div>
  );
}

// ── Progress steps ────────────────────────────────────────────────────────────
function StepIndicator({ current }) {
  const steps = ['Details', 'Verify', 'Done'];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 40 }}>
      {steps.map((s, i) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', display: 'flex',
              alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800,
              transition: 'all 0.3s',
              background: i < current ? '#16A34A' : i === current ? '#0A0A0A' : '#F0F0EE',
              color: i <= current ? 'white' : '#A3A3A0',
            }}>
              {i < current ? <CheckCircle size={16}/> : i + 1}
            </div>
            <span style={{ fontSize: 11, fontWeight: 600, color: i === current ? '#0A0A0A' : '#A3A3A0', whiteSpace: 'nowrap' }}>
              {s}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div style={{ width: 60, height: 1.5, margin: '0 8px', marginTop: -16,
                           background: i < current ? '#16A34A' : '#E5E5E3', transition: 'background 0.3s' }}/>
          )}
        </div>
      ))}
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({ instituteName: '', name: '', email: '', password: '' });
  const [otp, setOtp] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => { setTimeout(() => setMounted(true), 30); }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const set = (f) => (e) => { setForm(p => ({ ...p, [f]: e.target.value })); setError(''); };

  const handleRegister = async (e) => {
    e.preventDefault();
    const { instituteName, name, email, password } = form;
    if (!instituteName || !name || !email || !password) { setError('All fields are required'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/auth/register', form);
      setStep(1);
      setCountdown(60);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally { setLoading(false); }
  };

  const handleVerify = async () => {
    if (otp.length < 6) { setError('Enter the complete 6-digit OTP'); return; }
    setLoading(true); setError('');
    try {
      const res = await api.post('/auth/verify-registration', { email: form.email, otp });
      setTokens(res.data.data.accessToken, res.data.data.refreshToken);
      setStep(2);
      setTimeout(() => router.push(getRoleRedirect(res.data.data.user.role)), 1800);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
      setOtp('');
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    try {
      await api.post('/auth/forgot-password', { email: form.email });
      setCountdown(60);
    } catch {}
  };

  const fields = [
    { name: 'instituteName', label: 'Institute Name', placeholder: 'DPS Ludhiana', icon: <Building2 size={15} color="#A3A3A0"/>, type: 'text' },
    { name: 'name', label: 'Your Name', placeholder: 'Rahul Sharma', icon: <User size={15} color="#A3A3A0"/>, type: 'text' },
    { name: 'email', label: 'Work Email', placeholder: 'rahul@institute.com', icon: <Mail size={15} color="#A3A3A0"/>, type: 'email' },
  ];

  return (
    <div style={{
      minHeight: '100vh', background: '#FAFAF8', fontFamily: "'Inter', sans-serif",
      display: 'flex', position: 'relative', overflow: 'hidden',
    }}>
      <FloatingOrb style={{ width: 500, height: 500, background: 'rgba(255,77,0,0.06)', top: '-15%', right: '-8%' }}/>
      <FloatingOrb style={{ width: 300, height: 300, background: 'rgba(22,163,74,0.05)', bottom: '5%', left: '-5%' }}/>

      {/* Left panel */}
      <div style={{
        width: '42%', background: '#0A0A0A', padding: '48px 52px',
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        position: 'relative', overflow: 'hidden',
        opacity: mounted ? 1 : 0, transform: mounted ? 'translateX(0)' : 'translateX(-20px)',
        transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1)',
      }}>
        <div style={{ position: 'absolute', width: 500, height: 500, borderRadius: '50%',
                       border: '1px solid rgba(255,255,255,0.04)', top: '50%', left: '50%',
                       transform: 'translate(-50%,-50%)', pointerEvents: 'none' }}/>
        <div style={{ position: 'absolute', bottom: -60, right: -60, width: 240, height: 240,
                       borderRadius: '50%', background: 'rgba(255,77,0,0.15)', pointerEvents: 'none' }}/>

        <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', position: 'relative', zIndex: 1 }}>
          <div style={{ width: 36, height: 36, background: '#FF4D00', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontWeight: 900, fontSize: 16 }}>S</span>
          </div>
          <span style={{ color: 'white', fontWeight: 900, fontSize: 20, letterSpacing: '-0.03em' }}>Streaksha</span>
        </Link>

        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#FF4D00', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>
            Join 100+ institutes
          </p>
          <h2 style={{ fontSize: 'clamp(32px,3.5vw,48px)', fontWeight: 900, color: 'white', letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 20 }}>
            Build your quiz<br/>platform in<br/><span style={{ color: '#FF4D00' }}>minutes.</span>
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', lineHeight: 1.7, maxWidth: 300 }}>
            From signup to your first published quiz — it takes less than an hour.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, position: 'relative', zIndex: 1 }}>
          {['Free to set up, no credit card needed','Import 500 students from one CSV','Quizzes go live in 5 minutes','Instant results, zero manual work'].map(f => (
            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 18, height: 18, borderRadius: 5, background: 'rgba(255,77,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ color: '#FF4D00', fontSize: 11 }}>✓</span>
              </div>
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>{f}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div style={{
        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '48px 40px', position: 'relative', zIndex: 1,
        opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.8s cubic-bezier(0.16,1,0.3,1) 0.1s',
      }}>
        <div style={{ width: '100%', maxWidth: 460 }}>
          <StepIndicator current={step}/>

          {/* STEP 0 */}
          {step === 0 && (
            <>
              <div style={{ marginBottom: 36 }}>
                <h1 style={{ fontSize: 'clamp(28px,3.5vw,40px)', fontWeight: 900, letterSpacing: '-0.04em', color: '#0A0A0A', lineHeight: 1.05, marginBottom: 10 }}>
                  Create your account
                </h1>
                <p style={{ fontSize: 15, color: '#6B6B6B' }}>
                  Already registered?{' '}
                  <Link href="/login" style={{ color: '#FF4D00', fontWeight: 700, textDecoration: 'none' }}>Sign in →</Link>
                </p>
              </div>

              {error && (
                <div style={{ background: '#FFF5F5', border: '1px solid #FED7D7', borderRadius: 14, padding: '12px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <AlertTriangle size={15} color="#E53E3E"/>
                  <span style={{ fontSize: 13, color: '#C53030', fontWeight: 500 }}>{error}</span>
                </div>
              )}

              <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {fields.map(f => (
                  <div key={f.name}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>{f.label}</label>
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}>{f.icon}</div>
                      <input type={f.type} placeholder={f.placeholder} value={form[f.name]} onChange={set(f.name)}
                        style={{ width: '100%', background: 'white', border: '1.5px solid #E5E5E3', borderRadius: 14, padding: '13px 14px 13px 42px', fontSize: 15, color: '#0A0A0A', outline: 'none', transition: 'all 0.15s', fontFamily: 'inherit' }}
                        onFocus={e => { e.target.style.borderColor = '#0A0A0A'; e.target.style.boxShadow = '0 0 0 3px rgba(10,10,10,0.08)'; }}
                        onBlur={e => { e.target.style.borderColor = '#E5E5E3'; e.target.style.boxShadow = 'none'; }}
                      />
                    </div>
                  </div>
                ))}

                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: '#6B6B6B', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 8 }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={15} color="#A3A3A0" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}/>
                    <input type={showPass ? 'text' : 'password'} placeholder="Min. 8 characters" value={form.password} onChange={set('password')}
                      style={{ width: '100%', background: 'white', border: '1.5px solid #E5E5E3', borderRadius: 14, padding: '13px 44px 13px 42px', fontSize: 15, color: '#0A0A0A', outline: 'none', transition: 'all 0.15s', fontFamily: 'inherit' }}
                      onFocus={e => { e.target.style.borderColor = '#0A0A0A'; e.target.style.boxShadow = '0 0 0 3px rgba(10,10,10,0.08)'; }}
                      onBlur={e => { e.target.style.borderColor = '#E5E5E3'; e.target.style.boxShadow = 'none'; }}
                    />
                    <button type="button" onClick={() => setShowPass(p => !p)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#A3A3A0', padding: 0, display: 'flex' }}>
                      {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading}
                  style={{ width: '100%', background: '#0A0A0A', color: 'white', border: 'none', borderRadius: 16, padding: '16px', fontSize: 16, fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit', marginTop: 4, opacity: loading ? 0.7 : 1 }}
                  onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = '#FF4D00'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(255,77,0,0.25)'; } }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#0A0A0A'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                  {loading ? (
                    <svg className="animate-spin" width={18} height={18} viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25"/>
                      <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" opacity="0.8"/>
                    </svg>
                  ) : <>Create account <ArrowRight size={16}/></>}
                </button>
              </form>
            </>
          )}

          {/* STEP 1 */}
          {step === 1 && (
            <div style={{ opacity: 1, transition: 'opacity 0.4s ease' }}>
              <div style={{ marginBottom: 36 }}>
                <div style={{ width: 56, height: 56, background: '#FFF0EB', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, fontSize: 26 }}>📬</div>
                <h1 style={{ fontSize: 'clamp(28px,3.5vw,40px)', fontWeight: 900, letterSpacing: '-0.04em', color: '#0A0A0A', lineHeight: 1.05, marginBottom: 10 }}>Check your inbox</h1>
                <p style={{ fontSize: 15, color: '#6B6B6B', lineHeight: 1.6 }}>
                  We sent a 6-digit code to <span style={{ color: '#0A0A0A', fontWeight: 700 }}>{form.email}</span>
                </p>
              </div>

              {error && (
                <div style={{ background: '#FFF5F5', border: '1px solid #FED7D7', borderRadius: 14, padding: '12px 16px', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <AlertTriangle size={15} color="#E53E3E"/>
                  <span style={{ fontSize: 13, color: '#C53030', fontWeight: 500 }}>{error}</span>
                </div>
              )}

              <div style={{ marginBottom: 32 }}>
                <OtpInput onChange={v => { setOtp(v); setError(''); }}/>
              </div>

              <button onClick={handleVerify} disabled={loading || otp.length < 6}
                style={{ width: '100%', background: otp.length === 6 ? '#0A0A0A' : '#F0F0EE', color: otp.length === 6 ? 'white' : '#A3A3A0', border: 'none', borderRadius: 16, padding: '16px', fontSize: 16, fontWeight: 700, cursor: otp.length < 6 ? 'not-allowed' : 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'inherit', marginBottom: 20 }}
                onMouseEnter={e => { if (otp.length === 6) { e.currentTarget.style.background = '#FF4D00'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                onMouseLeave={e => { e.currentTarget.style.background = otp.length === 6 ? '#0A0A0A' : '#F0F0EE'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                {loading ? (
                  <svg className="animate-spin" width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25"/>
                    <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" opacity="0.8"/>
                  </svg>
                ) : <>Verify & continue <ArrowRight size={16}/></>}
              </button>

              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: '#A3A3A0' }}>
                  Didn't receive it?{' '}
                  {countdown > 0 ? (
                    <span style={{ color: '#A3A3A0', fontWeight: 600 }}>Resend in {countdown}s</span>
                  ) : (
                    <button onClick={handleResend} style={{ background: 'none', border: 'none', color: '#FF4D00', fontWeight: 700, fontSize: 13, cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>Resend code</button>
                  )}
                </p>
                <button onClick={() => { setStep(0); setOtp(''); setError(''); }}
                  style={{ background: 'none', border: 'none', color: '#A3A3A0', fontSize: 13, cursor: 'pointer', marginTop: 8, fontFamily: 'inherit', transition: 'color 0.15s' }}
                  onMouseEnter={e => { e.target.style.color = '#0A0A0A'; }}
                  onMouseLeave={e => { e.target.style.color = '#A3A3A0'; }}>
                  ← Use a different email
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div style={{ textAlign: 'center', animation: 'fadeIn 0.5s ease' }}>
              <div style={{ width: 72, height: 72, background: '#F0FDF4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '3px solid #16A34A' }}>
                <CheckCircle size={36} color="#16A34A" strokeWidth={2.5}/>
              </div>
              <h2 style={{ fontSize: 36, fontWeight: 900, color: '#0A0A0A', letterSpacing: '-0.04em', marginBottom: 12 }}>You're in! 🎉</h2>
              <p style={{ fontSize: 16, color: '#6B6B6B', lineHeight: 1.6, marginBottom: 8 }}>Welcome to Streaksha, <strong>{form.name}</strong></p>
              <p style={{ fontSize: 14, color: '#A3A3A0' }}>Taking you to your dashboard...</p>
              <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
                <div style={{ width: 40, height: 4, background: '#E5E5E3', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{ height: '100%', background: '#16A34A', borderRadius: 99, animation: 'progress 1.8s ease forwards' }}/>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        @keyframes progress { from { width: 0%; } to { width: 100%; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .animate-spin { animation: spin 0.8s linear infinite; }
      `}</style>
    </div>
  );
}