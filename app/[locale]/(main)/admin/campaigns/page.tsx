import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import AdminCampaignsClient from './AdminCampaignsClient';

export default async function AdminCampaignsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const sb = await createServerSupabaseClient();
  const { data: { user } } = await sb.auth.getUser();

  if (!user || user.email !== 'admin@impulso.do') {
    redirect(`/${locale}/dashboard`);
  }

  const { data: campaigns } = await sb
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false });

  return <AdminCampaignsClient campaigns={campaigns ?? []} />;
}
