'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/lib/i18n/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';
import Logo from '@/components/ui/Logo';
import { Link } from '@/lib/i18n/navigation';

export default function SignupPage() {
  const t = useTranslations('auth.signup');
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError(t('errorMismatch')); return; }
    if (password.length < 8) { setError(t('errorLength')); return; }
    setLoading(true);
    const supabase = createBrowserSupabaseClient();
    const { error: authError } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
    if (authError) { setError(authError.message); setLoading(false); return; }
    router.push('/onboarding');
    router.refresh();
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ marginBottom: '28px' }}><Logo height={32} /></div>
      <div style={{ background: 'white', border: '1px solid #E8E8E5', borderRadius: '12px', padding: '40px', width: '100%', maxWidth: '440px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#2B2F36', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>{t('title')}</h1>
        <p style={{ fontSize: '13px', color: '#767676', margin: '0 0 28px 0' }}>{t('subtitle')}</p>
        <form onSubmit={handleSubmit}>
          <Field label={t('fullNameLabel')}><input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} required style={inputStyle} placeholder={t('fullNamePlaceholder')} autoComplete="name" /></Field>
          <Field label={t('emailLabel')}><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={inputStyle} placeholder={t('emailPlaceholder')} autoComplete="email" /></Field>
          <Field label={t('passwordLabel')}><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} placeholder={t('passwordPlaceholder')} autoComplete="new-password" /></Field>
          <div style={{ marginBottom: '20px' }}>
            <Field label={t('confirmLabel')}><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required style={inputStyle} placeholder={t('confirmPlaceholder')} autoComplete="new-password" /></Field>
          </div>
          {error && <p style={{ fontSize: '13px', color: '#C8102E', marginBottom: '16px', padding: '10px 14px', background: '#FFF5F5', borderRadius: '6px', border: '1px solid #FED7D7' }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ width: '100%', height: '44px', background: loading ? '#E8E8E5' : '#C8102E', color: 'white', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {loading ? t('submitting') : t('submitBtn')}
          </button>
        </form>
        <p style={{ textAlign: 'center', fontSize: '13px', color: '#767676', marginTop: '20px', marginBottom: 0 }}>
          {t('haveAccount')}{' '}
          <Link href="/auth/login" style={{ color: '#C8102E', textDecoration: 'none', fontWeight: 600 }}>{t('signIn')}</Link>
        </p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#2B2F36', marginBottom: '6px' }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = { width: '100%', height: '40px', border: '1px solid #E8E8E5', borderRadius: '6px', padding: '0 12px', fontSize: '13px', color: '#2B2F36', background: 'white', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' };
