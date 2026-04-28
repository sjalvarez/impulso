import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import EditCampaignForm from './EditCampaignForm';

export default async function EditCampaignPage({ params }: { params: Promise<{ locale: string }> }) {
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
    redirect(`/${locale}/onboarding`);
  }

  return <EditCampaignForm campaign={campaign} locale={locale} />;
}
