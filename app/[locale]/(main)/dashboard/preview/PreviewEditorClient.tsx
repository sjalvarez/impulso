'use client';
import { useState, useEffect } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';
import { generateCampaignSummary } from '@/app/actions/generate-summary';
import { generateColorsFromBanner } from '@/app/actions/generate-colors';

interface Campaign {
  id: string;
  slug: string;
  candidate_name: string;
  page_primary_color?: string;
  page_accent_color?: string;
  page_show_scorecards?: boolean;
  page_show_chatbot?: boolean;
  page_intro_override?: string;
  ai_summary?: { intro?: string } | null;
  campaign_platform_url?: string;
}

interface Props { campaign: Campaign; userId: string; }

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <div onClick={onToggle} style={{ width: 34, height: 18, borderRadius: 9, background: on ? '#16A34A' : '#E8E8E5', cursor: 'pointer', position: 'relative', transition: 'background 0.15s', flexShrink: 0 }}>
      <div style={{ width: 14, height: 14, borderRadius: '50%', background: 'white', position: 'absolute', top: 2, left: on ? 18 : 2, transition: 'left 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
    </div>
  );
}

export default function PreviewEditorClient({ campaign, userId }: Props) {
  const [primary, setPrimary] = useState(campaign.page_primary_color ?? '#0D2B6B');
  const [accent, setAccent] = useState(campaign.page_accent_color ?? '#C8102E');
  const [showScores, setShowScores] = useState(campaign.page_show_scorecards !== false);
  const [showChatbot, setShowChatbot] = useState(campaign.page_show_chatbot !== false);
  const [introText, setIntroText] = useState(campaign.page_intro_override ?? campaign.ai_summary?.intro ?? '');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(false);
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [generatingColors, setGeneratingColors] = useState(false);
  const [pdfUploading, setPdfUploading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(campaign.campaign_platform_url ?? '');

  // iframe key for refresh
  const [iframeKey, setIframeKey] = useState(0);

  // Auto-generate summary if PDF exists but no summary yet
  useEffect(() => {
    if (campaign.campaign_platform_url && !campaign.ai_summary && !introText) {
      setGeneratingSummary(true);
      generateCampaignSummary(campaign.id).then(result => {
        if (result?.intro) setIntroText(result.intro);
        setGeneratingSummary(false);
      }).catch(() => setGeneratingSummary(false));
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave() {
    setSaving(true);
    const sb = createBrowserSupabaseClient();
    await sb.from('campaigns').update({
      page_primary_color: primary,
      page_accent_color: accent,
      page_show_scorecards: showScores,
      page_show_chatbot: showChatbot,
      page_intro_override: introText || null,
      campaign_platform_url: pdfUrl || null,
    }).eq('id', campaign.id);
    setSaving(false);
    setToast(true);
    setIframeKey(k => k + 1);
    setTimeout(() => setToast(false), 2000);
  }

  async function handleGenerateColors() {
    setGeneratingColors(true);
    const { primary: p, accent: a } = await generateColorsFromBanner(campaign.id);
    setPrimary(p);
    setAccent(a);
    setGeneratingColors(false);
  }

  async function handleGenerateSummary() {
    setGeneratingSummary(true);
    const result = await generateCampaignSummary(campaign.id);
    if (result?.intro) setIntroText(result.intro);
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
      const result = await generateCampaignSummary(campaign.id);
      if (result?.intro) setIntroText(result.intro);
      setGeneratingSummary(false);
    }
    setPdfUploading(false);
  }

  const sectionLabel: React.CSSProperties = { fontSize: 11, fontWeight: 600, color: '#2B2F36', marginBottom: 8, display: 'block', fontFamily: 'inherit' };
  const rowStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 };
  const subLabel: React.CSSProperties = { fontSize: 11, color: '#767676', fontFamily: 'inherit' };

  return (
    <>
      <style>{`
        @media (max-width: 768px) {
          .preview-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 24px', fontFamily: "'Sora', sans-serif" }}>
        <div className="preview-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>

          {/* Live preview */}
          <div>
            <p style={{ fontSize: 10, textTransform: 'uppercase', color: '#767676', letterSpacing: '0.07em', marginBottom: 8, fontFamily: 'inherit' }}>Live preview</p>
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
          <div style={{ background: 'white', border: '0.5px solid #E8E8E5', borderRadius: 12, padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Colors */}
            <div>
              <span style={sectionLabel}>Colors</span>
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
              <button onClick={handleGenerateColors} disabled={generatingColors}
                style={{ width: '100%', height: 32, background: '#EEEDFE', color: '#534AB7', border: 'none', borderRadius: 4, fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#7F77DD' }} />
                {generatingColors ? 'Generating…' : 'Re-generate from banner'}
              </button>
            </div>

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
                style={{ marginTop: 4, background: 'none', border: 'none', fontSize: 10, color: '#C8102E', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>
                {generatingSummary ? 'Generating…' : '↺ Regenerate from PDF'}
              </button>
            </div>

            {/* Toggles */}
            <div>
              <span style={sectionLabel}>Show / hide sections</span>
              {[
                { label: 'Donor scorecards', value: showScores, setter: setShowScores },
                { label: 'Campaign chatbot', value: showChatbot, setter: setShowChatbot },
              ].map(t => (
                <div key={t.label} style={rowStyle}>
                  <span style={subLabel}>{t.label}</span>
                  <Toggle on={t.value} onToggle={() => t.setter((v: boolean) => !v)} />
                </div>
              ))}
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

            {/* Save */}
            <button onClick={handleSave} disabled={saving}
              style={{ width: '100%', height: 36, background: '#2B2F36', color: 'white', border: 'none', borderRadius: 4, fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
              {saving ? 'Saving…' : 'Save changes'}
            </button>
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
