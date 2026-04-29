'use client';
import { useState, useMemo } from 'react';
import { useRouter } from '@/lib/i18n/navigation';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface Campaign {
  id: string;
  slug: string;
  candidate_name: string;
  fundraising_deadline?: string;
}

interface Donation {
  id: string;
  donor_name: string;
  donor_email?: string;
  amount: number;
  is_mock?: boolean;
  created_at: string;
}

function formatRD(n: number) {
  return 'RD$' + n.toLocaleString('es-DO');
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function daysUntil(dateStr?: string): number | null {
  if (!dateStr) return null;
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function weekLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function buildWeeklyData(donations: Donation[]) {
  const now = new Date();
  const sixMonthsAgo = new Date(now);
  sixMonthsAgo.setMonth(now.getMonth() - 6);

  const map = new Map<string, { total: number; count: number; date: Date }>();
  donations.forEach(d => {
    const dt = new Date(d.created_at);
    if (dt < sixMonthsAgo) return;
    const ws = getWeekStart(dt);
    const key = ws.toISOString();
    const existing = map.get(key) || { total: 0, count: 0, date: ws };
    map.set(key, { total: existing.total + d.amount, count: existing.count + 1, date: ws });
  });

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => ({ label: weekLabel(v.date), total: v.total, count: v.count, date: v.date }));
}

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; payload: { count: number } }>; label?: string }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: 'white', border: '0.5px solid #E8E8E5', borderRadius: 8, padding: '8px 12px', fontSize: 11, fontFamily: "'Sora', sans-serif", boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
      <p style={{ margin: '0 0 2px', fontWeight: 600, color: '#2B2F36' }}>Week of {label}</p>
      <p style={{ margin: '0 0 2px', color: '#C8102E' }}>{formatRD(payload[0].value)} total</p>
      <p style={{ margin: 0, color: '#767676' }}>{payload[0].payload.count} donation{payload[0].payload.count !== 1 ? 's' : ''}</p>
    </div>
  );
};

const PAGE_SIZE = 20;

export default function AnalyticsClient({ campaign, initialDonations }: { campaign: Campaign; initialDonations: Donation[] }) {
  const router = useRouter();
  const [donations] = useState<Donation[]>(initialDonations);
  const loading = false;
  const [search, setSearch] = useState('');
  const [shown, setShown] = useState(PAGE_SIZE);

  const totalRaised = useMemo(() => donations.reduce((s, d) => s + d.amount, 0), [donations]);
  const donorCount = donations.length;
  const avgDonation = donorCount > 0 ? Math.round(totalRaised / donorCount) : 0;
  const daysLeft = daysUntil(campaign.fundraising_deadline);
  const weeklyData = useMemo(() => buildWeeklyData(donations), [donations]);

  const filtered = useMemo(() =>
    donations.filter(d => d.donor_name.toLowerCase().includes(search.toLowerCase())),
    [donations, search]
  );

  async function handleExport() {
    const { utils, writeFile } = await import('xlsx');
    const rows = donations.map(d => ({
      'Nombre completo': d.donor_name,
      'Correo electrónico': d.donor_email ?? '',
      'Monto (RD$)': d.amount,
      'Fecha': new Date(d.created_at).toLocaleDateString('es-DO', { day: '2-digit', month: '2-digit', year: 'numeric' }),
      'ID Donación': d.id,
    }));
    const ws = utils.json_to_sheet(rows);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, 'Donaciones');
    const today = new Date().toISOString().split('T')[0];
    writeFile(wb, `reporte-jce-${campaign.slug}-${today}.xlsx`);
  }

  const statCards = [
    { label: 'Total raised', value: formatRD(totalRaised) },
    { label: 'Total donors', value: donorCount.toLocaleString() },
    { label: 'Avg donation', value: formatRD(avgDonation) },
    { label: 'Days to deadline', value: daysLeft != null ? String(daysLeft) : '—' },
  ];

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '40px 32px', fontFamily: "'Sora', sans-serif", background: 'white', minHeight: '100vh' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <button onClick={() => router.push('/dashboard')} style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: '#767676', fontFamily: 'inherit', padding: 0 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#767676" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          Back to dashboard
        </button>
        <h1 style={{ fontSize: 20, fontWeight: 600, color: '#2B2F36', margin: 0, letterSpacing: '-0.02em' }}>Donation analytics</h1>
        <button onClick={handleExport} style={{ display: 'flex', alignItems: 'center', gap: 6, border: '0.5px solid #E8E8E5', background: 'white', color: '#2B2F36', fontSize: 12, fontWeight: 600, padding: '8px 16px', borderRadius: 4, cursor: 'pointer', fontFamily: 'inherit' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
          Export JCE report
        </button>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {statCards.map(s => (
          <div key={s.label} style={{ background: 'white', border: '1px solid #E8E8E5', borderRadius: 10, padding: 20 }}>
            <p style={{ fontSize: 11, color: '#767676', margin: '0 0 6px', fontWeight: 500 }}>{s.label}</p>
            <p style={{ fontSize: 22, fontWeight: 700, color: '#2B2F36', margin: 0, letterSpacing: '-0.03em' }}>{loading ? '—' : s.value}</p>
          </div>
        ))}
      </div>

      {/* Chart */}
      <div style={{ background: 'white', border: '1px solid #E8E8E5', borderRadius: 10, padding: 24, marginBottom: 24 }}>
        <p style={{ fontSize: 15, fontWeight: 600, color: '#2B2F36', margin: '0 0 4px' }}>Donations over time</p>
        <p style={{ fontSize: 12, color: '#767676', margin: '0 0 20px' }}>Total raised per week over the last 6 months</p>
        {weeklyData.length === 0
          ? <div style={{ height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#767676', fontSize: 13 }}>No data yet</div>
          : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={weeklyData} barCategoryGap="30%">
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#767676', fontFamily: "'Sora', sans-serif" }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={(v: number) => `RD$${(v/1000).toFixed(0)}k`} tick={{ fontSize: 10, fill: '#767676', fontFamily: "'Sora', sans-serif" }} axisLine={false} tickLine={false} width={56} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="total" fill="#C8102E" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )
        }
      </div>

      {/* Table */}
      <div style={{ background: 'white', border: '1px solid #E8E8E5', borderRadius: 10, overflow: 'hidden' }}>
        {/* Table header bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #E8E8E5' }}>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#2B2F36', margin: 0 }}>Recent donations</p>
          <div style={{ position: 'relative' }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#BBBBBB" strokeWidth="2" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)' }}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>
            <input value={search} onChange={e => { setSearch(e.target.value); setShown(PAGE_SIZE); }} placeholder="Search by name…" style={{ height: 32, width: 220, border: '0.5px solid #E8E8E5', borderRadius: 6, padding: '0 10px 0 30px', fontSize: 12, fontFamily: 'inherit', outline: 'none' }} />
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: '#767676', fontSize: 13 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center' }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: '#2B2F36', margin: '0 0 6px' }}>No donations yet</p>
            <p style={{ fontSize: 13, color: '#767676', margin: 0 }}>Share your donation link to get started.</p>
          </div>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '35%' }} /><col style={{ width: '15%' }} /><col style={{ width: '20%' }} /><col style={{ width: '15%' }} /><col style={{ width: '15%' }} />
              </colgroup>
              <thead>
                <tr style={{ background: '#F6F6F4' }}>
                  {['Donor', 'Amount', 'Date', 'Type', 'ID'].map(h => (
                    <th key={h} style={{ padding: '10px 16px', fontSize: 10, fontWeight: 600, color: '#767676', textTransform: 'uppercase', letterSpacing: '0.06em', textAlign: 'left', borderBottom: '1px solid #E8E8E5' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, shown).map((d, i) => (
                  <tr key={d.id} style={{ borderBottom: i < shown - 1 ? '0.5px solid #F0F0F0' : 'none', background: 'white' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#FAFAFA')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'white')}
                  >
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#2B2F36', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.donor_name}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, color: '#16A34A' }}>+{formatRD(d.amount)}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#2B2F36' }}>{formatDate(d.created_at)}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: 10, fontWeight: 600, background: '#F6F6F4', color: '#767676', borderRadius: 20, padding: '2px 8px' }}>
                        {d.is_mock ? 'Demo' : 'Live'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 10, color: '#767676', fontFamily: 'monospace' }}>{d.id.slice(0, 8)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '0.5px solid #E8E8E5' }}>
              <span style={{ fontSize: 12, color: '#767676' }}>Showing {Math.min(shown, filtered.length)} of {filtered.length} donations</span>
              {shown < filtered.length && (
                <button onClick={() => setShown(s => s + PAGE_SIZE)} style={{ fontSize: 12, color: '#2B2F36', background: 'none', border: '0.5px solid #E8E8E5', borderRadius: 4, padding: '6px 14px', cursor: 'pointer', fontFamily: 'inherit' }}>
                  Load more
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
