import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { Link } from '@/lib/i18n/navigation';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createServerSupabaseClient();
  const { data: { user } } = await sb.auth.getUser();

  if (!user) {
    redirect(`/${locale}/auth/login`);
  }

  const { data: campaign } = await sb
    .from('campaigns')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (!campaign) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
        padding: '40px 24px',
      }}>
        <div style={{
          textAlign: 'center',
          background: 'white',
          border: '1px solid #E8E8E5',
          borderRadius: '12px',
          padding: '48px 40px',
          maxWidth: '400px',
        }}>
          <p style={{ fontSize: '16px', fontWeight: 600, color: '#2B2F36', marginBottom: '8px' }}>
            No campaign yet
          </p>
          <p style={{ fontSize: '13px', color: '#767676', marginBottom: '24px' }}>
            You haven&apos;t created a campaign. Get started now.
          </p>
          <Link
            href="/onboarding"
            style={{
              display: 'inline-block',
              background: '#C8102E',
              color: 'white',
              padding: '10px 20px',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Start your campaign
          </Link>
        </div>
      </div>
    );
  }

  let donations: any[] = [];
  try {
    const { data } = await sb
      .from('donations')
      .select('*')
      .eq('campaign_id', campaign.id)
      .order('created_at', { ascending: false });
    donations = data ?? [];
  } catch {
    donations = [];
  }

  return <DashboardClient campaign={campaign} donations={donations} locale={locale} />;
}
