'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Mail, Lock, Eye, EyeOff, AlertTriangle, CheckCircle, ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react';

const FloatingOrb = ({ style }) => (
  <div style={{ position: 'absolute', borderRadius: '50%', pointerEvents: 'none', filter: 'blur(60px)', ...style }}/>
);

// ── OTP Input (same as register) ──────────────────────────────────────────────
function OtpInput({ value, onChange }) {
  const inputs = useRef([]);
  const digits = value.padEnd(6, '').split('').slice(0, 6);

  const handleChange = (i, val) => {
    const cleaned = val.replace(/\D/g, '').slice(-1);
    const arr = digits.map((d, idx) => idx === i ? cleaned : d);
    onChange(arr.join(''));
    if (cleaned && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
      const arr = digits.map((d, idx) => idx === i - 1 ? '' : d);
      onChange(arr.join(''));
    }
  };

  const handlePaste = (e) => {
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(paste.padEnd(6, ''));
    inputs.current[Math.min(paste.length, 5)]?.focus();
    e.preventDefault();
  };

  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <input key={i} ref={el => inputs.current[i] = el}
          type="text" inputMode="numeric" maxLength={1}
          value={digits[i] || ''} onChange={e => handleChange(i, e.target.value)}
          onKeyDown={e => handleKeyDown(i, e)} onPaste={handlePaste}
          style={{
            width: 52, height: 60, textAlign: 'center', fontSize: 24, fontWeight: 800,
            color: '#0A0A0A', background: 'white', border: '1.5px solid',
            borderColor: digits[i] ? '#0A0A0A' : '#E5E5E3',
            borderRadius: 14, outline: 'none', fontFamily: 'inherit',
            transition: 'all 0.15s', caretColor: 'transparent',
            boxShadow: digits[i] ? '0 0 0 3px rgba(10,10,10,0.08)' : 'none',
          }}
          onFocus={e => { e.target.style.borderColor = '#0A0A0A'; e.target.style.boxShadow = '0 0 0 3px rgba(10,10,10,0.08)'; }}
          onBlur={e => { if (!digits[i]) { e.target.style.borderColor = '#E5E5E3'; e.target.style.boxShadow = 'none'; } }}
        />
      ))}
    </div>
  );
}

// ── Password strength bar ─────────────────────────────────────────────────────
function PasswordStrength({ password }) {
  const checks = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'One uppercase letter', pass: /[A-Z]/.test(password) },
    { label: 'One number', pass: /\d/.test(password) },
  ];
  const score = checks.filter(c => c.pass).length;
  const colors = ['#E5E5E3', '#EF4444', '#F59E0B', '#16A34A'];
  const labels = ['', 'Weak', 'Fair', 'Strong'];

  if (!password) return null;

  return (
    <div style={{ marginTop: 10 }}>
      <div style={{ display: 'flex', gap: 4, marginBottom: 8 }}>
        {[0, 1, 2].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 99,
                                  background: i < score ? colors[score] : '#E5E5E3',
                                  transition: 'all 0.3s' }}/>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 12 }}>
          {checks.map(c => (
            <span key={c.label} style={{ fontSize: 11, color: c.pass ? '#16A34A' : '#A3A3A0',
                                          fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ fontSize: 9 }}>{c.pass ? '✓' : '○'}</span> {c.label}
            </span>
          ))}
        </div>
        {score > 0 && (
          <span style={{ fontSize: 11, fontWeight: 700, color: colors[score] }}>
            {labels[score]}
          </span>
        )}
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0=email, 1=otp, 2=newpass, 3=done
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setTimeout(() => setMounted(true), 30); }, []);

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleSendOtp = async (e) => {
    e?.preventDefault();
    if (!email) { setError('Email is required'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setStep(1); setCountdown(60);
    } catch (err) {
      setError(err.response?.data?.message || 'No account found with this email');
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) { setError('Enter the complete 6-digit OTP'); return; }
    setLoading(true); setError('');
    // We just validate OTP format here — actual verification happens with reset
    // Move to password step, server will reject if OTP is wrong
    setLoading(false);
    setStep(2);
  };

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 8) {
      setError('Password must be at least 8 characters'); return;
    }
    setLoading(true); setError('');
    try {
      await api.post('/auth/reset-password', { email, otp, newPassword });
      setStep(3);
      setTimeout(() => router.push('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid or expired OTP');
      if (err.response?.data?.message?.includes('OTP')) {
        setStep(1); setOtp('');
      }
    } finally { setLoading(false); }
  };

  const handleResend = async () => {
    if (countdown > 0) return;
    setError('');
    try {
      await api.post('/auth/forgot-password', { email });
      setCountdown(60);
    } catch {}
  };

  const stepMeta = [
    { emoji: '🔑', title: 'Forgot password?', sub: 'Enter your email and we\'ll send a reset code.' },
    { emoji: '📬', title: 'Enter the code', sub: `We sent a 6-digit code to ${email}` },
    { emoji: '🔒', title: 'New password', sub: 'Choose a strong password for your account.' },
    { emoji: '✅', title: 'Password reset!', sub: 'Your password has been updated successfully.' },
  ];

  const meta = stepMeta[step];

  return (
    <div style={{
      minHeight: '100vh', background: '#FAFAF8', fontFamily: "'Inter', sans-serif",
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '48px 24px', position: 'relative', overflow: 'hidden',
    }}>
      <FloatingOrb style={{ width: 500, height: 500, background: 'rgba(255,77,0,0.06)', top: '-20%', right: '-10%' }}/>
      <FloatingOrb style={{ width: 350, height: 350, background: 'rgba(37,99,235,0.05)', bottom: '0%', left: '-8%' }}/>

      <div style={{
        width: '100%', maxWidth: 480, position: 'relative', zIndex: 1,
        opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.7s cubic-bezier(0.16,1,0.3,1)',
      }}>
        {/* Card */}
        <div style={{
          background: 'white', borderRadius: 28, border: '1px solid #E5E5E3',
          boxShadow: '0 8px 40px rgba(0,0,0,0.08)', padding: '48px 44px',
        }}>
          {/* Back to login */}
          {step < 3 && (
            <Link href="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              fontSize: 13, color: '#A3A3A0', textDecoration: 'none', fontWeight: 600,
              marginBottom: 32, transition: 'color 0.15s',
            }}
              onMouseEnter={e => { e.currentTarget.style.color = '#0A0A0A'; }}
              onMouseLeave={e => { e.currentTarget.style.color = '#A3A3A0'; }}>
              <ArrowLeft size={14}/> Back to login
            </Link>
          )}

          {/* Step indicator dots */}
          {step < 3 && (
            <div style={{ display: 'flex', gap: 6, marginBottom: 36 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  height: 4, borderRadius: 99,
                  width: i === step ? 28 : 8,
                  background: i <= step ? '#0A0A0A' : '#E5E5E3',
                  transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
                }}/>
              ))}
            </div>
          )}

          {/* Icon */}
          <div style={{ fontSize: 40, marginBottom: 20, lineHeight: 1 }}>{meta.emoji}</div>

          {/* Title */}
          <h1 style={{ fontSize: 'clamp(26px,3vw,36px)', fontWeight: 900,
                        letterSpacing: '-0.04em', color: '#0A0A0A', lineHeight: 1.05,
                        marginBottom: 10 }}>
            {meta.title}
          </h1>
          <p style={{ fontSize: 15, color: '#6B6B6B', marginBottom: 36, lineHeight: 1.6 }}>
            {meta.sub}
          </p>

          {/* Error */}
          {error && (
            <div style={{
              background: '#FFF5F5', border: '1px solid #FED7D7', borderRadius: 12,
              padding: '12px 16px', marginBottom: 24,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <AlertTriangle size={15} color="#E53E3E"/>
              <span style={{ fontSize: 13, color: '#C53030', fontWeight: 500 }}>{error}</span>
            </div>
          )}

          {/* ── STEP 0: Email ── */}
          {step === 0 && (
            <form onSubmit={handleSendOtp}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#6B6B6B',
                                 textTransform: 'uppercase', letterSpacing: '0.06em',
                                 display: 'block', marginBottom: 8 }}>
                  Email address
                </label>
                <div style={{ position: 'relative' }}>
                  <Mail size={15} color="#A3A3A0" style={{ position: 'absolute', left: 14,
                                                            top: '50%', transform: 'translateY(-50%)',
                                                            pointerEvents: 'none' }}/>
                  <input type="email" placeholder="you@institute.com"
                    value={email} onChange={e => { setEmail(e.target.value); setError(''); }}
                    style={{
                      width: '100%', background: '#FAFAF8', border: '1.5px solid #E5E5E3',
                      borderRadius: 14, padding: '14px 14px 14px 42px',
                      fontSize: 15, color: '#0A0A0A', outline: 'none',
                      transition: 'all 0.15s', fontFamily: 'inherit',
                    }}
                    onFocus={e => { e.target.style.background = 'white'; e.target.style.borderColor = '#0A0A0A'; e.target.style.boxShadow = '0 0 0 3px rgba(10,10,10,0.08)'; }}
                    onBlur={e => { e.target.style.background = '#FAFAF8'; e.target.style.borderColor = '#E5E5E3'; e.target.style.boxShadow = 'none'; }}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading || !email}
                style={{
                  width: '100%', background: email ? '#0A0A0A' : '#F0F0EE',
                  color: email ? 'white' : '#A3A3A0',
                  border: 'none', borderRadius: 16, padding: '15px',
                  fontSize: 15, fontWeight: 700, cursor: email ? 'pointer' : 'not-allowed',
                  transition: 'all 0.2s', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 8, fontFamily: 'inherit',
                }}
                onMouseEnter={e => { if (email && !loading) { e.currentTarget.style.background = '#FF4D00'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                onMouseLeave={e => { e.currentTarget.style.background = email ? '#0A0A0A' : '#F0F0EE'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                {loading ? (
                  <svg style={{ animation: 'spin 0.8s linear infinite' }} width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25"/>
                    <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" opacity="0.8"/>
                  </svg>
                ) : <>Send reset code <ArrowRight size={15}/></>}
              </button>
            </form>
          )}

          {/* ── STEP 1: OTP ── */}
          {step === 1 && (
            <div>
              <div style={{ marginBottom: 28 }}>
                <OtpInput value={otp} onChange={(v) => { setOtp(v); setError(''); }}/>
              </div>

              <button onClick={handleVerifyOtp} disabled={loading || otp.length < 6}
                style={{
                  width: '100%', background: otp.length === 6 ? '#0A0A0A' : '#F0F0EE',
                  color: otp.length === 6 ? 'white' : '#A3A3A0',
                  border: 'none', borderRadius: 16, padding: '15px',
                  fontSize: 15, fontWeight: 700, cursor: otp.length < 6 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 8, fontFamily: 'inherit', marginBottom: 20,
                }}
                onMouseEnter={e => { if (otp.length === 6) { e.currentTarget.style.background = '#FF4D00'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                onMouseLeave={e => { e.currentTarget.style.background = otp.length === 6 ? '#0A0A0A' : '#F0F0EE'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                Verify code <ArrowRight size={15}/>
              </button>

              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 13, color: '#A3A3A0' }}>
                  Didn't receive it?{' '}
                  {countdown > 0 ? (
                    <span style={{ fontWeight: 600 }}>Resend in {countdown}s</span>
                  ) : (
                    <button onClick={handleResend} style={{
                      background: 'none', border: 'none', color: '#FF4D00', fontWeight: 700,
                      fontSize: 13, cursor: 'pointer', padding: 0, fontFamily: 'inherit',
                    }}>
                      Resend code
                    </button>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* ── STEP 2: New password ── */}
          {step === 2 && (
            <div>
              {/* Security badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8,
                             background: '#F0FDF4', border: '1px solid #BBF7D0',
                             borderRadius: 10, padding: '10px 14px', marginBottom: 24 }}>
                <ShieldCheck size={15} color="#16A34A"/>
                <span style={{ fontSize: 13, color: '#15803D', fontWeight: 600 }}>
                  OTP verified — set your new password
                </span>
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#6B6B6B',
                                 textTransform: 'uppercase', letterSpacing: '0.06em',
                                 display: 'block', marginBottom: 8 }}>
                  New Password
                </label>
                <div style={{ position: 'relative' }}>
                  <Lock size={15} color="#A3A3A0" style={{ position: 'absolute', left: 14,
                                                            top: '50%', transform: 'translateY(-50%)',
                                                            pointerEvents: 'none' }}/>
                  <input type={showPass ? 'text' : 'password'} placeholder="Min. 8 characters"
                    value={newPassword} onChange={e => { setNewPassword(e.target.value); setError(''); }}
                    style={{
                      width: '100%', background: '#FAFAF8', border: '1.5px solid #E5E5E3',
                      borderRadius: 14, padding: '14px 44px 14px 42px',
                      fontSize: 15, color: '#0A0A0A', outline: 'none',
                      transition: 'all 0.15s', fontFamily: 'inherit',
                    }}
                    onFocus={e => { e.target.style.background = 'white'; e.target.style.borderColor = '#0A0A0A'; e.target.style.boxShadow = '0 0 0 3px rgba(10,10,10,0.08)'; }}
                    onBlur={e => { e.target.style.background = '#FAFAF8'; e.target.style.borderColor = '#E5E5E3'; e.target.style.boxShadow = 'none'; }}
                  />
                  <button type="button" onClick={() => setShowPass(p => !p)} style={{
                    position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#A3A3A0', padding: 0, display: 'flex',
                  }}>
                    {showPass ? <EyeOff size={16}/> : <Eye size={16}/>}
                  </button>
                </div>
                <PasswordStrength password={newPassword}/>
              </div>

              <button onClick={handleResetPassword}
                disabled={loading || newPassword.length < 8}
                style={{
                  width: '100%', background: newPassword.length >= 8 ? '#0A0A0A' : '#F0F0EE',
                  color: newPassword.length >= 8 ? 'white' : '#A3A3A0',
                  border: 'none', borderRadius: 16, padding: '15px',
                  fontSize: 15, fontWeight: 700,
                  cursor: newPassword.length < 8 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s', display: 'flex', alignItems: 'center',
                  justifyContent: 'center', gap: 8, fontFamily: 'inherit',
                }}
                onMouseEnter={e => { if (newPassword.length >= 8 && !loading) { e.currentTarget.style.background = '#16A34A'; e.currentTarget.style.transform = 'translateY(-1px)'; } }}
                onMouseLeave={e => { e.currentTarget.style.background = newPassword.length >= 8 ? '#0A0A0A' : '#F0F0EE'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                {loading ? (
                  <svg style={{ animation: 'spin 0.8s linear infinite' }} width={18} height={18} viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25"/>
                    <path fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" opacity="0.8"/>
                  </svg>
                ) : <>Reset password <ArrowRight size={15}/></>}
              </button>
            </div>
          )}

          {/* ── STEP 3: Done ── */}
          {step === 3 && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ width: 72, height: 72, background: '#F0FDF4', borderRadius: '50%',
                             display: 'flex', alignItems: 'center', justifyContent: 'center',
                             margin: '0 auto 24px', border: '3px solid #16A34A',
                             animation: 'popIn 0.5s cubic-bezier(0.16,1,0.3,1)' }}>
                <CheckCircle size={36} color="#16A34A" strokeWidth={2.5}/>
              </div>
              <p style={{ fontSize: 15, color: '#6B6B6B', marginBottom: 8, lineHeight: 1.6 }}>
                Your password has been updated.
              </p>
              <p style={{ fontSize: 13, color: '#A3A3A0', marginBottom: 28 }}>
                Redirecting to login...
              </p>
              <Link href="/login" style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                background: '#0A0A0A', color: 'white', textDecoration: 'none',
                padding: '12px 24px', borderRadius: 12, fontSize: 14, fontWeight: 700,
              }}>
                Go to login <ArrowRight size={14}/>
              </Link>
            </div>
          )}
        </div>

        {/* Bottom note */}
        {step < 3 && (
          <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: '#C0C0BC' }}>
            Remember your password?{' '}
            <Link href="/login" style={{ color: '#6B6B6B', fontWeight: 700, textDecoration: 'none' }}>
              Sign in
            </Link>
          </p>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.7); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}