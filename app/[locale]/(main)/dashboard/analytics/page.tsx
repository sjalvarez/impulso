import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import AnalyticsClient from './AnalyticsClient';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createServerSupabaseClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/auth/login`);
  const { data: campaign } = await sb.from('campaigns').select('*').eq('user_id', user.id).single();
  if (!campaign) redirect(`/${locale}/onboarding`);

  // Use service role to bypass RLS when reading donations
  const sbAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const { data: donations } = await sbAdmin
    .from('donations')
    .select('id, donor_name, donor_email, amount, is_mock, created_at')
    .eq('campaign_id', campaign.id)
    .order('created_at', { ascending: false });

  return <AnalyticsClient campaign={campaign} initialDonations={donations ?? []} />;
}
