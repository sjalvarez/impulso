'use client';

import { useEffect, useRef, useState } from 'react';
import { Link, useRouter } from '@/lib/i18n/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

interface Props {
  locale: string;
}

export default function UserMenu({ locale }: Props) {
  const [user, setUser] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [myCampaignHover, setMyCampaignHover] = useState(false);
  const [editCampaignHover, setEditCampaignHover] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, []);

  if (!user) {
    return (
      <Link
        href="/auth/signup"
        style={{
          background: '#C8102E',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '4px',
          fontSize: '12px',
          fontWeight: 600,
          textDecoration: 'none',
          display: 'inline-block',
          whiteSpace: 'nowrap',
        }}
      >
        Start campaign
      </Link>
    );
  }

  const initials = (
    (user.user_metadata?.full_name ?? user.email ?? '?').charAt(0)
  ).toUpperCase();

  async function handleSignOut() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.push('/');
  }

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <button
        onClick={() => setOpen((prev) => !prev)}
        style={{
          width: '34px',
          height: '34px',
          borderRadius: '50%',
          background: '#C8102E',
          color: 'white',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 600,
          fontFamily: 'inherit',
          position: 'relative',
        }}
      >
        {initials}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '44px',
            right: 0,
            background: 'white',
            border: '1px solid #E8E8E5',
            borderRadius: '8px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            minWidth: '180px',
            zIndex: 100,
            overflow: 'hidden',
          }}
        >
          <Link
            href="/dashboard"
            style={{
              padding: '10px 16px',
              fontSize: '12px',
              fontWeight: 500,
              color: '#2B2F36',
              display: 'block',
              textDecoration: 'none',
              background: myCampaignHover ? '#F6F6F4' : 'white',
            }}
            onMouseEnter={() => setMyCampaignHover(true)}
            onMouseLeave={() => setMyCampaignHover(false)}
          >
            My campaign
          </Link>
          <Link
            href="/dashboard/edit"
            style={{
              padding: '10px 16px',
              fontSize: '12px',
              fontWeight: 500,
              color: '#2B2F36',
              display: 'block',
              textDecoration: 'none',
              background: editCampaignHover ? '#F6F6F4' : 'white',
            }}
            onMouseEnter={() => setEditCampaignHover(true)}
            onMouseLeave={() => setEditCampaignHover(false)}
          >
            Edit campaign
          </Link>
          <div style={{ height: '0.5px', background: '#E8E8E5', margin: 0 }} />
          <button
            onClick={handleSignOut}
            style={{
              background: 'none',
              border: 'none',
              width: '100%',
              textAlign: 'left',
              padding: '10px 16px',
              fontSize: '12px',
              fontWeight: 500,
              color: '#C8102E',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
