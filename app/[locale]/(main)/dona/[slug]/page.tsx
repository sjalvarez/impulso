import { notFound } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getDaysUntilElection } from '@/lib/jce-calendar';
import type { Campaign } from '@/types';
import type { ElectionType } from '@/lib/jce-calendar';

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

const RACE_LABELS: Record<string, string> = {
  mayor: 'Mayor (Alcalde/sa)',
  senator: 'Senator (Senador/a)',
  deputy: 'Deputy (Diputado/a)',
  district_director: 'District Director',
};

export default async function DonaPage({ params }: Props) {
  const { slug } = await params;
  const sb = await createServerSupabaseClient();
  const { data } = await sb.from('campaigns').select('*').eq('slug', slug).single();
  if (!data) notFound();
  const campaign = data as Campaign;
  const goalFmt = new Intl.NumberFormat('es-DO').format(campaign.goal_amount);
  const electionType = (campaign.election_type ?? 'general') as ElectionType;
  const raceType = campaign.race_type ?? 'mayor';
  const daysLeft = getDaysUntilElection(electionType, raceType);

  return (
    <div style={{ background: '#FAFAFA', minHeight: '100vh', padding: '40px 24px' }}>
      <div style={{ maxWidth: '560px', margin: '0 auto' }}>
        <div style={{ background: 'white', border: '1px solid #E8E8E5', borderRadius: '12px', overflow: 'hidden' }}>
          {campaign.banner_url && (
            <div style={{ height: '160px', backgroundImage: `url(${campaign.banner_url})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
          )}
          <div style={{ padding: '28px 32px' }}>
            <p style={{ fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#C8102E', fontWeight: 600, margin: '0 0 6px 0' }}>{RACE_LABELS[raceType] ?? raceType}</p>
            <h1 style={{ fontSize: '26px', fontWeight: 600, color: '#2B2F36', letterSpacing: '-0.02em', margin: '0 0 16px 0' }}>{campaign.candidate_name}</h1>
            {campaign.description && <p style={{ fontSize: '14px', color: '#767676', lineHeight: 1.65, margin: '0 0 20px 0' }}>{campaign.description}</p>}
            <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
              <Stat label="Campaign goal" value={`RD$${goalFmt}`} />
              <Stat label="Days until election" value={String(daysLeft)} />
              {campaign.municipality && <Stat label="Municipality" value={campaign.municipality} />}
            </div>
            <button disabled style={{ width: '100%', height: '48px', background: '#C8102E', color: 'white', border: 'none', borderRadius: '4px', fontSize: '15px', fontWeight: 600, cursor: 'not-allowed', opacity: 0.5, fontFamily: 'inherit' }}>
              Donate now
            </button>
            <p style={{ textAlign: 'center', fontSize: '12px', color: '#767676', marginTop: '10px', marginBottom: 0 }}>Donation page coming soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: '#F6F6F4', borderRadius: '8px', padding: '10px 14px', flex: 1, minWidth: '120px' }}>
      <p style={{ fontSize: '10px', color: '#767676', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 2px 0' }}>{label}</p>
      <p style={{ fontSize: '15px', fontWeight: 600, color: '#2B2F36', margin: 0 }}>{value}</p>
    </div>
  );
}
