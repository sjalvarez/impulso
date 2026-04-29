'use client';
import { useState } from 'react';
import Image from 'next/image';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';
import { useRouter } from '@/lib/i18n/navigation';

interface Campaign {
  id: string;
  candidate_name: string;
  slug: string;
  banner_url?: string;
  banner_phrase?: string;
  banner_type?: string;
  candidate_photo_url?: string;
  party_affiliation?: string;
  race_type?: string;
  election_date_type?: string;
  fundraising_deadline?: string;
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  ai_summary?: { intro?: string; proposals?: { title: string; description: string }[] } | null;
  proposal_overrides?: { title: string; description: string }[] | null;
  page_intro_override?: string;
  page_show_scorecards?: boolean;
  page_show_chatbot?: boolean;
  campaign_platform_url?: string;
}

interface JCEParty { id: string; name: string; abbr: string; }

interface Props {
  campaign: Campaign;
  donorCount: number;
  primary: string;
  accent: string;
  party: JCEParty | null;
  locale: string;
}

const RACE_LABELS: Record<string, string> = {
  president: 'President', senator: 'Senator', deputy: 'Deputy',
  mayor: 'Mayor', district_director: 'District Director',
};
const ELECTION_LABELS: Record<string, string> = {
  primary: 'Primary 2027', municipal: 'Municipal 2028', general: 'General 2028',
};

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function getInitials(name: string): string {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? '') + (p[p.length - 1]?.[0] ?? '')).toUpperCase();
}

const PRESET_AMOUNTS = [100, 500, 1000, 2000];

export default function DonationPageClient({ campaign, donorCount, primary, accent, party, locale }: Props) {
  const router = useRouter();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [formVisible, setFormVisible] = useState(false);
  const [photoErr, setPhotoErr] = useState(false);
  const [introExpanded, setIntroExpanded] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [cedula, setCedula] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardError, setCardError] = useState('');
  const [cardOk, setCardOk] = useState(false);
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Chatbot state
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: 'bot' | 'user'; text: string }[]>([
    { role: 'bot', text: `Hi! I can answer questions about ${campaign.candidate_name}'s campaign platform. What would you like to know?` }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  const lightBg = hexToRgba(primary, 0.08);
  const finalAmount = selectedAmount ?? (customAmount ? parseInt(customAmount.replace(/,/g, ''), 10) : null);
  const daysLeft = daysUntil(campaign.fundraising_deadline);
  const intro = campaign.page_intro_override || campaign.ai_summary?.intro || `Support ${campaign.candidate_name}'s campaign for ${RACE_LABELS[campaign.race_type ?? ''] ?? 'office'}.`;
  const showScores = campaign.page_show_scorecards !== false;
  const showChatbot = campaign.page_show_chatbot !== false;


  function selectAmount(amt: number) {
    setSelectedAmount(amt);
    setCustomAmount('');
    setFormVisible(true);
  }

  function validateCard(val: string) {
    const clean = val.replace(/\s/g, '');
    if (clean.length === 16 && clean !== '4242424242424242') {
      setCardError('Please use the test card: 4242 4242 4242 4242');
      setCardOk(false);
    } else if (clean === '4242424242424242') {
      setCardError('');
      setCardOk(true);
    }
  }

  async function handleDonate() {
    if (!finalAmount || !name || !email || !cedula || !cardOk) return;
    setSubmitting(true);
    const sb = createBrowserSupabaseClient();
    await sb.from('donations').insert({
      campaign_id: campaign.id,
      donor_name: name,
      donor_email: email,
      donor_cedula: cedula,
      amount: finalAmount,
      is_mock: true,
    });
    router.push(`/dona/${campaign.slug}/thank-you?amount=${finalAmount}`);
  }

  async function sendChat() {
    if (!chatInput.trim() || chatLoading) return;
    const msg = chatInput.trim();
    setChatInput('');
    setMessages(m => [...m, { role: 'user', text: msg }]);
    setChatLoading(true);
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, campaignId: campaign.id, locale }),
      });
      const { reply } = await res.json();
      setMessages(m => [...m, { role: 'bot', text: reply }]);
    } catch {
      setMessages(m => [...m, { role: 'bot', text: "Sorry, I couldn't process that." }]);
    }
    setChatLoading(false);
  }

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .dona-grid { grid-template-columns: 1fr !important; }
          .chat-window { width: 90vw !important; right: 5vw !important; }
          .amount-grid { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#FAFAFA', fontFamily: "'Sora', sans-serif" }}>
        {/* Banner */}
        <div style={{ position: 'relative', width: '100%', height: 160, overflow: 'hidden' }}>
          {campaign.banner_url && campaign.banner_type !== 'generated'
            ? <Image src={campaign.banner_url} alt="Campaign banner" fill sizes="100vw" quality={95} style={{ objectFit: 'cover' }} priority />
            : <div style={{ width: '100%', height: '100%', background: `linear-gradient(135deg, ${primary} 0%, ${accent} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {campaign.banner_phrase && (
                  <p style={{ fontSize: 22, fontWeight: 700, color: 'white', letterSpacing: '-0.02em', textAlign: 'center', padding: '0 24px', margin: 0, textShadow: '0 1px 4px rgba(0,0,0,0.25)', fontFamily: "'Sora', sans-serif" }}>
                    {campaign.banner_phrase}
                  </p>
                )}
              </div>
          }
          {/* Lang toggle */}
          <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 10 }}>
            <span style={{ fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.8)', background: 'rgba(255,255,255,0.15)', padding: '3px 9px', borderRadius: 20 }}>
              {locale === 'en' ? 'ES' : 'EN'}
            </span>
          </div>
        </div>

        {/* Two-column content */}
        <div className="dona-grid" style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr', maxWidth: 960, margin: '0 auto', background: 'white', border: '0.5px solid #E8E8E5', borderTop: 'none' }}>

          {/* LEFT COLUMN */}
          <div style={{ padding: '18px 22px', borderRight: '0.5px solid #E8E8E5' }}>
            {/* Identity */}
            <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: accent, margin: '0 0 4px' }}>
              {RACE_LABELS[campaign.race_type ?? ''] ?? ''} · {ELECTION_LABELS[campaign.election_date_type ?? ''] ?? 'Election 2028'}
            </p>
            <h1 style={{ fontSize: 20, fontWeight: 700, color: '#2B2F36', letterSpacing: '-0.03em', margin: '0 0 6px' }}>{campaign.candidate_name}</h1>
            {party && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <span style={{ fontSize: 9, fontWeight: 600, background: lightBg, color: primary, padding: '1px 5px', borderRadius: 3 }}>{party.abbr}</span>
                <span style={{ fontSize: 11, color: '#767676' }}>{party.name}</span>
              </div>
            )}

            {/* Intro */}
            <div style={{ background: lightBg, borderLeft: `2px solid ${primary}`, borderRadius: 6, padding: '10px 12px', marginBottom: 12 }}>
              <p style={{ fontSize: 12, color: '#2B2F36', lineHeight: 1.7, margin: 0 }}>
                {intro.length <= 180 || introExpanded ? intro : `${intro.slice(0, 180)}... `}
                {intro.length > 180 && (
                  <span
                    onClick={() => setIntroExpanded(e => !e)}
                    style={{ color: '#A0A09A', fontWeight: 400, cursor: 'pointer', textDecoration: 'none', fontSize: 12 }}
                  >
                    {introExpanded ? 'Read less' : 'Read more'}
                  </span>
                )}
              </p>
            </div>

            {/* Proposals — proposal_overrides takes precedence over ai_summary.proposals */}
            {(campaign.proposal_overrides?.length ? campaign.proposal_overrides : campaign.ai_summary?.proposals)?.length ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
                {(campaign.proposal_overrides?.length ? campaign.proposal_overrides : campaign.ai_summary?.proposals)!.slice(0, 3).map((p, i) => (
                  <div key={i} style={{ background: '#F6F6F4', borderRadius: 7, padding: '9px 11px', border: '0.5px solid #E8E8E5' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                      <div style={{ width: 15, height: 15, borderRadius: '50%', background: primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <span style={{ fontSize: 8, fontWeight: 700, color: 'white' }}>{i + 1}</span>
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: '#2B2F36' }}>{p.title}</span>
                    </div>
                    <p style={{ fontSize: 10, color: '#767676', lineHeight: 1.6, margin: 0, paddingLeft: 22 }}>{p.description}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: 11, color: '#767676', marginBottom: 12 }}>Campaign platform coming soon.</p>
            )}

            {campaign.campaign_platform_url && (
              <button onClick={() => window.open(campaign.campaign_platform_url, '_blank')} style={{ background: 'none', border: 'none', fontSize: 11, fontWeight: 500, color: accent, cursor: 'pointer', fontFamily: 'inherit', padding: 0, marginBottom: 14 }}>
                Read full platform →
              </button>
            )}

            {/* Social links */}
            <div style={{ borderTop: '0.5px solid #E8E8E5', paddingTop: 12, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              {campaign.whatsapp && (
                <a href={`https://wa.me/${campaign.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noopener noreferrer"
                  style={{ background: '#DCFCE7', color: '#166534', fontSize: 10, fontWeight: 600, padding: '5px 10px', borderRadius: 20, textDecoration: 'none' }}>
                  WhatsApp
                </a>
              )}
              {campaign.instagram && (
                <a href={campaign.instagram} target="_blank" rel="noopener noreferrer"
                  style={{ width: 26, height: 26, borderRadius: '50%', background: '#F6F6F4', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#767676" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="#767676" stroke="none"/></svg>
                </a>
              )}
              {campaign.facebook && (
                <a href={campaign.facebook} target="_blank" rel="noopener noreferrer"
                  style={{ width: 26, height: 26, borderRadius: '50%', background: '#F6F6F4', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#767676" strokeWidth="2" strokeLinecap="round"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>
                </a>
              )}
              {campaign.twitter && (
                <a href={campaign.twitter} target="_blank" rel="noopener noreferrer"
                  style={{ width: 26, height: 26, borderRadius: '50%', background: '#F6F6F4', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none' }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#767676" strokeWidth="2" strokeLinecap="round"><path d="M4 4l16 16M4 20L20 4"/></svg>
                </a>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div>
            <div style={{ padding: 18 }}>
              {/* Candidate mini-card */}
              <div style={{ display: 'flex', gap: 10, marginBottom: 14, paddingBottom: 14, borderBottom: '0.5px solid #E8E8E5', alignItems: 'center' }}>
                {campaign.candidate_photo_url && !photoErr
                  ? <div style={{ width: 52, height: 52, borderRadius: '50%', overflow: 'hidden', border: `2px solid ${primary}`, flexShrink: 0 }}>
                      <Image src={campaign.candidate_photo_url} alt={campaign.candidate_name} width={104} height={104} quality={95} style={{ objectFit: 'cover', objectPosition: 'top', width: '100%', height: '100%' }} onError={() => setPhotoErr(true)} />
                    </div>
                  : <div style={{ width: 52, height: 52, borderRadius: '50%', background: lightBg, border: `2px solid ${primary}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: primary }}>{getInitials(campaign.candidate_name)}</span>
                    </div>
                }
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#2B2F36', margin: 0 }}>{campaign.candidate_name}</p>
                  <p style={{ fontSize: 10, color: '#767676', margin: '1px 0 0' }}>{RACE_LABELS[campaign.race_type ?? ''] ?? ''} · {party?.abbr ?? ''}</p>
                </div>
              </div>

              {/* Scorecards */}
              {showScores && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
                  <div style={{ background: '#F6F6F4', borderRadius: 7, padding: '9px 11px', textAlign: 'center' }}>
                    <p style={{ fontSize: 16, fontWeight: 700, color: '#2B2F36', letterSpacing: '-0.02em', margin: 0 }}>{donorCount}</p>
                    <p style={{ fontSize: 9, color: '#767676', margin: '1px 0 0' }}>donors so far</p>
                  </div>
                  <div style={{ background: '#F6F6F4', borderRadius: 7, padding: '9px 11px', textAlign: 'center' }}>
                    <p style={{ fontSize: 16, fontWeight: 700, color: '#2B2F36', letterSpacing: '-0.02em', margin: 0 }}>{daysLeft ?? '—'}</p>
                    <p style={{ fontSize: 9, color: '#767676', margin: '1px 0 0' }}>days left to give</p>
                  </div>
                </div>
              )}

              {/* Trust signal */}
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 12, fontSize: 11, color: '#767676' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
                <span>Secure &amp; JCE-compliant</span>
              </div>

              {/* Amount label */}
              <p style={{ fontSize: 11, fontWeight: 600, color: '#2B2F36', marginBottom: 7 }}>Choose an amount to donate</p>

              {/* Amount grid */}
              <div className="amount-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 7 }}>
                {PRESET_AMOUNTS.map(amt => {
                  const sel = selectedAmount === amt;
                  return (
                    <button key={amt} onClick={() => selectAmount(amt)} style={{
                      border: sel ? `1.5px solid ${accent}` : '0.5px solid #E8E8E5',
                      background: sel ? lightBg : 'white',
                      color: sel ? primary : '#2B2F36',
                      fontWeight: sel ? 600 : 500,
                      fontSize: 12, borderRadius: 6, padding: '8px 4px',
                      cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
                    }}>
                      RD${amt >= 1000 ? `${amt / 1000}K` : amt}
                    </button>
                  );
                })}
              </div>

              {/* Custom amount */}
              <input
                type="text"
                placeholder="Other amount (RD$)"
                value={customAmount}
                onChange={e => { setCustomAmount(e.target.value); setSelectedAmount(null); if (e.target.value) setFormVisible(true); }}
                style={{ width: '100%', height: 34, border: '0.5px solid #E8E8E5', borderRadius: 6, padding: '0 10px', fontSize: 11, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}
              />
            </div>

            {/* Donor form — slides in */}
            <div style={{
              maxHeight: formVisible ? 800 : 0,
              opacity: formVisible ? 1 : 0,
              overflow: 'hidden',
              transition: 'max-height 0.3s ease, opacity 0.3s ease',
            }}>
              <div style={{ padding: '0 18px 16px', borderTop: formVisible ? '0.5px solid #E8E8E5' : 'none' }}>
                <div style={{ height: 16 }} />
                {[
                  { label: 'Full name', value: name, setter: setName, placeholder: 'Your full name', type: 'text' },
                  { label: 'Email', value: email, setter: setEmail, placeholder: 'your@email.com', type: 'email' },
                  { label: 'Cédula', value: cedula, setter: setCedula, placeholder: '000-0000000-0 · required · JCE reporting', type: 'text' },
                ].map(f => (
                  <div key={f.label} style={{ marginBottom: 8 }}>
                    <label style={{ fontSize: 10, fontWeight: 600, color: '#767676', display: 'block', marginBottom: 3 }}>{f.label}</label>
                    <input type={f.type} value={f.value} onChange={e => f.setter(e.target.value)} placeholder={f.placeholder}
                      style={{ width: '100%', height: 32, border: '0.5px solid #E8E8E5', borderRadius: 5, padding: '0 9px', fontSize: 11, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                ))}

                <div style={{ borderTop: '0.5px solid #E8E8E5', margin: '12px 0 10px' }} />

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: '#767676' }}>Payment</span>
                  <span style={{ background: '#F0FDF4', color: '#16A34A', fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 10 }}>✦ Demo mode · test card</span>
                </div>

                <div style={{ marginBottom: 8 }}>
                  <label style={{ fontSize: 10, fontWeight: 600, color: '#767676', display: 'block', marginBottom: 3 }}>Card number</label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={e => setCardNumber(e.target.value)}
                    onBlur={e => validateCard(e.target.value)}
                    placeholder="4242 4242 4242 4242"
                    maxLength={19}
                    style={{ width: '100%', height: 32, border: `0.5px solid ${cardError ? '#C8102E' : cardOk ? '#16A34A' : '#E8E8E5'}`, borderRadius: 5, padding: '0 9px', fontSize: 11, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}
                  />
                  {cardError && <p style={{ fontSize: 9, color: '#C8102E', margin: '2px 0 0' }}>{cardError}</p>}
                  {cardOk && <p style={{ fontSize: 9, color: '#16A34A', margin: '2px 0 0' }}>✓ Card accepted</p>}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 600, color: '#767676', display: 'block', marginBottom: 3 }}>MM/YY</label>
                    <input value={expiry} onChange={e => setExpiry(e.target.value)} placeholder="12/26"
                      style={{ width: '100%', height: 32, border: '0.5px solid #E8E8E5', borderRadius: 5, padding: '0 9px', fontSize: 11, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 600, color: '#767676', display: 'block', marginBottom: 3 }}>CVV</label>
                    <input value={cvv} onChange={e => setCvv(e.target.value)} placeholder="123" maxLength={4}
                      style={{ width: '100%', height: 32, border: '0.5px solid #E8E8E5', borderRadius: 5, padding: '0 9px', fontSize: 11, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                </div>

                <button
                  onClick={handleDonate}
                  disabled={submitting || !finalAmount || !name || !email || !cedula || !cardOk}
                  style={{ width: '100%', height: 40, background: accent, color: 'white', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: submitting ? 'wait' : 'pointer', fontFamily: 'inherit', opacity: (!finalAmount || !name || !email || !cedula || !cardOk) ? 0.6 : 1 }}
                >
                  {submitting ? 'Processing…' : `Donate RD$${finalAmount?.toLocaleString('es-DO') ?? '—'} →`}
                </button>

                <p style={{ fontSize: 9, color: '#767676', textAlign: 'center', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#767676" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  Secured · Transparent · JCE-compliant
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Impulso footer — outside the grid, truly at the bottom */}
        <div style={{ borderTop: '0.5px solid #E8E8E5', padding: '10px 16px', textAlign: 'center', maxWidth: 960, margin: '0 auto', background: 'white' }}>
          <a href="https://impulso.do" target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, textDecoration: 'none', color: '#BBBBBB' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#767676')}
            onMouseLeave={e => (e.currentTarget.style.color = '#BBBBBB')}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="18" rx="2"/>
              <path d="M8 10h8M8 14h5"/>
              <circle cx="17" cy="14" r="2.5" fill="currentColor" stroke="none"/>
            </svg>
            <span style={{ fontSize: 10, fontWeight: 500, letterSpacing: '0.04em', fontFamily: "'Sora', sans-serif" }}>impulso</span>
          </a>
        </div>
      </div>

      {/* Chatbot */}
      {showChatbot && (
        <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 30 }}>
          {chatOpen && (
            <div className="chat-window" style={{ position: 'fixed', bottom: 72, right: 20, width: 280, background: 'white', borderRadius: 12, border: '0.5px solid #E8E8E5', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              {/* Header */}
              <div style={{ background: primary, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                </div>
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: 'white', margin: 0 }}>Campaign Assistant</p>
                  <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.6)', margin: 0 }}>Ask about {campaign.candidate_name}&apos;s platform</p>
                </div>
              </div>
              {/* Messages */}
              <div style={{ background: '#F6F6F4', height: 180, overflowY: 'auto', padding: 10, display: 'flex', flexDirection: 'column', gap: 7 }}>
                {messages.map((m, i) => (
                  <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '88%' }}>
                    <div style={{
                      background: m.role === 'user' ? primary : 'white',
                      color: m.role === 'user' ? 'white' : '#2B2F36',
                      border: m.role === 'user' ? 'none' : '0.5px solid #E8E8E5',
                      borderRadius: m.role === 'user' ? '9px 2px 9px 9px' : '2px 9px 9px 9px',
                      fontSize: 10, padding: '6px 9px', lineHeight: 1.5,
                    }}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div style={{ alignSelf: 'flex-start' }}>
                    <div style={{ background: 'white', border: '0.5px solid #E8E8E5', borderRadius: '2px 9px 9px 9px', padding: '6px 9px', fontSize: 10, color: '#767676' }}>
                      ···
                    </div>
                  </div>
                )}
              </div>
              {/* Disclaimer */}
              <p style={{ fontSize: 9, color: '#767676', textAlign: 'center', padding: '4px 10px 6px', margin: 0, background: 'white' }}>
                Answers based on the official campaign platform only.
              </p>
              {/* Input */}
              <div style={{ padding: '8px 10px', borderTop: '0.5px solid #E8E8E5', background: 'white', display: 'flex', gap: 6 }}>
                <input
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && sendChat()}
                  placeholder="Ask a question…"
                  style={{ flex: 1, height: 30, border: '0.5px solid #E8E8E5', borderRadius: 6, padding: '0 8px', fontSize: 10, fontFamily: 'inherit', outline: 'none' }}
                />
                <button onClick={sendChat} style={{ width: 30, height: 30, background: primary, border: 'none', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M22 2L11 13M22 2L15 22 11 13 2 9l20-7z"/></svg>
                </button>
              </div>
            </div>
          )}
          <button
            onClick={() => setChatOpen(o => !o)}
            style={{ width: 44, height: 44, borderRadius: '50%', background: primary, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          </button>
        </div>
      )}
    </>
  );
}
