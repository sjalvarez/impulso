import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import AnalyticsClient from './AnalyticsClient';

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createServerSupabaseClient();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect(`/${locale}/auth/login`);
  const { data: campaign } = await sb.from('campaigns').select('*').eq('user_id', user.id).single();
  if (!campaign) redirect(`/${locale}/onboarding`);
  return <AnalyticsClient campaign={campaign} />;
}
