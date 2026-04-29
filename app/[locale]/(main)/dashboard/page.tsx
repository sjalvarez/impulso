import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import DashboardClient from './DashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createServerSupabaseClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/auth/login`);

  const sbAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: campaign } = await sbAdmin
    .from('campaigns')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!campaign) redirect(`/${locale}/onboarding`);

  const { data: donations } = await sbAdmin
    .from('donations')
    .select('amount')
    .eq('campaign_id', campaign.id);

  const totalRaised = (donations ?? []).reduce((s: number, d: { amount: number }) => s + (d.amount ?? 0), 0);
  const donorCount = (donations ?? []).length;

  return <DashboardClient userId={user.id} campaign={campaign} totalRaised={totalRaised} donorCount={donorCount} />;
}
