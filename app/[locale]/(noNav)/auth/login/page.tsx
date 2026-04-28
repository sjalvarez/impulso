'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';
import Logo from '@/components/ui/Logo';
import { Link } from '@/lib/i18n/navigation';

export default function LoginPage() {
  const t = useTranslations('auth.login');
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createBrowserSupabaseClient();
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError) { setError(authError.message); setLoading(false); return; }
    const redirect = searchParams.get('redirect') ?? '/dashboard';
    router.push(redirect);
    router.refresh();
  }

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ marginBottom: '28px' }}><Logo height={32} /></div>
      <div style={{ background: 'white', border: '1px solid #E8E8E5', borderRadius: '12px', padding: '40px', width: '100%', maxWidth: '440px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: '#2B2F36', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>{t('title')}</h1>
        <p style={{ fontSize: '13px', color: '#767676', margin: '0 0 28px 0' }}>{t('subtitle')}</p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={labelStyle}>{t('emailLabel')}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" style={inputStyle} placeholder={t('emailPlaceholder')} />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>{t('passwordLabel')}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" style={inputStyle} placeholder={t('passwordPlaceholder')} />
          </div>
          {error && <p style={{ fontSize: '13px', color: '#C8102E', marginBottom: '16px', padding: '10px 14px', background: '#FFF5F5', borderRadius: '6px', border: '1px solid #FED7D7' }}>{error}</p>}
          <button type="submit" disabled={loading} style={{ width: '100%', height: '44px', background: loading ? '#E8E8E5' : '#C8102E', color: 'white', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
            {loading ? t('submitting') : t('submitBtn')}
          </button>
        </form>
        <p style={{ textAlign: 'center', fontSize: '13px', color: '#767676', marginTop: '20px', marginBottom: 0 }}>
          {t('noAccount')}{' '}
          <Link href="/auth/signup" style={{ color: '#C8102E', textDecoration: 'none', fontWeight: 600 }}>{t('createOne')}</Link>
        </p>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 600, color: '#2B2F36', marginBottom: '6px' };
const inputStyle: React.CSSProperties = { width: '100%', height: '40px', border: '1px solid #E8E8E5', borderRadius: '6px', padding: '0 12px', fontSize: '13px', color: '#2B2F36', background: 'white', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' };
