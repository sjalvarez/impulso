'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from '@/lib/i18n/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';
import { generateCampaignSummary } from '@/app/actions/generate-summary';
import { generateColorsFromBanner } from '@/app/actions/generate-colors';
import { generateBannerPhrase } from '@/app/actions/generate-banner-phrase';

interface Campaign {
  id: string;
  slug: string;
  candidate_name: string;
  page_primary_color?: string;
  page_accent_color?: string;
  page_show_scorecards?: boolean;
  page_show_chatbot?: boolean;
  page_intro_override?: string;
  ai_summary?: { intro?: string; proposals?: { title: string; description: string }[] } | null;
  proposal_overrides?: { title: string; description: string }[];
  campaign_platform_url?: string;
  banner_phrase?: string;
  race_type?: string;
  party_affiliation?: string;
}

interface Props { campaign: Campaign; userId: string; locale?: string; }

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div onClick={onToggle} style={{ width: 34, height: 18, borderRadius: 9, background: on ? '#16A34A' : '#E8E8E5', cursor: 'pointer', position: 'relative', transition: 'background 0.15s', flexShrink: 0 }}>
      <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'white', position: 'absolute', top: 2, left: on ? 18 : 2, transition: 'left 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </div>
  );
}

export default function PreviewEditorClient({ campaign, userId, locale = 'en' }: Props) {
  const router = useRouter();

  const [primary, setPrimary] = useState(campaign.page_primary_color ?? '#0D2B6B');
  const [accent, setAccent] = useState(campaign.page_accent_color ?? '#C8102E');
  const [showScores, setShowScores] = useState(campaign.page_show_scorecards !== false);
  const [showChatbot, setShowChatbot] = useState(campaign.page_show_chatbot !== false);
  const [introText, setIntroText] = useState(campaign.page_intro_override ?? campaign.ai_summary?.intro ?? '');
  const [savingAppearance, setSavingAppearance] = useState(false);
  const [savingContent, setSavingContent] = useState(false);
  const [toast, setToast] = useState(false);
  const [summaryError, setSummaryError] = useState('');
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [generatingColors, setGeneratingColors] = useState(false);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(campaign.campaign_platform_url ?? '');
  const [iframeKey, setIframeKey] = useState(0);

  // Tab state
  const [activeTab, setActiveTab] = useState<'appearance' | 'content'>('appearance');

  // Proposals state
  const [proposals, setProposals] = useState<{ title: string; description: string }[]>(
    (campaign as Campaign & { proposal_overrides?: { title: string; description: string }[] }).proposal_overrides ??
    (campaign.ai_summary as { proposals?: { title: string; description: string }[] } | null)?.proposals ??
    [{ title: '', description: '' }, { title: '', description: '' }, { title: '', description: '' }]
  );

  // Banner state
  const [bannerPhrase, setBannerPhrase] = useState(campaign.banner_phrase ?? '');
  const [bannerPhraseLoading, setBannerPhraseLoading] = useState(false);
  const [bannerMode, setBannerMode] = useState<'generate' | 'upload'>('generate');
  const [bannerApplying, setBannerApplying] = useState(false);
  const [bannerConfirm, setBannerConfirm] = useState('');

  // Share popover state
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  // Toggle error
  const [toggleError, setToggleError] = useState('');

  // Auto-generate summary if PDF exists but no summary yet
  useEffect(() => {
    if (campaign.campaign_platform_url && !campaign.ai_summary && !introText) {
      setGeneratingSummary(true);
      setSummaryError('');
      generateCampaignSummary(campaign.id, locale).then(result => {
        if (result?._error) { setSummaryError(result._error); } else if (result?.intro) {
          setIntroText(result.intro);
        } else {
          setSummaryError('Could not generate summary — check that your PDF has readable text.');
        }
        setGeneratingSummary(false);
      }).catch((e) => {
        setSummaryError(`Error: ${e?.message ?? 'Unknown error'}`);
        setGeneratingSummary(false);
      });
    }
    // Auto-generate colors if banner exists but no colors saved
    if (!campaign.page_primary_color || !campaign.page_accent_color) {
      setGeneratingColors(true);
      generateColorsFromBanner(campaign.id).then(({ primary: p, accent: a }) => {
        setPrimary(p);
        setAccent(a);
        setGeneratingColors(false);
      }).catch(() => setGeneratingColors(false));
    }
    // Auto-generate banner phrase if candidate name exists but no phrase yet
    if (!bannerPhrase && campaign.candidate_name) {
      setBannerPhraseLoading(true);
      generateBannerPhrase(
        campaign.candidate_name,
        campaign.race_type ?? '',
        campaign.party_affiliation ?? ''
      ).then(p => {
        if (p) setBannerPhrase(p);
        setBannerPhraseLoading(false);
      }).catch(() => setBannerPhraseLoading(false));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Close share popover on outside click
  useEffect(() => {
    function handleMouseDown(e: MouseEvent) {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShareOpen(false);
      }
    }
    if (shareOpen) {
      document.addEventListener('mousedown', handleMouseDown);
    }
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [shareOpen]);

  async function handleSaveAppearance() {
    setSavingAppearance(true);
    const sb = createBrowserSupabaseClient();
    const updateData: Record<string, unknown> = {
      page_primary_color: primary,
      page_accent_color: accent,
    };
    if (bannerMode === 'generate' && bannerPhrase) {
      updateData.banner_phrase = bannerPhrase;
      updateData.banner_type = 'generated';
    }
    await sb.from('campaigns').update(updateData).eq('id', campaign.id);
    setSavingAppearance(false);
    setToast(true);
    setIframeKey(k => k + 1);
    setTimeout(() => setToast(false), 2000);
  }

  async function handleSaveContent() {
    setSavingContent(true);
    const sb = createBrowserSupabaseClient();
    await sb.from('campaigns').update({
      page_intro_override: introText || null,
      proposal_overrides: proposals,
    }).eq('id', campaign.id);
    setSavingContent(false);
    setToast(true);
    setIframeKey(k => k + 1);
    setTimeout(() => setToast(false), 2000);
  }

  async function handleGenerateSummary() {
    setGeneratingSummary(true);
    setSummaryError('');
    try {
      const result = await generateCampaignSummary(campaign.id, locale);
      if (result?._error) { setSummaryError(result._error); } else if (result?.intro) {
        setIntroText(result.intro);
      } else {
        setSummaryError('Could not generate summary — check that your PDF has readable text.');
      }
    } catch (e: unknown) {
      setSummaryError(`Error: ${e instanceof Error ? e.message : 'Unknown error'}`);
    }
    setGeneratingSummary(false);
  }

  async function handlePdfUpload(file: File) {
    setPdfUploading(true);
    const sb = createBrowserSupabaseClient();
    const { data: sessionData } = await sb.auth.getSession();
    if (!sessionData?.session) { setPdfUploading(false); return; }
    const token = sessionData.session.access_token;
    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', 'campaign-assets');
    formData.append('path', `${userId}/platform-${Date.now()}.pdf`);
    const res = await fetch('/api/upload', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: formData });
    const json = await res.json();
    if (json.url) {
      setPdfUrl(json.url);
      await (await import('@/lib/supabase/browser')).createBrowserSupabaseClient()
        .from('campaigns').update({ campaign_platform_url: json.url }).eq('id', campaign.id);
      setGeneratingSummary(true);
      const result = await generateCampaignSummary(campaign.id, locale);
      if (result?.intro) setIntroText(result.intro);
      setGeneratingSummary(false);
    }
    setPdfUploading(false);
  }

  async function handleToggle(field: 'page_show_scorecards' | 'page_show_chatbot', currentValue: boolean) {
    const newValue = !currentValue;
    if (field === 'page_show_scorecards') setShowScores(newValue);
    else setShowChatbot(newValue);
    const sb = createBrowserSupabaseClient();
    const { error } = await sb.from('campaigns').update({ [field]: newValue }).eq('id', campaign.id);
    if (error) {
      if (field === 'page_show_scorecards') setShowScores(currentValue);
      else setShowChatbot(currentValue);
      setToggleError('Failed to save. Please try again.');
      setTimeout(() => setToggleError(''), 3000);
    }
  }

  async function handleSaveBanner() {
    const sb = createBrowserSupabaseClient();
    await sb.from('campaigns').update({ banner_phrase: bannerPhrase, banner_type: 'generated' }).eq('id', campaign.id);
    setIframeKey(k => k + 1);
  }

  async function handleApplyBanner() {
    setBannerApplying(true);
    const sb = createBrowserSupabaseClient();
    await sb.from('campaigns').update({ banner_phrase: bannerPhrase, banner_type: 'generated' }).eq('id', campaign.id);
    setBannerApplying(false);
    setBannerConfirm('✓ Banner updated — live on your donation link.');
    setIframeKey(k => k + 1);
    setTimeout(() => setBannerConfirm(''), 3000);
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(`https://impulso.do/dona/${campaign.slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const sectionLabel: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#2B2F36', marginBottom: 8, display: 'block', fontFamily: 'inherit' };
  const rowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 };
  const subLabel: React.CSSProperties = { fontSize: 11, color: '#767676', fontFamily: 'inherit' };

  const donationUrl = `https://impulso.do/dona/${campaign.slug}`;

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .preview-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 24px', fontFamily: "'Sora', sans-serif" }}>

        {/* Back button */}
        <button
          onClick={() => router.push('/dashboard')}
          style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#767676', fontFamily: 'inherit', padding: 0, marginBottom: 20 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#767676" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Back to dashboard
        </button>

        <div className="preview-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>

          {/* Live preview */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <p style={{ fontSize: 10, textTransform: 'uppercase', color: '#767676', letterSpacing: '0.07em', margin: 0, fontFamily: 'inherit' }}>Live preview</p>
              {/* Share popover */}
              <div ref={shareRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => setShareOpen(o => !o)}
                  style={{ background: 'none', border: '0.5px solid #E8E8E5', borderRadius: 4, padding: '4px 10px', fontSize: 11, color: '#2B2F36', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Share donation link
                </button>
                {shareOpen && (
                  <div style={{ position: 'absolute', top: '100%', right: 0, marginTop: 6, background: 'white', border: '0.5px solid #E8E8E5', borderRadius: 8, padding: 14, width: 280, boxShadow: '0 4px 16px rgba(0,0,0,0.1)', zIndex: 50 }}>
                    <p style={{ fontSize: 10, color: '#767676', margin: '0 0 8px', fontFamily: 'inherit' }}>Donation page URL</p>
                    <div style={{ background: '#F6F6F4', borderRadius: 4, padding: '6px 10px', fontSize: 10, color: '#2B2F36', fontFamily: 'monospace', wordBreak: 'break-all', marginBottom: 10 }}>
                      impulso.do/dona/{campaign.slug}
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={handleCopyLink}
                        style={{ flex: 1, height: 30, background: '#2B2F36', color: 'white', border: 'none', borderRadius: 4, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        {copied ? 'Copied ✓' : 'Copy link'}
                      </button>
                      <button
                        onClick={() => window.open(`https://wa.me/?text=Apoya mi campaña: ${donationUrl}`, '_blank')}
                        style={{ flex: 1, height: 30, background: '#25D366', color: 'white', border: 'none', borderRadius: 4, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        WhatsApp
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div style={{ border: '0.5px solid #E8E8E5', borderRadius: 12, overflow: 'hidden', height: 600 }}>
              <iframe
                key={iframeKey}
                src={`/en/dona/${campaign.slug}`}
                style={{ width: `${100/0.85}%`, height: `${100/0.85}%`, border: 'none', transform: 'scale(0.85)', transformOrigin: 'top left' }}
                title="Donation page preview"
              />
            </div>
          </div>

          {/* Editor panel */}
          <div style={{ background: 'white', border: '0.5px solid #E8E8E5', borderRadius: 12, overflow: 'hidden', display: 'flex', flexDirection: 'column', position: 'sticky', top: 24, maxHeight: 'calc(100vh - 48px)', overflowY: 'auto' }}>

            {/* Tab header */}
            <div style={{ display: 'flex', borderBottom: '0.5px solid #E8E8E5' }}>
              {(['appearance', 'content'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    flex: 1,
                    height: 38,
                    background: 'white',
                    border: 'none',
                    borderBottom: activeTab === tab ? '2.5px solid #2B2F36' : '2.5px solid transparent',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: 500,
                    fontFamily: "'Sora', sans-serif",
                    color: activeTab === tab ? '#2B2F36' : '#767676',
                    textTransform: 'capitalize',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* APPEARANCE TAB */}
              {activeTab === 'appearance' && (
                <>
                  {/* Banner section */}
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={sectionLabel}>Banner</span>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {(['generate', 'upload'] as const).map(mode => (
                          <button
                            key={mode}
                            onClick={() => setBannerMode(mode)}
                            style={{
                              fontSize: 10,
                              padding: '2px 8px',
                              borderRadius: 4,
                              border: 'none',
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                              background: bannerMode === mode ? '#2B2F36' : '#F6F6F4',
                              color: bannerMode === mode ? 'white' : '#767676',
                            }}
                          >
                            {mode === 'generate' ? 'Generate' : 'Upload JPG'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {bannerMode === 'generate' ? (
                      <>
                        <input
                          type="text"
                          value={bannerPhrase}
                          onChange={e => setBannerPhrase(e.target.value)}
                          placeholder="Campaign slogan…"
                          disabled={bannerPhraseLoading}
                          style={{ width: '100%', height: 30, border: '0.5px solid #E8E8E5', borderRadius: 5, padding: '0 8px', fontSize: 11, fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' }}
                        />
                        {/* Live preview box */}
                        <div style={{ height: 40, background: `linear-gradient(135deg, ${primary} 0%, ${accent} 100%)`, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 5, marginBottom: 7 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: 'white', letterSpacing: '-0.01em', textAlign: 'center' }}>
                            {bannerPhraseLoading ? 'Generating…' : bannerPhrase || 'Your slogan here'}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                          <button
                            onClick={() => setIframeKey(k => k + 1)}
                            style={{ flex: 1, height: 30, border: '0.5px solid #E8E8E5', background: 'white', color: '#2B2F36', fontSize: 11, fontWeight: 500, borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit' }}
                          >
                            Preview
                          </button>
                          <button
                            onClick={handleApplyBanner}
                            disabled={bannerApplying || !bannerPhrase}
                            style={{ flex: 1, height: 30, background: '#2B2F36', color: 'white', border: 'none', fontSize: 11, fontWeight: 500, borderRadius: 4, cursor: bannerApplying ? 'wait' : 'pointer', fontFamily: 'inherit' }}
                          >
                            {bannerApplying ? 'Saving…' : 'Use this banner'}
                          </button>
                        </div>
                        {bannerConfirm && <p style={{ fontSize: 10, color: '#16A34A', marginTop: 4, fontFamily: 'inherit' }}>{bannerConfirm}</p>}
                      </>
                    ) : (
                      <label style={{ display: 'block', border: '1.5px dashed #E8E8E5', borderRadius: 6, padding: 12, textAlign: 'center', cursor: 'pointer' }}>
                        <p style={{ fontSize: 11, fontWeight: 500, color: '#C8102E', margin: '0 0 2px', fontFamily: 'inherit' }}>Upload JPG / PNG</p>
                        <p style={{ fontSize: 10, color: '#767676', margin: 0, fontFamily: 'inherit' }}>Max 5MB</p>
                        <input type="file" accept=".jpg,.jpeg,.png" style={{ display: 'none' }} onChange={() => {}} />
                      </label>
                    )}
                  </div>

                  {/* Colors */}
                  <div>
                    <span style={sectionLabel}>Colors</span>
                    <p style={{ fontSize: 10, color: '#767676', fontStyle: 'italic', margin: '0 0 10px', fontFamily: 'inherit' }}>Detected from your campaign materials</p>
                    {[
                      { label: 'Primary color', value: primary, setter: setPrimary },
                      { label: 'Accent color', value: accent, setter: setAccent },
                    ].map(c => (
                      <div key={c.label} style={{ ...rowStyle }}>
                        <span style={subLabel}>{c.label}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <div style={{ position: 'relative', width: 26, height: 26 }}>
                            <div style={{ width: 26, height: 26, borderRadius: 5, background: c.value, border: '0.5px solid #E8E8E5', cursor: 'pointer' }} />
                            <input type="color" value={c.value} onChange={e => c.setter(e.target.value)}
                              style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
                          </div>
                          <span style={{ fontSize: 10, color: '#767676', fontFamily: 'monospace' }}>{c.value}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Toggles */}
                  <div>
                    <span style={sectionLabel}>Show / hide sections</span>
                    <div style={rowStyle}>
                      <span style={subLabel}>Donor scorecards</span>
                      <Toggle on={showScores} onToggle={() => handleToggle('page_show_scorecards', showScores)} />
                    </div>
                    <div style={rowStyle}>
                      <span style={subLabel}>Campaign chatbot</span>
                      <Toggle on={showChatbot} onToggle={() => handleToggle('page_show_chatbot', showChatbot)} />
                    </div>
                    {toggleError && (
                      <p style={{ fontSize: 10, color: '#C8102E', margin: '4px 0 0', fontFamily: 'inherit' }}>{toggleError}</p>
                    )}
                  </div>

                  {/* Save appearance */}
                  <div>
                    <button onClick={handleSaveAppearance} disabled={savingAppearance}
                      style={{ width: '100%', height: 36, background: '#2B2F36', color: 'white', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {savingAppearance ? 'Saving…' : 'Save appearance'}
                    </button>
                    <p style={{ fontSize: 9, color: '#767676', textAlign: 'center', marginTop: 4, fontFamily: 'inherit' }}>Toggles save automatically</p>
                  </div>
                </>
              )}

              {/* CONTENT TAB */}
              {activeTab === 'content' && (
                <>
                  {/* Intro text */}
                  <div>
                    <span style={sectionLabel}>Edit intro text</span>
                    <p style={{ fontSize: 10, color: '#767676', marginBottom: 6, fontFamily: 'inherit' }}>Overrides the AI-generated text</p>
                    <textarea
                      value={introText}
                      onChange={e => setIntroText(e.target.value)}
                      style={{ width: '100%', border: '0.5px solid #E8E8E5', borderRadius: 6, padding: '8px 10px', fontSize: 11, fontFamily: 'inherit', minHeight: 64, lineHeight: 1.6, resize: 'vertical', boxSizing: 'border-box', outline: 'none' }}
                    />
                    <button onClick={handleGenerateSummary} disabled={generatingSummary}
                      style={{ marginTop: 4, background: 'none', border: 'none', fontSize: 10, color: '#C8102E', cursor: generatingSummary ? 'wait' : 'pointer', fontFamily: 'inherit', padding: 0 }}>
                      {generatingSummary ? '⏳ Generating…' : '↺ Regenerate from PDF'}
                    </button>
                    {summaryError && (
                      <p style={{ fontSize: 10, color: '#C8102E', marginTop: 4, fontFamily: 'inherit' }}>{summaryError}</p>
                    )}
                    {!campaign.campaign_platform_url && !pdfUrl && (
                      <p style={{ fontSize: 10, color: '#767676', marginTop: 4, fontFamily: 'inherit' }}>Upload a PDF below first.</p>
                    )}
                  </div>

                  {/* Proposals */}
                  <div>
                    <span style={sectionLabel}>Top 3 proposals</span>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                      {proposals.map((p, i) => (
                        <div key={i} style={{ padding: '8px 0', borderBottom: i < 2 ? '0.5px solid #E8E8E5' : 'none' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                            <div style={{ width: 14, height: 14, borderRadius: '50%', background: primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <span style={{ fontSize: 7, fontWeight: 700, color: 'white' }}>{i + 1}</span>
                            </div>
                            <input
                              value={p.title}
                              onChange={e => setProposals(ps => ps.map((x, j) => j === i ? { ...x, title: e.target.value } : x))}
                              placeholder={`Proposal ${i + 1} title`}
                              style={{ flex: 1, height: 26, border: '0.5px solid #E8E8E5', borderRadius: 4, padding: '0 7px', fontSize: 10, fontWeight: 600, color: '#2B2F36', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                            />
                          </div>
                          <input
                            value={p.description}
                            onChange={e => setProposals(ps => ps.map((x, j) => j === i ? { ...x, description: e.target.value } : x))}
                            placeholder="Short description…"
                            style={{ width: 'calc(100% - 20px)', marginLeft: 20, height: 26, border: '0.5px solid #E8E8E5', borderRadius: 4, padding: '0 7px', fontSize: 10, color: '#767676', fontFamily: 'inherit', outline: 'none', boxSizing: 'border-box' }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Save content */}
                  <div>
                    <button onClick={handleSaveContent} disabled={savingContent}
                      style={{ width: '100%', height: 36, background: '#2B2F36', color: 'white', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {savingContent ? 'Saving…' : 'Save content'}
                    </button>
                  </div>

                  {/* PDF */}
                  <div>
                    <span style={sectionLabel}>Campaign platform PDF</span>
                    {pdfUrl && (
                      <div style={{ background: '#F6F6F4', borderRadius: 6, padding: '7px 10px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#767676" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        <span style={{ fontSize: 10, color: '#767676', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>platform.pdf</span>
                        <span style={{ background: '#DCFCE7', color: '#166534', fontSize: 9, fontWeight: 600, borderRadius: 10, padding: '2px 6px' }}>Active</span>
                      </div>
                    )}
                    <label style={{ display: 'block', border: '1.5px dashed #E8E8E5', borderRadius: 6, padding: 12, textAlign: 'center', cursor: 'pointer' }}>
                      <p style={{ fontSize: 11, fontWeight: 500, color: '#C8102E', margin: '0 0 2px', fontFamily: 'inherit' }}>
                        {pdfUploading ? 'Uploading…' : 'Upload new PDF'}
                      </p>
                      <p style={{ fontSize: 10, color: '#767676', margin: '0 0 2px', fontFamily: 'inherit' }}>Max 5MB</p>
                      <p style={{ fontSize: 9, color: '#767676', margin: 0, fontFamily: 'inherit' }}>Replacing this will regenerate the AI summary and chatbot</p>
                      <input type="file" accept=".pdf" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handlePdfUpload(f); }} />
                    </label>
                  </div>
                </>
              )}

            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#16A34A', color: 'white', padding: '10px 18px', borderRadius: 8, fontSize: 12, fontWeight: 500, zIndex: 100 }}>
          Changes saved.
        </div>
      )}
    </>
  );
}
