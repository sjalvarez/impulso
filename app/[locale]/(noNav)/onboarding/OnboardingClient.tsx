'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from '@/lib/i18n/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';
import PartySelector from '@/components/ui/PartySelector';
import { JCE_PARTIES } from '@/lib/jce-parties';
import { getElectionInfo, getElectionDateType, getDaysUntil, type ElectionCategory } from '@/lib/jce-calendar';

interface Props {
  locale: string;
  userId: string;
  userName: string;
}

interface FormState {
  // Step 1
  fullName: string;
  cedula: string;
  cedulaError: string;
  party: string;
  raceType: string;
  electionCategory: string;
  // Step 2
  campaignName: string;
  campaignNameEditing: boolean;
  fundraisingGoal: string;
  pdfFile: File | null;
  pdfUrl: string;
  pdfUploading: boolean;
  bannerFile: File | null;
  bannerUrl: string;
  bannerUploading: boolean;
  photoFile: File | null;
  photoUrl: string;
  photoUploading: boolean;
  whatsapp: string;
  instagram: string;
  facebook: string;
  twitter: string;
  // Step 3
  jceNumber: string;
  jceVerifying: boolean;
  jceVerified: boolean;
  jceData: Record<string, string> | null;
  jceError: string;
  jceSkipped: boolean;
  checkbox1: boolean;
  checkbox2: boolean;
  // UI
  showSkipModal: boolean;
  submitting: boolean;
  successToast: boolean;
}

const RACE_LABELS: Record<string, string> = {
  president: 'Presidente/a',
  senator: 'Senador/a',
  deputy: 'Diputado/a',
  mayor: 'Alcalde/a',
  district_director: 'Director/a Distrital',
};

const inputStyle: React.CSSProperties = {
  border: '1px solid #E8E8E5',
  borderRadius: '6px',
  padding: '9px 12px',
  fontSize: '13px',
  width: '100%',
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
  color: '#2B2F36',
  background: 'white',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12px',
  fontWeight: 600,
  color: '#2B2F36',
  marginBottom: '6px',
  letterSpacing: '-0.01em',
};

const fieldStyle: React.CSSProperties = { marginBottom: '20px' };

// ─── Party logo helper ──────────────────────────────────────────────────────
function PartyLogoInline({ id, abbr }: { id: string; abbr: string }) {
  const [err, setErr] = useState(false);
  if (err) return (
    <span style={{ fontSize: '11px', fontWeight: 700, color: '#2B2F36', background: '#F6F6F4', borderRadius: '3px', padding: '1px 4px' }}>{abbr.slice(0, 3)}</span>
  );
  return (
    <img
      src={`/images/parties/${id}.png`}
      alt={abbr}
      width={20}
      height={20}
      style={{ objectFit: 'contain', verticalAlign: 'middle' }}
      onError={() => setErr(true)}
    />
  );
}

// ─── Progress indicator ─────────────────────────────────────────────────────
function ProgressIndicator({ step }: { step: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px' }}>
      {[1, 2, 3, 4].map((s, i) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center', flex: i < 3 ? 1 : undefined }}>
          <div style={{
            width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: 600,
            background: s < step ? '#2B2F36' : s === step ? '#C8102E' : 'white',
            border: s < step ? 'none' : s === step ? 'none' : '1px solid #E8E8E5',
            color: s <= step ? 'white' : '#767676',
          }}>
            {s < step ? '✓' : s}
          </div>
          {i < 3 && (
            <div className="ob-progress-line" style={{ flex: 1, height: '1px', background: '#E8E8E5' }} />
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Custom checkbox ────────────────────────────────────────────────────────
function CustomCheckbox({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <div onClick={() => onChange(!checked)} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', cursor: 'pointer', marginBottom: '12px' }}>
      <div style={{
        width: '18px', height: '18px', minWidth: '18px', borderRadius: '3px', marginTop: '2px',
        border: checked ? '1.5px solid #C8102E' : '1.5px solid #E8E8E5',
        background: checked ? '#C8102E' : 'white',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {checked && (
          <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
            <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </div>
      <span style={{ fontSize: '12px', color: '#2B2F36', lineHeight: 1.55 }}>{children}</span>
    </div>
  );
}

// ─── File upload areas ──────────────────────────────────────────────────────
function FileDropArea({
  accept, maxMB, dragText, maxSizeLabel, fileName, uploading, uploaded,
  onFile,
}: {
  accept: string; maxMB: number; dragText: string; maxSizeLabel: string;
  fileName?: string; uploading: boolean; uploaded: boolean; onFile: (f: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  function handle(file: File) {
    if (file.size > maxMB * 1024 * 1024) { alert(`File must be under ${maxMB}MB`); return; }
    onFile(file);
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handle(f); }}
      style={{
        border: `1.5px dashed ${dragOver ? '#C8102E' : '#E8E8E5'}`,
        borderRadius: '8px', padding: '20px', textAlign: 'center', cursor: 'pointer',
        background: dragOver ? '#FFF5F5' : 'white',
      }}
    >
      {uploading ? (
        <p style={{ fontSize: '13px', color: '#767676', margin: 0 }}>Uploading...</p>
      ) : uploaded && fileName ? (
        <p style={{ fontSize: '13px', color: '#16A34A', margin: 0 }}>✓ {fileName}</p>
      ) : (
        <>
          <p style={{ fontSize: '13px', color: '#767676', margin: 0 }}>{dragText}</p>
          <p style={{ fontSize: '11px', color: '#767676', margin: '4px 0 0 0' }}>{maxSizeLabel}</p>
        </>
      )}
      <input ref={inputRef} type="file" accept={accept} style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f); }} />
    </div>
  );
}

// ─── STEP 1 ─────────────────────────────────────────────────────────────────
function Step1({ state, setState }: { state: FormState; setState: React.Dispatch<React.SetStateAction<FormState>> }) {
  function update(patch: Partial<FormState>) { setState(s => ({ ...s, ...patch })); }

  function validateCedula(val: string) {
    if (!val) { update({ cedulaError: '' }); return; }
    update({ cedulaError: /^\d{3}-\d{7}-\d{1}$/.test(val) ? '' : 'Invalid format. Use 000-0000000-0' });
  }

  const showDeadline = state.raceType !== '' && state.electionCategory !== '';
  const electionInfo = showDeadline ? getElectionInfo(state.electionCategory as ElectionCategory, state.raceType) : null;
  const daysUntilFundraising = electionInfo ? getDaysUntil(electionInfo.fundraisingDeadline) : null;

  return (
    <div>
      {/* Full name */}
      <div style={fieldStyle}>
        <label style={labelStyle}>Full name</label>
        <input
          style={inputStyle}
          value={state.fullName}
          onChange={(e) => update({ fullName: e.target.value })}
          placeholder="Your full name"
        />
      </div>

      {/* Cédula */}
      <div style={fieldStyle}>
        <label style={labelStyle}>Cédula</label>
        <input
          style={{ ...inputStyle, borderColor: state.cedulaError ? '#C8102E' : '#E8E8E5' }}
          value={state.cedula}
          onChange={(e) => update({ cedula: e.target.value })}
          onBlur={(e) => validateCedula(e.target.value)}
          placeholder="000-0000000-0"
        />
        <p style={{ fontSize: '11px', color: state.cedulaError ? '#C8102E' : '#767676', marginTop: '4px', marginBottom: 0 }}>
          {state.cedulaError || 'Format: 000-0000000-0'}
        </p>
      </div>

      {/* Party */}
      <div style={fieldStyle}>
        <label style={labelStyle}>Party affiliation</label>
        <PartySelector value={state.party} onChange={(id) => update({ party: id })} />
        <p style={{ fontSize: '10px', color: '#767676', marginTop: '4px', marginBottom: 0 }}>
          Source: JCE Dirección de Partidos Políticos, updated February 26, 2026
        </p>
      </div>

      {/* Race type */}
      <div style={fieldStyle}>
        <label style={labelStyle}>Running for</label>
        <select
          style={{ ...inputStyle, height: '38px', paddingTop: 0, paddingBottom: 0 }}
          value={state.raceType}
          onChange={(e) => update({ raceType: e.target.value })}
        >
          <option value="">Select race type…</option>
          <option value="president">President (Presidente/a)</option>
          <option value="senator">Senator (Senador/a)</option>
          <option value="deputy">Deputy (Diputado/a)</option>
          <option value="mayor">Mayor (Alcalde/a)</option>
          <option value="district_director">District Director (Director/a Distrital)</option>
        </select>
      </div>

      {/* Election type */}
      <hr style={{ border: 'none', borderTop: '1px solid #E8E8E5', margin: '20px 0' }} />
      <div style={fieldStyle}>
        <p style={{ fontSize: '13px', fontWeight: 500, color: '#2B2F36', marginBottom: '10px', marginTop: 0 }}>
          Are you running in a primary or general election?
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {([
            { value: 'primary', label: 'Primary election (Primarias)', sub: 'October 3, 2027 · Internal party candidate selection' },
            { value: 'general', label: 'General election', sub: 'Municipal: Feb 20, 2028 · Presidential/Congressional: May 21, 2028' },
          ] as const).map((opt) => {
            const selected = state.electionCategory === opt.value;
            return (
              <div
                key={opt.value}
                onClick={() => update({ electionCategory: opt.value })}
                style={{
                  padding: '14px 16px', borderRadius: '8px', cursor: 'pointer',
                  display: 'flex', alignItems: 'flex-start', gap: '12px',
                  border: selected ? '1.5px solid #C8102E' : '0.5px solid #E8E8E5',
                  background: selected ? '#FFF5F5' : 'white',
                }}
              >
                <div style={{
                  width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0, marginTop: '2px',
                  border: selected ? '2px solid #C8102E' : '2px solid #D1D5DB',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {selected && <div style={{ width: '8px', height: '8px', background: '#C8102E', borderRadius: '50%', margin: '2px' }} />}
                </div>
                <div>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#2B2F36', margin: 0 }}>{opt.label}</p>
                  <p style={{ fontSize: '11px', color: '#767676', marginTop: '2px', marginBottom: 0 }}>{opt.sub}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Deadline callout */}
      {showDeadline && electionInfo && daysUntilFundraising !== null && (
        <>
          <div style={{ background: '#F6F6F4', borderRadius: '8px', padding: '14px 16px', marginTop: '12px', display: 'flex', gap: '8px' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '10px', textTransform: 'uppercase', color: '#767676', letterSpacing: '0.08em', margin: '0 0 2px 0' }}>Election date</p>
              <p style={{ fontSize: '16px', fontWeight: 500, color: '#2B2F36', margin: 0 }}>
                {electionInfo.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '10px', textTransform: 'uppercase', color: '#767676', letterSpacing: '0.08em', margin: '0 0 2px 0' }}>Last day to raise funds</p>
              <p style={{ fontSize: '16px', fontWeight: 500, color: '#2B2F36', margin: 0 }}>
                {electionInfo.fundraisingDeadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
              <p style={{ fontSize: '11px', color: '#767676', marginTop: '2px', marginBottom: 0 }}>{daysUntilFundraising} days from today</p>
            </div>
          </div>
          <div style={{ background: '#F6F6F4', borderRadius: '6px', padding: '10px 14px', marginTop: '8px', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <svg width="14" height="14" viewBox="0 0 14 14" style={{ flexShrink: 0, marginTop: '2px' }}>
              <circle cx="7" cy="7" r="6" stroke="#767676" strokeWidth="1" fill="none" />
              <text x="7" y="11" textAnchor="middle" fontSize="9" fill="#767676" fontFamily="sans-serif">i</text>
            </svg>
            <p style={{ fontSize: '11px', color: '#767676', lineHeight: 1.6, margin: 0 }}>
              Election dates are officially set by the Junta Central Electoral (JCE) and cannot be modified. Impulso automatically calculates your deadline based on the{' '}
              <a href="https://jce.gob.do" target="_blank" rel="noopener noreferrer" style={{ color: '#C8102E', textDecoration: 'none' }}>JCE Electoral Calendar 2028</a>.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

// ─── STEP 2 ─────────────────────────────────────────────────────────────────
function Step2({ state, setState, userId }: { state: FormState; setState: React.Dispatch<React.SetStateAction<FormState>>; userId: string }) {
  function update(patch: Partial<FormState>) { setState(s => ({ ...s, ...patch })); }

  // Auto-generate campaign name
  useEffect(() => {
    if (state.campaignNameEditing) return;
    const party = JCE_PARTIES.find(p => p.id === state.party);
    const raceLabel = RACE_LABELS[state.raceType] ?? '';
    const electionYear = state.electionCategory === 'primary' ? '2027' : '2028';
    if (state.fullName && raceLabel && party) {
      update({ campaignName: `${state.fullName} para ${raceLabel} · ${party.abbr} · ${electionYear}` });
    }
  }, [state.fullName, state.raceType, state.party, state.electionCategory, state.campaignNameEditing]);

  // Format goal display
  const [goalDisplay, setGoalDisplay] = useState(state.fundraisingGoal);

  function handleGoalBlur() {
    const raw = goalDisplay.replace(/,/g, '');
    const num = parseInt(raw, 10);
    if (!isNaN(num)) {
      const formatted = num.toLocaleString('en-US');
      setGoalDisplay(formatted);
      update({ fundraisingGoal: formatted });
    }
  }

  async function uploadFile(file: File, bucket: string, path: string): Promise<string> {
    const sb = createBrowserSupabaseClient();
    const { data: sessionData } = await sb.auth.getSession();
    if (!sessionData?.session) throw new Error('Not authenticated — please refresh and try again');
    const token = sessionData.session.access_token;

    const formData = new FormData();
    formData.append('file', file);
    formData.append('bucket', bucket);
    formData.append('path', path);

    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });

    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? 'Upload failed');
    return json.url;
  }

  async function handlePdf(file: File) {
    update({ pdfFile: file, pdfUploading: true });
    try {
      const url = await uploadFile(file, 'campaign-assets', `${userId}/platform-${Date.now()}.pdf`);
      update({ pdfUrl: url, pdfUploading: false });
    } catch (e: unknown) {
      alert('PDF upload failed: ' + (e instanceof Error ? e.message : String(e)));
      update({ pdfUploading: false });
    }
  }

  async function handleBanner(file: File) {
    update({ bannerFile: file, bannerUploading: true });
    try {
      const url = await uploadFile(file, 'campaign-assets', `${userId}/banner-${Date.now()}.jpg`);
      update({ bannerUrl: url, bannerUploading: false });
    } catch {
      alert('Banner upload failed. Please try again.');
      update({ bannerUploading: false });
    }
  }

  async function handlePhoto(file: File) {
    update({ photoFile: file, photoUploading: true });
    try {
      const url = await uploadFile(file, 'candidate-photos', `${userId}/photo-${Date.now()}.jpg`);
      update({ photoUrl: url, photoUploading: false });
    } catch {
      alert('Photo upload failed. Please try again.');
      update({ photoUploading: false });
    }
  }

  const photoPreviewUrl = state.photoFile ? URL.createObjectURL(state.photoFile) : null;
  const bannerPreviewUrl = state.bannerFile ? URL.createObjectURL(state.bannerFile) : null;

  return (
    <div>
      {/* Campaign name */}
      <div style={fieldStyle}>
        <label style={labelStyle}>Campaign name</label>
        {!state.campaignNameEditing ? (
          <div style={{ background: '#F6F6F4', borderRadius: '8px', padding: '12px 14px', border: '0.5px solid #E8E8E5', fontSize: '13px', color: '#2B2F36' }}>
            {state.campaignName || '—'}
          </div>
        ) : (
          <input
            style={inputStyle}
            value={state.campaignName}
            onChange={(e) => update({ campaignName: e.target.value })}
          />
        )}
        <div style={{ marginTop: '6px', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <span
            onClick={() => update({ campaignNameEditing: !state.campaignNameEditing })}
            style={{ fontSize: '11px', color: '#C8102E', cursor: 'pointer' }}
          >
            {state.campaignNameEditing ? 'Done editing' : 'Edit name'}
          </span>
          <p style={{ fontSize: '11px', color: '#767676', margin: 0 }}>Your donation link will be generated automatically from this name.</p>
        </div>
      </div>

      {/* Fundraising goal */}
      <div style={fieldStyle}>
        <label style={labelStyle}>Fundraising goal (RD$)</label>
        <input
          style={inputStyle}
          type="text"
          value={goalDisplay}
          onChange={(e) => setGoalDisplay(e.target.value)}
          onBlur={handleGoalBlur}
          placeholder="50,000"
        />
        <p style={{ fontSize: '11px', color: '#767676', marginTop: '4px', marginBottom: 0 }}>
          Set a realistic goal for your campaign period. You can update this from your dashboard at any time.
        </p>
      </div>

      {/* Campaign platform PDF */}
      <div style={fieldStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
          <span style={{ background: '#EEEDFE', color: '#534AB7', fontSize: '10px', padding: '2px 7px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#7F77DD', display: 'inline-block' }} />
            AI-powered
          </span>
          <label style={{ ...labelStyle, marginBottom: 0 }}>Upload your campaign platform</label>
        </div>
        <p style={{ fontSize: '11px', color: '#767676', marginBottom: '8px', marginTop: 0 }}>
          Upload your official campaign platform document (PDF). We use it to describe your proposals to donors on your donation page, generate personalized outreach emails and call scripts, and design your page visuals to match your campaign identity.
        </p>
        <FileDropArea
          accept=".pdf"
          maxMB={5}
          dragText="Drag & drop your PDF here, or click to browse"
          maxSizeLabel="PDF only · Max 5MB"
          fileName={state.pdfFile?.name}
          uploading={state.pdfUploading}
          uploaded={state.pdfUrl !== ''}
          onFile={handlePdf}
        />
      </div>

      {/* Campaign banner */}
      <div style={fieldStyle}>
        <label style={labelStyle}>Campaign banner (optional)</label>
        {bannerPreviewUrl ? (
          <div style={{ marginBottom: '8px' }}>
            <img src={bannerPreviewUrl} alt="Banner preview" style={{ width: '100%', height: '120px', objectFit: 'cover', borderRadius: '6px' }} />
          </div>
        ) : null}
        <FileDropArea
          accept="image/jpeg,image/png"
          maxMB={5}
          dragText="Drag & drop your banner here, or click to browse"
          maxSizeLabel="JPG or PNG · Max 5MB · 16:9 recommended"
          fileName={state.bannerFile?.name}
          uploading={state.bannerUploading}
          uploaded={state.bannerUrl !== ''}
          onFile={handleBanner}
        />
      </div>

      {/* Candidate photo */}
      <div style={fieldStyle}>
        <label style={labelStyle}>Candidate photo</label>
        <p style={{ fontSize: '11px', color: '#767676', marginBottom: '8px', marginTop: 0 }}>
          Required. This photo will be shown to donors when they visit your donation page.
        </p>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
          <div style={{ width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '1px solid #E8E8E5', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F6F6F4' }}>
            {photoPreviewUrl ? (
              <img src={photoPreviewUrl} alt="Photo preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '11px', color: '#767676' }}>Preview</span>
            )}
          </div>
          <div style={{ flex: 1 }}>
            <FileDropArea
              accept="image/jpeg,image/png"
              maxMB={2}
              dragText="Drag & drop your photo here, or click to browse"
              maxSizeLabel="JPG or PNG · Max 2MB"
              fileName={state.photoFile?.name}
              uploading={state.photoUploading}
              uploaded={state.photoUrl !== ''}
              onFile={handlePhoto}
            />
          </div>
        </div>
      </div>

      {/* Social / Contact */}
      <hr style={{ border: 'none', borderTop: '1px solid #E8E8E5', margin: '20px 0' }} />
      <div style={fieldStyle}>
        <label style={labelStyle}>Campaign contact</label>
        <p style={{ fontSize: '11px', color: '#767676', marginBottom: '12px', marginTop: 0 }}>
          How can donors and supporters reach your team?
        </p>
        {/* WhatsApp */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ width: '36px', height: '36px', background: '#F6F6F4', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" stroke="#767676" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <input style={{ ...inputStyle, flex: 1 }} placeholder="+1 809 000 0000" value={state.whatsapp} onChange={(e) => update({ whatsapp: e.target.value })} />
          <span style={{ fontSize: '10px', color: '#C8102E', fontWeight: 600, whiteSpace: 'nowrap' }}>Required</span>
        </div>
        {/* Instagram */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ width: '36px', height: '36px', background: '#F6F6F4', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" stroke="#767676" strokeWidth="2" />
              <circle cx="12" cy="12" r="4" stroke="#767676" strokeWidth="2" />
              <circle cx="17.5" cy="6.5" r="1" fill="#767676" />
            </svg>
          </div>
          <input style={{ ...inputStyle, flex: 1 }} placeholder="instagram.com/yourcampaign" value={state.instagram} onChange={(e) => update({ instagram: e.target.value })} />
        </div>
        {/* Facebook */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ width: '36px', height: '36px', background: '#F6F6F4', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" stroke="#767676" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <input style={{ ...inputStyle, flex: 1 }} placeholder="facebook.com/yourcampaign" value={state.facebook} onChange={(e) => update({ facebook: e.target.value })} />
        </div>
        {/* X / Twitter */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '10px' }}>
          <div style={{ width: '36px', height: '36px', background: '#F6F6F4', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M4 4l16 16M4 20L20 4" stroke="#767676" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <input style={{ ...inputStyle, flex: 1 }} placeholder="x.com/yourcampaign" value={state.twitter} onChange={(e) => update({ twitter: e.target.value })} />
        </div>
        <p style={{ fontSize: '11px', color: '#767676', marginTop: '4px', marginBottom: 0 }}>
          WhatsApp is required. Social links are optional but help donors connect with your campaign.
        </p>
      </div>
    </div>
  );
}

// ─── STEP 3 ─────────────────────────────────────────────────────────────────
function Step3({ state, setState }: { state: FormState; setState: React.Dispatch<React.SetStateAction<FormState>> }) {
  function update(patch: Partial<FormState>) { setState(s => ({ ...s, ...patch })); }
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleJceBlur(value: string) {
    if (!value.trim()) { update({ jceVerifying: false, jceVerified: false, jceError: '' }); return; }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      update({ jceVerifying: true });
      const sb = createBrowserSupabaseClient();
      const { data } = await sb.from('jce_registered_campaigns').select('*').eq('jce_number', value.trim()).single();
      if (data) {
        update({ jceVerifying: false, jceVerified: true, jceData: data as Record<string, string>, jceError: '' });
      } else {
        update({ jceVerifying: false, jceVerified: false, jceData: null, jceError: 'This number was not found in our JCE registry. Please verify your registration or contact us at hello@impulso.do' });
      }
    }, 200);
  }

  const borderColor = state.jceVerified ? '#16A34A' : state.jceError ? '#C8102E' : '#E8E8E5';

  return (
    <div>
      {/* Info box */}
      <div style={{ background: '#FFF5F5', borderLeft: '3px solid #C8102E', borderRadius: '0 8px 8px 0', padding: '14px 16px', marginBottom: '20px', fontSize: '13px', color: '#2B2F36', lineHeight: 1.6 }}>
        Impulso only works with campaigns officially registered with the Junta Central Electoral (JCE). Enter your registration number — we'll verify it instantly against our registry.
      </div>

      {/* JCE number field */}
      <div style={fieldStyle}>
        <label style={labelStyle}>JCE registration number</label>
        <input
          style={{ ...inputStyle, borderColor }}
          value={state.jceNumber}
          onChange={(e) => update({ jceNumber: e.target.value, jceVerified: false, jceError: '' })}
          onBlur={(e) => handleJceBlur(e.target.value)}
          placeholder="e.g. JCE-2025-00123"
        />
        {state.jceVerifying && (
          <p style={{ fontSize: '11px', color: '#767676', marginTop: '6px', marginBottom: 0 }}>Verifying...</p>
        )}
        {state.jceVerified && state.jceData && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <circle cx="6" cy="6" r="5" fill="#16A34A" />
              <path d="M3.5 6L5.5 8L8.5 4.5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span style={{ fontSize: '12px', color: '#16A34A' }}>
              Verified — {state.jceData.candidate_name ?? ''}{state.jceData.race_type ? ` · ${state.jceData.race_type}` : ''}{state.jceData.municipality ? ` · ${state.jceData.municipality}` : ''}
            </span>
          </div>
        )}
        {state.jceError && (
          <p style={{ fontSize: '12px', color: '#C8102E', marginTop: '6px', marginBottom: 0 }}>{state.jceError}</p>
        )}
      </div>

      {/* Checkboxes */}
      <div style={{ marginTop: '20px' }}>
        <CustomCheckbox checked={state.checkbox1} onChange={(v) => update({ checkbox1: v })}>
          I confirm this campaign is officially registered with the Junta Central Electoral and complies with Ley 33-18 de Partidos, Agrupaciones y Movimientos Políticos.
        </CustomCheckbox>
        <CustomCheckbox checked={state.checkbox2} onChange={(v) => update({ checkbox2: v })}>
          I understand that all donor contributions will be reported to the JCE and must comply with Article 63 of Ley 33-18.
        </CustomCheckbox>
      </div>
    </div>
  );
}

// ─── STEP 4 ─────────────────────────────────────────────────────────────────
function Step4({ state }: { state: FormState }) {
  const party = JCE_PARTIES.find(p => p.id === state.party);
  const raceLabel = RACE_LABELS[state.raceType] ?? state.raceType;
  const electionInfo = (state.raceType && state.electionCategory)
    ? getElectionInfo(state.electionCategory as ElectionCategory, state.raceType)
    : null;
  const daysUntilFundraising = electionInfo ? getDaysUntil(electionInfo.fundraisingDeadline) : null;

  const electionDisplay = state.electionCategory === 'primary'
    ? `Primary · ${electionInfo?.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) ?? ''}`
    : `${(state.raceType === 'mayor' || state.raceType === 'district_director') ? 'Municipal' : 'General'} · ${electionInfo?.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) ?? ''}`;

  function ReviewRow({ label, value, last = false }: { label: string; value: React.ReactNode; last?: boolean }) {
    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: last ? 'none' : '0.5px solid #F0F0F0' }}>
        <span style={{ fontSize: '12px', color: '#767676' }}>{label}</span>
        <span style={{ fontSize: '13px', fontWeight: 500, color: '#2B2F36', textAlign: 'right', maxWidth: '60%' }}>{value}</span>
      </div>
    );
  }

  const cardStyle: React.CSSProperties = { background: 'white', border: '1px solid #E8E8E5', borderRadius: '10px', padding: '20px', marginBottom: '16px' };
  const cardTitleStyle: React.CSSProperties = { fontSize: '10px', textTransform: 'uppercase', color: '#767676', letterSpacing: '0.07em', marginBottom: '14px', fontWeight: 600, marginTop: 0 };

  return (
    <div>
      {/* Card 1: About you */}
      <div style={cardStyle}>
        <p style={cardTitleStyle}>About you</p>
        <ReviewRow label="Full name" value={state.fullName} />
        <ReviewRow label="Cédula" value={state.cedula} />
        <ReviewRow label="Party" value={
          party ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <PartyLogoInline id={party.id} abbr={party.abbr} />
              {party.name}
            </span>
          ) : '—'
        } />
        <ReviewRow label="Running for" value={raceLabel} />
        <ReviewRow label="Election" value={electionDisplay} last />
      </div>

      {/* Deadline boxes below Card 1 */}
      {electionInfo && daysUntilFundraising !== null && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          <div style={{ flex: 1, background: '#F6F6F4', borderRadius: '8px', padding: '14px 16px' }}>
            <p style={{ fontSize: '10px', textTransform: 'uppercase', color: '#767676', letterSpacing: '0.08em', margin: '0 0 2px 0' }}>Election date</p>
            <p style={{ fontSize: '15px', fontWeight: 500, color: '#2B2F36', margin: 0 }}>
              {electionInfo.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
          <div style={{ flex: 1, background: '#F6F6F4', borderRadius: '8px', padding: '14px 16px' }}>
            <p style={{ fontSize: '10px', textTransform: 'uppercase', color: '#767676', letterSpacing: '0.08em', margin: '0 0 2px 0' }}>Last day to raise funds</p>
            <p style={{ fontSize: '15px', fontWeight: 500, color: '#2B2F36', margin: 0 }}>
              {electionInfo.fundraisingDeadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>
            <p style={{ fontSize: '11px', color: '#767676', marginTop: '2px', marginBottom: 0 }}>{daysUntilFundraising} days from today</p>
          </div>
        </div>
      )}

      {/* Card 2: Your campaign */}
      <div style={cardStyle}>
        <p style={cardTitleStyle}>Your campaign</p>
        <ReviewRow label="Campaign name" value={state.campaignName} />
        <ReviewRow label="Fundraising goal" value={`RD$${Number(state.fundraisingGoal.replace(/,/g, '')).toLocaleString('es-DO')}`} />
        <ReviewRow label="Campaign platform" value={state.pdfUrl ? <span style={{ color: '#16A34A' }}>✓ PDF uploaded</span> : <span style={{ color: '#767676' }}>Not provided</span>} />
        <ReviewRow label="Campaign banner" value={state.bannerUrl ? <span style={{ color: '#16A34A' }}>✓ Uploaded</span> : <span style={{ color: '#767676' }}>Not provided</span>} />
        <ReviewRow label="Candidate photo" value={state.photoUrl ? <span style={{ color: '#16A34A' }}>✓ Uploaded</span> : <span style={{ color: '#767676' }}>Not provided</span>} last />
      </div>

      {/* Card 3: Campaign contact */}
      <div style={cardStyle}>
        <p style={cardTitleStyle}>Campaign contact</p>
        <ReviewRow label="WhatsApp" value={
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ color: '#16A34A', fontSize: '10px' }}>●</span>
            {state.whatsapp || <span style={{ color: '#767676' }}>Not provided</span>}
          </span>
        } />
        <ReviewRow label="Instagram" value={state.instagram || <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><span style={{ color: '#D1D5DB', fontSize: '10px' }}>●</span><span style={{ color: '#767676' }}>Not provided</span></span>} />
        <ReviewRow label="Facebook" value={state.facebook || <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><span style={{ color: '#D1D5DB', fontSize: '10px' }}>●</span><span style={{ color: '#767676' }}>Not provided</span></span>} />
        <ReviewRow label="X / Twitter" value={state.twitter || <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><span style={{ color: '#D1D5DB', fontSize: '10px' }}>●</span><span style={{ color: '#767676' }}>Not provided</span></span>} last />
      </div>

      {/* Card 4: JCE verification */}
      <div style={cardStyle}>
        <p style={cardTitleStyle}>JCE verification</p>
        <ReviewRow label="Registration number" value={state.jceNumber || <span style={{ color: '#767676' }}>Skipped — pending submission</span>} />
        <ReviewRow label="Status" value={
          state.jceVerified
            ? <span style={{ background: '#DCFCE7', color: '#166534', fontSize: '11px', padding: '2px 8px', borderRadius: '20px' }}>✓ Verified</span>
            : <span style={{ background: '#FEF3C7', color: '#92400E', fontSize: '11px', padding: '2px 8px', borderRadius: '20px' }}>Pending verification</span>
        } last />
      </div>
    </div>
  );
}

// ─── SKIP MODAL ─────────────────────────────────────────────────────────────
function SkipModal({ onBack, onSkip }: { onBack: () => void; onSkip: () => void }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={(e) => { if (e.target === e.currentTarget) onBack(); }}
    >
      <div style={{ background: 'white', borderRadius: '12px', padding: '28px', maxWidth: '380px', width: '90%', border: '0.5px solid #E8E8E5' }}>
        <div style={{ width: '40px', height: '40px', background: '#FEF3C7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto' }}>
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
            <path d="M10 6v4m0 4h.01" stroke="#92400E" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="10" cy="10" r="9" stroke="#92400E" strokeWidth="1.5" />
          </svg>
        </div>
        <h3 style={{ fontSize: '16px', fontWeight: 500, color: '#2B2F36', marginTop: '16px', textAlign: 'center' }}>Your page won't be public yet</h3>
        <p style={{ fontSize: '13px', color: '#767676', lineHeight: 1.65, marginTop: '8px', textAlign: 'center' }}>
          No problem — you can finish setting up your campaign and explore your dashboard. However, your donation page will remain private until our team receives and verifies your JCE registration number. You can submit it anytime from your dashboard.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '20px' }}>
          <button
            onClick={onBack}
            style={{ background: '#2B2F36', color: 'white', border: 'none', width: '100%', height: '40px', borderRadius: '4px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Go back and add my JCE number
          </button>
          <button
            onClick={onSkip}
            style={{ background: 'white', color: '#767676', border: '0.5px solid #E8E8E5', width: '100%', height: '40px', borderRadius: '4px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            Continue without JCE number
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN CLIENT ─────────────────────────────────────────────────────────────
export default function OnboardingClient({ locale, userId, userName }: Props) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [state, setState] = useState<FormState>({
    fullName: userName,
    cedula: '',
    cedulaError: '',
    party: '',
    raceType: '',
    electionCategory: '',
    campaignName: '',
    campaignNameEditing: false,
    fundraisingGoal: '',
    pdfFile: null,
    pdfUrl: '',
    pdfUploading: false,
    bannerFile: null,
    bannerUrl: '',
    bannerUploading: false,
    photoFile: null,
    photoUrl: '',
    photoUploading: false,
    whatsapp: '',
    instagram: '',
    facebook: '',
    twitter: '',
    jceNumber: '',
    jceVerifying: false,
    jceVerified: false,
    jceData: null,
    jceError: '',
    jceSkipped: false,
    checkbox1: false,
    checkbox2: false,
    showSkipModal: false,
    submitting: false,
    successToast: false,
  });

  // Step validity
  const step1Valid =
    state.fullName.trim() !== '' &&
    !state.cedulaError &&
    /^\d{3}-\d{7}-\d{1}$/.test(state.cedula) &&
    state.party !== '' &&
    state.raceType !== '' &&
    state.electionCategory !== '';

  const step2Valid =
    state.campaignName.trim() !== '' &&
    state.fundraisingGoal !== '' &&
    parseInt(state.fundraisingGoal.replace(/,/g, ''), 10) > 0 &&
    state.pdfUrl !== '' &&
    state.photoUrl !== '' &&
    state.whatsapp.trim() !== '';

  const step3Valid = state.jceVerified && state.checkbox1 && state.checkbox2;

  const canNext = step === 1 ? step1Valid : step === 2 ? step2Valid : step === 3 ? step3Valid : true;

  const STEP_TITLES = ['About you', 'Your campaign', 'JCE verification', 'Review & launch'];
  const STEP_SUBS: (string | undefined)[] = [
    undefined,
    "We've pre-filled this based on your info. Feel free to edit.",
    'Enter your JCE registration number to go live.',
    'Check your details before going live.',
  ];

  async function handleLaunch() {
    setState(s => ({ ...s, submitting: true }));
    const supabase = createBrowserSupabaseClient();

    const rawName = state.campaignName;
    const baseSlug = rawName
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60);

    let slug = baseSlug;
    let suffix = 2;
    while (true) {
      const { data } = await supabase.from('campaigns').select('id').eq('slug', slug).maybeSingle();
      if (!data) break;
      slug = `${baseSlug}-${suffix++}`;
    }

    const electionInfo = getElectionInfo(state.electionCategory as ElectionCategory, state.raceType);
    const electionDateType = getElectionDateType(state.electionCategory as ElectionCategory, state.raceType);

    const { error } = await supabase.from('campaigns').insert({
      user_id: userId,
      slug,
      candidate_name: state.fullName,
      candidate_cedula: state.cedula,
      party_affiliation: state.party,
      race_type: state.raceType,
      election_category: state.electionCategory,
      election_date_type: electionDateType,
      election_type: electionDateType,
      election_deadline: electionInfo.date.toISOString().split('T')[0],
      fundraising_deadline: electionInfo.fundraisingDeadline.toISOString().split('T')[0],
      fundraising_goal: parseInt(state.fundraisingGoal.replace(/,/g, ''), 10),
      campaign_name: state.campaignName,
      description: '',
      candidate_photo_url: state.photoUrl,
      banner_url: state.bannerUrl,
      campaign_platform_url: state.pdfUrl,
      phone: state.whatsapp,
      whatsapp: state.whatsapp,
      instagram: state.instagram,
      facebook: state.facebook,
      twitter: state.twitter,
      jce_registration_number: state.jceSkipped ? null : state.jceNumber,
      status: 'pending_verification',
      municipality: state.jceData?.municipality ?? null,
    });

    if (error) {
      alert('Error creating campaign: ' + error.message);
      setState(s => ({ ...s, submitting: false }));
      return;
    }

    setState(s => ({ ...s, submitting: false, successToast: true }));
    setTimeout(() => router.push('/dashboard'), 2500);
  }

  return (
    <>
      <style>{`
        @media (max-width: 600px) {
          .ob-progress-line { display: none !important; }
          .ob-card { padding: 20px !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#FAFAFA', padding: '40px 24px 80px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <ProgressIndicator step={step} />

          <div className="ob-card" style={{ background: 'white', border: '1px solid #E8E8E5', borderRadius: '12px', padding: '32px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#2B2F36', marginBottom: '4px', marginTop: 0 }}>
              {STEP_TITLES[step - 1]}
            </h2>
            {STEP_SUBS[step - 1] && (
              <p style={{ fontSize: '13px', color: '#767676', marginBottom: '24px', marginTop: 0 }}>
                {STEP_SUBS[step - 1]}
              </p>
            )}

            {step === 1 && <Step1 state={state} setState={setState} />}
            {step === 2 && <Step2 state={state} setState={setState} userId={userId} />}
            {step === 3 && <Step3 state={state} setState={setState} />}
            {step === 4 && <Step4 state={state} />}

            {/* Launch note on step 4 */}
            {step === 4 && (
              <p style={{ fontSize: '11px', color: '#767676', textAlign: 'center', lineHeight: 1.6, marginTop: '12px' }}>
                Your donation page will go live once our team confirms your JCE registration. We'll notify you by email within 1–2 business days.
              </p>
            )}

            {/* Navigation */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '28px' }}>
              {/* Back */}
              <button
                onClick={() => step > 1 && setStep(s => s - 1)}
                style={{
                  background: 'none', border: 'none', fontSize: '13px', color: step > 1 ? '#767676' : '#C0C0C0',
                  cursor: step > 1 ? 'pointer' : 'default', fontFamily: 'inherit', padding: '0',
                }}
              >
                ← Back
              </button>

              {step === 3 ? (
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  {/* Skip for now */}
                  <button
                    onClick={() => setState(s => ({ ...s, showSkipModal: true }))}
                    style={{ background: 'none', border: 'none', fontSize: '12px', color: '#767676', textDecoration: 'underline', textUnderlineOffset: '3px', cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    Skip for now
                  </button>
                  {/* Next */}
                  <button
                    onClick={() => setStep(s => s + 1)}
                    disabled={!step3Valid}
                    style={{
                      background: '#C8102E', color: 'white', border: 'none', borderRadius: '4px', height: '40px',
                      padding: '0 24px', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit',
                      cursor: step3Valid ? 'pointer' : 'not-allowed', opacity: step3Valid ? 1 : 0.45,
                    }}
                  >
                    Next →
                  </button>
                </div>
              ) : step < 4 ? (
                <button
                  onClick={() => setStep(s => s + 1)}
                  disabled={!canNext}
                  style={{
                    background: '#C8102E', color: 'white', border: 'none', borderRadius: '4px', height: '40px',
                    padding: '0 24px', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit',
                    cursor: canNext ? 'pointer' : 'not-allowed', opacity: canNext ? 1 : 0.45,
                  }}
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={handleLaunch}
                  disabled={state.submitting}
                  style={{
                    background: '#C8102E', color: 'white', border: 'none', borderRadius: '4px', height: '48px',
                    fontSize: '14px', fontWeight: 500, fontFamily: 'inherit', width: '100%', marginTop: '8px',
                    cursor: state.submitting ? 'wait' : 'pointer',
                  }}
                >
                  {state.submitting ? 'Launching...' : 'Launch my campaign →'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Skip modal */}
      {state.showSkipModal && (
        <SkipModal
          onBack={() => setState(s => ({ ...s, showSkipModal: false }))}
          onSkip={() => {
            setState(s => ({ ...s, jceSkipped: true, showSkipModal: false }));
            setStep(4);
          }}
        />
      )}

      {/* Success toast */}
      {state.successToast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px',
          background: '#16A34A', color: 'white', padding: '12px 20px',
          borderRadius: '8px', fontSize: '13px', fontWeight: 500,
          zIndex: 2000, boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        }}>
          Campaign created! We'll notify you once your JCE verification is complete.
        </div>
      )}
    </>
  );
}
