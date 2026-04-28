'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/lib/i18n/navigation';
import Image from 'next/image';
import Logo from '@/components/ui/Logo';
import PartySelector, { type PartyId } from '@/components/ui/PartySelector';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';
import { getElectionDeadline, getDaysUntilElection, type ElectionType } from '@/lib/jce-calendar';
import { JCE_PARTIES } from '@/components/ui/PartySelector';
import type { JCERegistration } from '@/types';

type TFn = ReturnType<typeof useTranslations<'onboarding'>>;
type RaceType = 'mayor' | 'senator' | 'deputy' | 'district_director';

interface FormData {
  fullName: string; cedula: string; party: PartyId | ''; raceType: RaceType | '';
  electionType: ElectionType | ''; phone: string;
  candidatePhotoFile: File | null; candidatePhotoUrl: string;
  campaignName: string; slug: string; goalAmount: string; description: string;
  bannerFile: File | null; bannerUrl: string;
  jceNumber: string; jceVerified: boolean; jceData: JCERegistration | null;
  checkbox1: boolean; checkbox2: boolean;
}

const INITIAL: FormData = {
  fullName: '', cedula: '', party: '', raceType: '', electionType: '', phone: '',
  candidatePhotoFile: null, candidatePhotoUrl: '',
  campaignName: '', slug: '', goalAmount: '', description: '', bannerFile: null, bannerUrl: '',
  jceNumber: '', jceVerified: false, jceData: null, checkbox1: false, checkbox2: false,
};

const RACE_LABELS: Record<string, string> = {
  mayor: 'Mayor (Alcalde/sa)', senator: 'Senator (Senador/a)',
  deputy: 'Deputy (Diputado/a)', district_director: 'District Director',
};
const ELECTION_LABELS: Record<string, string> = {
  primary: 'Primary election (Primarias)',
  municipal: 'General / Municipal election',
  general: 'General / Municipal election',
};

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12px', fontWeight: 600, color: '#2B2F36', marginBottom: '6px', letterSpacing: '-0.01em' };
const inputStyle: React.CSSProperties = { width: '100%', height: '40px', border: '1px solid #E8E8E5', borderRadius: '6px', padding: '0 12px', fontSize: '13px', color: '#2B2F36', background: 'white', fontFamily: 'inherit', boxSizing: 'border-box', outline: 'none' };
const fieldStyle: React.CSSProperties = { marginBottom: '20px' };

function ProgressBar({ step, total }: { step: number; total: number }) {
  const steps = Array.from({ length: total }, (_, i) => i + 1);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '32px' }}>
      {steps.map((s, i) => (
        <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid', borderColor: s < step ? '#2B2F36' : s === step ? '#C8102E' : '#E8E8E5', background: s < step ? '#2B2F36' : s === step ? '#C8102E' : 'white', color: s <= step ? 'white' : '#767676', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 600, transition: 'all 0.2s ease', flexShrink: 0 }}>
            {s < step ? '✓' : s}
          </div>
          {i < total - 1 && <div className="progress-line" style={{ width: '40px', height: '1px', background: s < step ? '#2B2F36' : '#E8E8E5', transition: 'background 0.2s ease' }} />}
        </div>
      ))}
    </div>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div style={fieldStyle}>
      <label style={labelStyle}>{label}</label>
      {children}
      {hint && !error && <p style={{ fontSize: '11px', color: '#767676', marginTop: '4px', marginBottom: 0 }}>{hint}</p>}
      {error && <p style={{ fontSize: '11px', color: '#C8102E', marginTop: '4px', marginBottom: 0 }}>{error}</p>}
    </div>
  );
}

function Checkbox({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', cursor: 'pointer', marginBottom: '14px' }}>
      <div onClick={() => onChange(!checked)} style={{ width: '18px', height: '18px', minWidth: '18px', border: checked ? 'none' : '1.5px solid #E8E8E5', borderRadius: '3px', background: checked ? '#C8102E' : 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: '1px' }}>
        {checked && <span style={{ color: 'white', fontSize: '11px', lineHeight: 1 }}>✓</span>}
      </div>
      <span style={{ fontSize: '12px', color: '#2B2F36', lineHeight: 1.6 }}>{children}</span>
    </label>
  );
}

function UploadArea({ label, accept, maxMB, preview, onFile }: { label: string; accept: string; maxMB: number; preview: string | null; onFile: (f: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [fileName, setFileName] = useState('');
  function handle(file: File) {
    if (file.size > maxMB * 1024 * 1024) { alert(`File must be under ${maxMB}MB`); return; }
    setFileName(file.name);
    onFile(file);
  }
  return (
    <div>
      <div onClick={() => inputRef.current?.click()} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handle(f); }} style={{ border: `1.5px dashed ${dragOver ? '#C8102E' : '#E8E8E5'}`, borderRadius: '8px', minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: '20px', textAlign: 'center', background: dragOver ? '#FFF5F5' : 'white' }}>
        {preview ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Image src={preview} alt="preview" width={60} height={60} style={{ borderRadius: '50%', objectFit: 'cover', border: '2px solid #E8E8E5' }} />
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: '12px', fontWeight: 600, color: '#2B2F36', margin: 0 }}>{fileName}</p>
              <p style={{ fontSize: '11px', color: '#767676', margin: '2px 0 0 0' }}>Click to change</p>
            </div>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: '13px', color: '#767676', margin: 0 }}>{label}</p>
            <p style={{ fontSize: '11px', color: '#767676', margin: '4px 0 0 0' }}>Max {maxMB}MB · JPG, PNG</p>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept={accept} style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f); }} />
    </div>
  );
}

function BannerUploadArea({ preview, onFile }: { preview: string | null; onFile: (f: File) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  function handle(file: File) {
    if (file.size > 5 * 1024 * 1024) { alert('File must be under 5MB'); return; }
    onFile(file);
  }
  return (
    <div>
      <div onClick={() => inputRef.current?.click()} onDragOver={(e) => { e.preventDefault(); setDragOver(true); }} onDragLeave={() => setDragOver(false)} onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handle(f); }} style={{ border: `1.5px dashed ${dragOver ? '#C8102E' : '#E8E8E5'}`, borderRadius: '8px', cursor: 'pointer', overflow: 'hidden', background: dragOver ? '#FFF5F5' : 'white' }}>
        {preview ? (
          <div style={{ height: '120px', backgroundImage: `url(${preview})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
        ) : (
          <div style={{ minHeight: '80px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', textAlign: 'center' }}>
            <div>
              <p style={{ fontSize: '13px', color: '#767676', margin: 0 }}>Upload campaign banner</p>
              <p style={{ fontSize: '11px', color: '#767676', margin: '4px 0 0 0' }}>Max 5MB · JPG, PNG · 16:9 recommended</p>
            </div>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/jpeg,image/png" style={{ display: 'none' }} onChange={(e) => { const f = e.target.files?.[0]; if (f) handle(f); }} />
    </div>
  );
}

function Step1({ data, update, t }: { data: FormData; update: (patch: Partial<FormData>) => void; t: TFn }) {
  const [cedulaError, setCedulaError] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const selectedElection = data.electionType as ElectionType | '';

  function validateCedula(val: string) {
    if (!val) { setCedulaError(''); return; }
    setCedulaError(/^\d{3}-\d{7}-\d{1}$/.test(val) ? '' : t('errorCedula'));
  }

  const deadline = (selectedElection && data.raceType) ? getElectionDeadline(selectedElection, data.raceType) : null;
  const daysLeft = deadline ? getDaysUntilElection(selectedElection as ElectionType, data.raceType) : null;

  return (
    <div>
      <Field label={t('fullNameLabel')}>
        <input style={inputStyle} value={data.fullName} onChange={(e) => update({ fullName: e.target.value })} placeholder={t('fullNameLabel')} />
      </Field>
      <Field label={t('cedulaLabel')} hint={t('cedulaHint')} error={cedulaError}>
        <input style={{ ...inputStyle, borderColor: cedulaError ? '#C8102E' : '#E8E8E5' }} value={data.cedula} onChange={(e) => update({ cedula: e.target.value })} onBlur={(e) => validateCedula(e.target.value)} placeholder={t('cedulaPlaceholder')} />
      </Field>
      <Field label={t('partyLabel')}>
        <PartySelector value={data.party} onChange={(v) => update({ party: v })} />
      </Field>
      <Field label={t('raceLabel')}>
        <select style={{ ...inputStyle, paddingRight: '8px' }} value={data.raceType} onChange={(e) => update({ raceType: e.target.value as RaceType })}>
          <option value="">Select race type…</option>
          <option value="mayor">{t('mayor')}</option>
          <option value="senator">{t('senator')}</option>
          <option value="deputy">{t('deputy')}</option>
          <option value="district_director">{t('districtDirector')}</option>
        </select>
      </Field>
      <div style={fieldStyle}>
        <label style={labelStyle}>{t('electionLabel')}</label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {([{ value: 'primary', label: t('primaryElection'), sub: 'October 3, 2027' }, { value: 'municipal', label: t('municipalElection'), sub: 'February 2028 (Municipal) · May 2028 (General)' }] as const).map((opt) => (
            <label key={opt.value} style={{ border: data.electionType === opt.value ? '2px solid #C8102E' : '1px solid #E8E8E5', borderRadius: '8px', padding: '14px 16px', cursor: 'pointer', background: data.electionType === opt.value ? '#FFF5F5' : 'white', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <input type="radio" name="electionType" value={opt.value} checked={data.electionType === opt.value} onChange={() => update({ electionType: opt.value })} style={{ marginTop: '2px', accentColor: '#C8102E' }} />
              <div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#2B2F36', margin: 0 }}>{opt.label}</p>
                <p style={{ fontSize: '11px', color: '#767676', margin: '2px 0 0 0' }}>{opt.sub}</p>
              </div>
            </label>
          ))}
        </div>
        {selectedElection && deadline && (
          <div style={{ background: '#F6F6F4', borderRadius: '8px', padding: '14px 16px', marginTop: '12px' }}>
            <p style={{ fontSize: '10px', textTransform: 'uppercase', color: '#767676', letterSpacing: '0.05em', margin: '0 0 4px 0' }}>{t('deadline')}:</p>
            <p style={{ fontSize: '16px', fontWeight: 600, color: '#2B2F36', margin: 0 }}>{deadline.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            <p style={{ fontSize: '12px', color: '#767676', margin: '4px 0 0 0' }}>({daysLeft} days from today)</p>
          </div>
        )}
      </div>
      <Field label={t('phoneLabel')} hint={t('phonePlaceholder')}>
        <input style={inputStyle} value={data.phone} onChange={(e) => update({ phone: e.target.value })} placeholder={t('phonePlaceholder')} type="tel" />
      </Field>
      <div style={fieldStyle}>
        <label style={labelStyle}>{t('photoLabel')}</label>
        <UploadArea label={t('photoHint')} accept="image/jpeg,image/png" maxMB={5} preview={photoPreview} onFile={(f) => { setPhotoPreview(URL.createObjectURL(f)); update({ candidatePhotoFile: f }); }} />
      </div>
    </div>
  );
}

function Step2({ data, update, t }: { data: FormData; update: (patch: Partial<FormData>) => void; t: TFn }) {
  const [slugStatus, setSlugStatus] = useState<'idle' | 'checking' | 'ok' | 'taken'>('idle');
  const [charCount, setCharCount] = useState(data.description.length);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const slugTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function generateSlug(name: string) {
    return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9\s-]/g, '').trim().replace(/\s+/g, '-').slice(0, 60);
  }

  async function checkSlug(slug: string) {
    if (!slug) { setSlugStatus('idle'); return; }
    setSlugStatus('checking');
    const sb = createBrowserSupabaseClient();
    const { data: row } = await sb.from('campaigns').select('id').eq('slug', slug).maybeSingle();
    setSlugStatus(row ? 'taken' : 'ok');
  }

  function handleSlugChange(val: string) {
    const clean = generateSlug(val);
    update({ slug: clean });
    setSlugStatus('idle');
    if (slugTimer.current) clearTimeout(slugTimer.current);
    slugTimer.current = setTimeout(() => checkSlug(clean), 600);
  }

  const spendingNote = (data.raceType === 'mayor' || data.raceType === 'district_director')
    ? 'Legal limit: RD$50 per registered voter in your municipality (Art. 42, Ley 33-18)'
    : 'Legal limit: RD$60 per registered voter in your province (Art. 42, Ley 33-18)';

  return (
    <div>
      <Field label={t('campaignNameLabel')}>
        <input style={inputStyle} value={data.campaignName} onChange={(e) => update({ campaignName: e.target.value })} onBlur={(e) => { if (e.target.value && !data.slug) { const s = generateSlug(e.target.value); update({ slug: s }); checkSlug(s); } }} placeholder={t('campaignNamePlaceholder')} />
      </Field>
      <div style={fieldStyle}>
        <label style={labelStyle}>{t('slugLabel')}</label>
        <div style={{ position: 'relative' }}>
          <input style={{ ...inputStyle, borderColor: slugStatus === 'taken' ? '#C8102E' : slugStatus === 'ok' ? '#16A34A' : '#E8E8E5', paddingRight: '32px' }} value={data.slug} onChange={(e) => handleSlugChange(e.target.value)} placeholder="your-campaign-slug" />
          {slugStatus === 'checking' && <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#767676' }}>{t('slugChecking')}</span>}
          {slugStatus === 'ok' && <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#16A34A' }}>✓</span>}
        </div>
        {slugStatus === 'taken' && <p style={{ fontSize: '11px', color: '#C8102E', marginTop: '4px' }}>{t('slugTaken')}</p>}
        {data.slug && (
          <div style={{ background: '#F6F6F4', borderRadius: '6px', padding: '10px 14px', marginTop: '8px' }}>
            <p style={{ fontSize: '12px', color: '#767676', margin: '0 0 2px 0' }}>{t('summaryDonationLink')}:</p>
            <p style={{ fontSize: '13px', fontWeight: 600, color: '#2B2F36', margin: 0 }}>{t('slugPrefix')}{data.slug}</p>
          </div>
        )}
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>{t('goalLabel')}</label>
        <input style={inputStyle} type="number" min="1000" value={data.goalAmount} onChange={(e) => update({ goalAmount: e.target.value })} placeholder={t('goalPlaceholder')} />
        {data.raceType && <span style={{ display: 'inline-block', fontSize: '11px', fontWeight: 600, background: '#FEF3C7', color: '#92400E', borderRadius: '4px', padding: '4px 10px', marginTop: '6px' }}>{spendingNote}</span>}
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>{t('descriptionLabel')}</label>
        <textarea value={data.description} onChange={(e) => { update({ description: e.target.value }); setCharCount(e.target.value.length); }} maxLength={280} rows={4} placeholder={t('descriptionPlaceholder')} style={{ ...inputStyle, height: 'auto', padding: '10px 12px', resize: 'vertical', lineHeight: 1.6 }} />
        <p style={{ fontSize: '11px', color: charCount > 260 ? '#C8102E' : '#767676', textAlign: 'right', marginTop: '2px', marginBottom: 0 }}>{charCount}/280</p>
      </div>
      <div style={fieldStyle}>
        <label style={labelStyle}>{t('bannerLabel')}</label>
        <BannerUploadArea preview={bannerPreview} onFile={(f) => { setBannerPreview(URL.createObjectURL(f)); update({ bannerFile: f }); }} />
      </div>
    </div>
  );
}

function Step3({ data, update, t }: { data: FormData; update: (patch: Partial<FormData>) => void; t: TFn }) {
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'checking' | 'found' | 'notfound'>('idle');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  async function verifyJCE(number: string) {
    if (!number.trim()) { setVerifyStatus('idle'); update({ jceVerified: false, jceData: null }); return; }
    setVerifyStatus('checking');
    const sb = createBrowserSupabaseClient();
    const { data: row } = await sb.from('jce_registered_campaigns').select('*').eq('jce_number', number.trim()).maybeSingle();
    if (row) { setVerifyStatus('found'); update({ jceVerified: true, jceData: row as JCERegistration }); }
    else { setVerifyStatus('notfound'); update({ jceVerified: false, jceData: null }); }
  }

  function handleChange(val: string) {
    update({ jceNumber: val, jceVerified: false, jceData: null });
    setVerifyStatus('idle');
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => verifyJCE(val), 200);
  }

  return (
    <div>
      <div style={{ background: '#FFF5F5', borderLeft: '3px solid #C8102E', borderRadius: '0 8px 8px 0', padding: '16px', marginBottom: '24px' }}>
        <p style={{ fontSize: '13px', color: '#2B2F36', lineHeight: 1.65, margin: 0 }}>
          Impulso only works with campaigns officially registered with the Junta Central Electoral (JCE). Enter your JCE registration number below — we'll verify it instantly.
        </p>
      </div>
      <Field label={t('jceNumberLabel')}>
        <div style={{ position: 'relative' }}>
          <input style={{ ...inputStyle, borderColor: verifyStatus === 'found' ? '#16A34A' : verifyStatus === 'notfound' ? '#C8102E' : '#E8E8E5', paddingRight: '32px' }} value={data.jceNumber} onChange={(e) => handleChange(e.target.value)} placeholder={t('jceNumberPlaceholder')} />
          {verifyStatus === 'checking' && <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#767676' }}>{t('jceVerifying')}</span>}
          {verifyStatus === 'found' && <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#16A34A' }}>✓</span>}
        </div>
        {verifyStatus === 'found' && (
          <div style={{ background: '#F0FDF4', borderLeft: '3px solid #16A34A', padding: '12px 16px', marginTop: '10px', borderRadius: '0 6px 6px 0' }}>
            <p style={{ fontSize: '12px', color: '#16A34A', fontWeight: 600, margin: 0 }}>
              {data.jceData?.candidate_name ? t('jceVerified', { name: data.jceData.candidate_name }) : 'Verified ✓'}
            </p>
          </div>
        )}
        {verifyStatus === 'notfound' && <p style={{ fontSize: '12px', color: '#C8102E', marginTop: '8px', lineHeight: 1.6 }}>{t('jceNotFound')}</p>}
      </Field>
      <div style={{ marginTop: '24px' }}>
        <Checkbox checked={data.checkbox1} onChange={(v) => update({ checkbox1: v })}>{t('checkbox1')}</Checkbox>
        <Checkbox checked={data.checkbox2} onChange={(v) => update({ checkbox2: v })}>{t('checkbox2')}</Checkbox>
      </div>
    </div>
  );
}

function Step4({ data, t }: { data: FormData; t: TFn }) {
  const [copied, setCopied] = useState(false);
  const party = JCE_PARTIES.find((p) => p.id === data.party);
  const electionType = data.electionType as ElectionType;
  const deadline = (data.electionType && data.raceType) ? getElectionDeadline(electionType, data.raceType) : null;
  const daysLeft = deadline ? getDaysUntilElection(electionType, data.raceType) : null;

  const rows: [string, React.ReactNode][] = [
    [t('fullNameLabel'), data.fullName],
    [t('cedulaLabel'), data.cedula],
    [t('partyLabel'), party ? party.name : '—'],
    [t('raceLabel'), RACE_LABELS[data.raceType] ?? data.raceType],
    [t('electionLabel'), ELECTION_LABELS[data.electionType] ?? data.electionType],
    [t('phoneLabel'), data.phone || '—'],
    [t('campaignNameLabel'), data.campaignName],
    [t('goalLabel'), data.goalAmount ? `RD$${Number(data.goalAmount).toLocaleString('es-DO')}` : '—'],
    [t('jceNumberLabel'), data.jceNumber],
  ];

  function copyLink() { navigator.clipboard.writeText(`impulso.do/dona/${data.slug}`); setCopied(true); setTimeout(() => setCopied(false), 2000); }

  return (
    <div>
      <div style={{ border: '1px solid #E8E8E5', borderRadius: '8px', overflow: 'hidden', marginBottom: '20px' }}>
        {rows.map(([label, value], i) => (
          <div key={String(label)} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '12px 16px', borderBottom: i < rows.length - 1 ? '0.5px solid #E8E8E5' : 'none' }} className="summary-row">
            <span style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#767676' }}>{label}</span>
            <span style={{ fontSize: '13px', fontWeight: 500, color: '#2B2F36' }}>{value}</span>
          </div>
        ))}
      </div>
      <div style={{ background: '#F6F6F4', borderRadius: '8px', padding: '16px', marginTop: '20px' }}>
        <p style={{ fontSize: '10px', textTransform: 'uppercase', color: '#767676', letterSpacing: '0.05em', margin: '0 0 6px 0' }}>{t('summaryDonationLink')}</p>
        <p style={{ fontSize: '15px', fontWeight: 600, color: '#2B2F36', margin: '0 0 12px 0' }}>{t('slugPrefix')}{data.slug}</p>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button onClick={copyLink} style={{ fontSize: '12px', fontWeight: 600, color: '#2B2F36', background: 'white', border: '1px solid #E8E8E5', borderRadius: '4px', padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit' }}>{copied ? t('copied') : t('copyLink')}</button>
          <a href={`https://wa.me/?text=${encodeURIComponent(`Apoya mi campaña en Impulso: impulso.do/dona/${data.slug}`)}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: '12px', fontWeight: 600, color: '#16A34A', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '4px', padding: '6px 14px', textDecoration: 'none' }}>{t('shareWhatsApp')}</a>
        </div>
      </div>
      {deadline && (
        <div style={{ background: '#F6F6F4', borderRadius: '8px', padding: '14px 16px', marginTop: '12px' }}>
          <Row label={t('electionLabel')} value={ELECTION_LABELS[data.electionType] ?? data.electionType} />
          <Row label={t('deadline')} value={deadline.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} />
          <Row label={t('daysUntilElection')} value={String(daysLeft)} />
        </div>
      )}
      <div style={{ marginTop: '20px' }}>
        <span style={{ background: '#FEF3C7', color: '#92400E', fontSize: '11px', fontWeight: 600, padding: '4px 12px', borderRadius: '20px' }}>{t('summaryStatus')}</span>
        <p style={{ fontSize: '11px', color: '#767676', marginTop: '8px', lineHeight: 1.6 }}>{t('summaryStatusNote')}</p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
      <span style={{ fontSize: '12px', color: '#767676' }}>{label}:</span>
      <span style={{ fontSize: '12px', fontWeight: 600, color: '#2B2F36' }}>{value}</span>
    </div>
  );
}

export default function OnboardingPage() {
  const t = useTranslations('onboarding');
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<FormData>(INITIAL);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  function update(patch: Partial<FormData>) { setData((prev) => ({ ...prev, ...patch })); }

  useEffect(() => {
    const sb = createBrowserSupabaseClient();
    sb.auth.getUser().then(({ data: { user } }) => {
      if (user?.user_metadata?.full_name) setData((prev) => ({ ...prev, fullName: prev.fullName || user.user_metadata.full_name }));
    });
  }, []);

  function isStep1Valid() { return data.fullName.trim() && /^\d{3}-\d{7}-\d{1}$/.test(data.cedula) && data.party && data.raceType && data.electionType && data.phone.trim(); }
  function isStep2Valid() { return data.campaignName.trim() && data.slug.trim() && data.goalAmount && Number(data.goalAmount) >= 1000 && data.description.trim(); }
  function isStep3Valid() { return data.jceVerified && data.checkbox1 && data.checkbox2; }

  const canNext = (step === 1 && isStep1Valid()) || (step === 2 && isStep2Valid()) || (step === 3 && isStep3Valid()) || step === 4;

  async function handleSubmit() {
    setSubmitting(true);
    setSubmitError('');
    try {
      const sb = createBrowserSupabaseClient();
      const { data: { user } } = await sb.auth.getUser();
      if (!user) { router.push('/auth/login'); return; }

      let candidatePhotoUrl = '';
      let bannerUrl = '';

      if (data.candidatePhotoFile) {
        const ext = data.candidatePhotoFile.name.split('.').pop();
        const { data: upload } = await sb.storage.from('candidate-photos').upload(`${user.id}/photo.${ext}`, data.candidatePhotoFile, { upsert: true });
        if (upload) { const { data: { publicUrl } } = sb.storage.from('candidate-photos').getPublicUrl(upload.path); candidatePhotoUrl = publicUrl; }
      }
      if (data.bannerFile) {
        const ext = data.bannerFile.name.split('.').pop();
        const { data: upload } = await sb.storage.from('campaign-assets').upload(`${user.id}/banner.${ext}`, data.bannerFile, { upsert: true });
        if (upload) { const { data: { publicUrl } } = sb.storage.from('campaign-assets').getPublicUrl(upload.path); bannerUrl = publicUrl; }
      }

      const electionDeadline = getElectionDeadline(data.electionType as ElectionType, data.raceType);
      const { error } = await sb.from('campaigns').insert({
        user_id: user.id, candidate_name: data.fullName, slug: data.slug,
        race_type: data.raceType, election_type: data.electionType,
        election_deadline: electionDeadline.toISOString().split('T')[0],
        goal_amount: Number(data.goalAmount), description: data.description,
        candidate_photo_url: candidatePhotoUrl || null, banner_url: bannerUrl || null,
        jce_registration_number: data.jceNumber, party_affiliation: data.party,
        candidate_cedula: data.cedula, phone: data.phone,
        status: 'pending_verification', municipality: data.jceData?.municipality ?? null,
      });

      if (error) { setSubmitError(error.message); setSubmitting(false); return; }
      router.push('/dashboard');
    } catch (err) {
      setSubmitError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  }

  const STEP_HEADINGS = [t('step1Title'), t('step2Title'), t('step3Title'), t('step4Title')];

  return (
    <>
      <style>{`@media (max-width: 600px) { .progress-line { display: none !important; } .summary-row { grid-template-columns: 1fr !important; gap: 2px !important; } }`}</style>
      <div style={{ minHeight: '100vh', background: '#FAFAFA', padding: '40px 24px 80px' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}><Logo height={28} /></div>
          <ProgressBar step={step} total={4} />
          <div style={{ background: 'white', border: '1px solid #E8E8E5', borderRadius: '12px', padding: '32px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 600, color: '#2B2F36', letterSpacing: '-0.02em', margin: '0 0 24px 0' }}>{STEP_HEADINGS[step - 1]}</h2>
            {step === 1 && <Step1 data={data} update={update} t={t} />}
            {step === 2 && <Step2 data={data} update={update} t={t} />}
            {step === 3 && <Step3 data={data} update={update} t={t} />}
            {step === 4 && <Step4 data={data} t={t} />}
            {submitError && <p style={{ fontSize: '13px', color: '#C8102E', padding: '10px 14px', background: '#FFF5F5', borderRadius: '6px', border: '1px solid #FED7D7', marginTop: '16px' }}>{submitError}</p>}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '28px' }}>
              {step > 1 ? (
                <button onClick={() => setStep((s) => s - 1)} style={{ background: 'transparent', border: 'none', color: '#767676', fontSize: '14px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', padding: '11px 20px' }}>← {t('backBtn')}</button>
              ) : <div />}
              {step < 4 ? (
                <button onClick={() => setStep((s) => s + 1)} disabled={!canNext} style={{ background: '#C8102E', color: 'white', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 600, padding: '11px 28px', cursor: canNext ? 'pointer' : 'not-allowed', opacity: canNext ? 1 : 0.45, fontFamily: 'inherit', transition: 'opacity 0.2s' }}>
                  {t('nextBtn')} →
                </button>
              ) : (
                <button onClick={handleSubmit} disabled={submitting} style={{ width: '100%', height: '48px', background: submitting ? '#E8E8E5' : '#C8102E', color: 'white', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: 600, cursor: submitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit' }}>
                  {submitting ? t('launching') : t('launchBtn')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
