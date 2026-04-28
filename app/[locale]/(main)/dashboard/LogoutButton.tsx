'use client';

import { useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';
import { useRouter } from '@/lib/i18n/navigation';

export default function LogoutButton({ locale }: { locale: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    setLoading(true);
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push('/auth/login');
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      style={{
        background: 'none',
        border: '1px solid #E8E8E5',
        borderRadius: '6px',
        padding: '7px 14px',
        fontSize: '13px',
        fontWeight: 500,
        color: '#767676',
        cursor: loading ? 'not-allowed' : 'pointer',
        fontFamily: 'inherit',
        opacity: loading ? 0.6 : 1,
      }}
    >
      {loading ? 'Signing out…' : 'Sign out'}
    </button>
  );
}
