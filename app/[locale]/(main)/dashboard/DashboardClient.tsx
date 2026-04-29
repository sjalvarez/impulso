'use client';

import { useState, useEffect } from 'react';
import { useRouter } from '@/lib/i18n/navigation';
import Image from 'next/image';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';
import { JCE_PARTIES } from '@/lib/jce-parties';

interface Campaign {
  id: string;
  candidate_name: string;
  campaign_name?: string;
  slug: string;
  status: string;
  party_affiliation?: string;
  race_type?: string;
  election_type?: string;
  election_date_type?: string;
  election_deadline?: string;
  fundraising_deadline?: string;
  candidate_photo_url?: string;
}

interface Donation {
  id: string;
  amount: number;
  created_at: string;
}

const RACE_LABELS: Record<string, string> = {
  president: 'President (Presidente/a)',
  senator: 'Senator (Senador/a)',
  deputy: 'Deputy (Diputado/a)',
  mayor: 'Mayor (Alcalde/a)',
  district_director: 'District Director (Director/a Distrital)',
};

const ELECTION_TYPE_LABELS: Record<string, string> = {
  primary: 'Primary',
  municipal: 'Municipal election',
  general: 'General election',
};

function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? '?';
  return ((parts[0][0] ?? '') + (parts[parts.length - 1][0] ?? '')).toUpperCase();
}

function StatusPill({ status }: { status: string }) {
  const config: Record<string, { bg: string; color: string; text: string }> = {
    active: { bg: '#DCFCE7', color: '#166534', text: 'Active' },
    pending_verification: { bg: '#FEF3C7', color: '#92400E', text: 'Pending verification' },
    suspended: { bg: '#FEE2E2', color: '#991B1B', text: 'Suspended' },
  };
  const s = config[status] ?? config['pending_verification'];
  return (
    <span style={{ fontSize: '10px', fontWeight: 600, padding: '3px 10px', borderRadius: '20px', background: s.bg, color: s.color, marginLeft: '10px', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
      {s.text}
    </span>
  );
}

function CandidateAvatar({ url, name }: { url?: string; name: string }) {
  const [err, setErr] = useState(false);
  const size = 64;
  const initials = getInitials(name);

  if (!url || err) {
    return (
      <div style={{ width: size, height: size, borderRadius: '50%', background: '#F6F6F4', border: '0.5px solid #E8E8E5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginRight: 16 }}>
        <span style={{ fontSize: '20px', fontWeight: 600, color: '#2B2F36', fontFamily: 'inherit' }}>{initials}</span>
      </div>
    );
  }

  return (
    <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, marginRight: 16 }}>
      <Image src={url} alt={name} width={size * 2} height={size * 2} quality={95} style={{ objectFit: 'cover', objectPosition: 'top', width: '100%', height: '100%' }} onError={() => setErr(true)} />
    </div>
  );
}

function PartyCell({ partyId }: { partyId?: string }) {
  const [imgErr, setImgErr] = useState(false);
  const party = JCE_PARTIES.find(p => p.id === partyId);
  if (!party) return <span style={{ fontSize: '13px', color: '#2B2F36' }}>—</span>;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      {!imgErr ? (
        <Image src={`/images/parties/${party.id}.png`} alt={party.abbr} width={20} height={20} style={{ objectFit: 'contain' }} onError={() => setImgErr(true)} />
      ) : (
        <div style={{ width: 20, height: 20, background: '#F6F6F4', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', fontWeight: 700, color: '#2B2F36' }}>{party.abbr.slice(0, 3)}</div>
      )}
      <span style={{ fontSize: '9px', fontWeight: 600, background: '#F6F6F4', border: '0.5px solid #E8E8E5', borderRadius: 3, padding: '1px 5px', color: '#767676' }}>{party.abbr}</span>
      <span style={{ fontSize: '13px', fontWeight: 500, color: '#2B2F36' }}>{party.name}</span>
    </div>
  );
}

interface ActionCardProps {
  iconBg: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  teaser: React.ReactNode;
  buttonBg: string;
  buttonText: string;
  onButtonClick: () => void;
}

function ActionCard({ iconBg, icon, title, description, teaser, buttonBg, buttonText, onButtonClick }: ActionCardProps) {
  const [hover, setHover] = useState(false);
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{ background: 'white', border: `0.5px solid ${hover ? 'rgba(0,0,0,0.2)' : '#E8E8E5'}`, borderRadius: 12, padding: 24, display: 'flex', flexDirection: 'column', transition: 'border-color 0.15s' }}
    >
      <div style={{ width: 40, height: 40, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        {icon}
      </div>
      <p style={{ fontSize: 14, fontWeight: 600, color: '#2B2F36', margin: '0 0 6px', fontFamily: 'inherit' }}>{title}</p>
      <p style={{ fontSize: 12, color: '#767676', lineHeight: 1.6, flex: 1, margin: '0 0 16px', fontFamily: 'inherit' }}>{description}</p>
      {teaser}
      <button
        onClick={onButtonClick}
        style={{ width: '100%', height: 36, background: buttonBg, color: 'white', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
      >
        {buttonText}
      </button>
    </div>
  );
}

export default function DashboardClient({ userId }: { userId: string }) {
  const router = useRouter();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [donations, setDonations] = useState<Donation[]>([]);
  const [loading, setLoading] = useState(true);
  const [copyLabel, setCopyLabel] = useState('Copy link');

  useEffect(() => {
    async function load() {
      const sb = createBrowserSupabaseClient();
      const { data: camp } = await sb.from('campaigns').select('*').eq('user_id', userId).single();
      if (!camp) { router.push('/onboarding'); return; }
      setCampaign(camp);
      const { data: dons } = await sb.from('donations').select('*').eq('campaign_id', camp.id);
      setDonations(dons ?? []);
      setLoading(false);
    }
    load();
  }, [userId, router]);

  async function handleSignOut() {
    const sb = createBrowserSupabaseClient();
    await sb.auth.signOut();
    router.push('/');
  }

  function handleCopyLink() {
    if (!campaign) return;
    navigator.clipboard.writeText(`https://impulso.do/dona/${campaign.slug}`);
    setCopyLabel('Copied ✓');
    setTimeout(() => setCopyLabel('Copy link'), 2000);
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <p style={{ fontSize: 13, color: '#767676' }}>Loading your dashboard…</p>
      </div>
    );
  }

  if (!campaign) return null;

  const totalRaised = donations.reduce((s, d) => s + (d.amount ?? 0), 0);
  const donorCount = donations.length;
  const avgDonation = donorCount > 0 ? Math.round(totalRaised / donorCount) : 0;
  const daysToElection = daysUntil(campaign.election_deadline);
  const daysToFundraising = daysUntil(campaign.fundraising_deadline);
  const donationLink = `impulso.do/dona/${campaign.slug}`;
  const electionTypeLabel = ELECTION_TYPE_LABELS[campaign.election_date_type ?? campaign.election_type ?? ''] ?? 'General election';

  const metaColumns = [
    {
      label: 'Party',
      value: <PartyCell partyId={campaign.party_affiliation} />,
      sub: null,
    },
    {
      label: 'Running for',
      value: RACE_LABELS[campaign.race_type ?? ''] ?? campaign.race_type ?? '—',
      sub: electionTypeLabel,
    },
    {
      label: 'Election date',
      value: formatDate(campaign.election_deadline),
      sub: daysToElection !== null ? `${daysToElection} days away` : null,
    },
    {
      label: 'Last day to raise funds',
      value: formatDate(campaign.fundraising_deadline),
      sub: daysToFundraising !== null ? `${daysToFundraising} days remaining` : null,
    },
  ];

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .passport-top { flex-direction: column !important; align-items: center !important; text-align: center !important; }
          .passport-top .avatar { margin-right: 0 !important; margin-bottom: 12px !important; }
          .passport-top .edit-btn { width: 100% !important; margin-top: 12px !important; }
          .meta-grid { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 16px !important; }
          .meta-col { padding-right: 0 !important; margin-right: 0 !important; border-right: none !important; }
          .action-grid { grid-template-columns: 1fr !important; }
          .link-row { flex-wrap: wrap !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 32px', background: 'white' }}>

        {/* ── Passport card ─────────────────────────────────── */}
        <div style={{ background: 'white', border: '0.5px solid #E8E8E5', borderRadius: 12, padding: '24px 28px', marginBottom: 24 }}>

          {/* Top row */}
          <div className="passport-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Avatar */}
            <div className="avatar" style={{ marginRight: 0 }}>
              <CandidateAvatar url={campaign.candidate_photo_url} name={campaign.candidate_name} />
            </div>

            {/* Name + campaign name */}
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 22, fontWeight: 600, color: '#2B2F36', letterSpacing: '-0.03em', fontFamily: 'inherit' }}>
                  {campaign.candidate_name}
                </span>
                <StatusPill status={campaign.status} />
              </div>
              {campaign.campaign_name && (
                <p style={{ fontSize: 13, color: '#767676', margin: '2px 0 0' }}>{campaign.campaign_name}</p>
              )}
            </div>

            {/* Edit button */}
            <button
              className="edit-btn"
              onClick={() => router.push('/dashboard/edit')}
              style={{ border: '0.5px solid #E8E8E5', background: 'white', color: '#2B2F36', fontSize: 12, fontWeight: 500, height: 34, padding: '0 14px', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, marginLeft: 16 }}
            >
              Edit campaign
            </button>
          </div>

          {/* Meta row */}
          <div style={{ borderTop: '0.5px solid #E8E8E5', paddingTop: 16, marginTop: 16 }}>
            <div className="meta-grid" style={{ display: 'flex' }}>
              {metaColumns.map((col, i) => (
                <div
                  key={col.label}
                  className="meta-col"
                  style={{
                    flex: 1,
                    paddingRight: i < metaColumns.length - 1 ? 20 : 0,
                    marginRight: i < metaColumns.length - 1 ? 20 : 0,
                    borderRight: i < metaColumns.length - 1 ? '0.5px solid #E8E8E5' : 'none',
                  }}
                >
                  <p style={{ fontSize: 10, textTransform: 'uppercase', color: '#767676', letterSpacing: '0.08em', margin: '0 0 4px', fontFamily: 'inherit' }}>{col.label}</p>
                  {typeof col.value === 'string'
                    ? <p style={{ fontSize: 13, fontWeight: 500, color: '#2B2F36', margin: 0, fontFamily: 'inherit' }}>{col.value}</p>
                    : col.value}
                  {col.sub && <p style={{ fontSize: 11, color: '#767676', margin: '1px 0 0', fontFamily: 'inherit' }}>{col.sub}</p>}
                </div>
              ))}
            </div>
          </div>

          {/* Link row */}
          <div className="link-row" style={{ borderTop: '0.5px solid #E8E8E5', paddingTop: 12, marginTop: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 12, color: '#767676', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {donationLink}
            </span>
            <button
              onClick={handleCopyLink}
              style={{ background: 'none', border: 'none', fontSize: 11, fontWeight: 500, color: '#C8102E', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0, padding: 0 }}
            >
              {copyLabel}
            </button>
          </div>
        </div>

        {/* ── Action cards ───────────────────────────────────── */}
        <div className="action-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, maxWidth: 740, margin: '0 auto' }}>

          {/* Card 1 — Analytics */}
          <ActionCard
            iconBg="#E6F1FB"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="1.5" strokeLinecap="round"><path d="M3 20h18"/><rect x="5" y="14" width="3" height="6"/><rect x="10.5" y="9" width="3" height="11"/><rect x="16" y="4" width="3" height="16"/></svg>}
            title="Donation analytics"
            description="Track every donation in real time. See who's giving, how much, and export JCE-ready reports."
            teaser={
              <div style={{ background: '#F6F6F4', borderRadius: 8, padding: '10px 12px', marginBottom: 14 }}>
                {donorCount === 0 ? (
                  <p style={{ fontSize: 13, fontWeight: 500, color: '#767676', margin: 0, fontFamily: 'inherit' }}>No donations yet — share your link.</p>
                ) : (
                  <>
                    <p style={{ fontSize: 20, fontWeight: 600, color: '#2B2F36', letterSpacing: '-0.03em', margin: 0, fontFamily: 'inherit' }}>
                      RD${totalRaised.toLocaleString('es-DO')}
                    </p>
                    <p style={{ fontSize: 11, color: '#767676', margin: '1px 0 0', fontFamily: 'inherit' }}>
                      {donorCount} donor{donorCount !== 1 ? 's' : ''} so far
                    </p>
                  </>
                )}
              </div>
            }
            buttonBg="#185FA5"
            buttonText="View analytics →"
            onButtonClick={() => router.push('/dashboard/analytics')}
          />

          {/* Card 2 — Preview & edit */}
          <ActionCard
            iconBg="#EEEDFE"
            icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#534AB7" strokeWidth="1.5" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>}
            title="Preview & edit"
            description="Customize your donation page — edit your proposals, colors, and banner. Preview exactly what donors see."
            teaser={
              <div style={{ background: '#F6F6F4', borderRadius: 6, height: 64, marginBottom: 14, border: '0.5px solid #E8E8E5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4 }}>
                <div style={{ width: 80, height: 3, background: '#C8102E', borderRadius: 2 }} />
                <div style={{ width: 60, height: 3, background: '#E8E8E5', borderRadius: 2 }} />
                <div style={{ width: 48, height: 3, background: '#E8E8E5', borderRadius: 2 }} />
              </div>
            }
            buttonBg="#534AB7"
            buttonText="Preview & edit →"
            onButtonClick={() => router.push('/dashboard/preview')}
          />
        </div>

        {/* ── Sign out ───────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginTop: 24 }}>
          <button
            onClick={handleSignOut}
            style={{ background: 'none', border: 'none', fontSize: 12, color: '#767676', textDecoration: 'underline', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Sign out
          </button>
        </div>
      </div>
    </>
  );
}
