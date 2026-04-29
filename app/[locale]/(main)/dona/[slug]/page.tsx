import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { JCE_PARTIES } from '@/lib/jce-parties';
import DonationPageClient from './DonationPageClient';

export default async function DonaPage({ params }: { params: Promise<{ locale: string; slug: string }> }) {
  const { slug, locale } = await params;
  const sb = await createServerSupabaseClient();

  const { data: campaign } = await sb.from('campaigns').select('*').eq('slug', slug).single();
  if (!campaign) notFound();

  // Fetch donation count
  const { count } = await sb.from('donations').select('*', { count: 'exact', head: true }).eq('campaign_id', campaign.id);

  const primary = campaign.page_primary_color ?? '#0D2B6B';
  const accent = campaign.page_accent_color ?? '#C8102E';

  const party = JCE_PARTIES.find((p: { id: string }) => p.id === campaign.party_affiliation);

  return <DonationPageClient campaign={campaign} donorCount={count ?? 0} primary={primary} accent={accent} party={party ?? null} locale={locale} />;
}
