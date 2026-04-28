'use client';

import { useState } from 'react';
import { useRouter } from '@/lib/i18n/navigation';

interface Props {
  campaign: any;
  donations: any[];
  locale: string;
}

export default function DashboardClient({ campaign, donations, locale }: Props) {
  const router = useRouter();
  const [copyLabel, setCopyLabel] = useState('Copy donation link');

  const totalRaised = donations.reduce((s, d) => s + (d.amount ?? 0), 0);
  const totalDonors = donations.length;
  const avgDonation = totalDonors > 0 ? Math.round(totalRaised / totalDonors) : 0;
  const daysLeft = campaign.election_deadline
    ? Math.ceil((new Date(campaign.election_deadline).getTime() - Date.now()) / 86400000)
    : null;

  const donationLink = `https://impulso.do/dona/${campaign.slug}`;

  function handleCopyLink() {
    navigator.clipboard.writeText(donationLink);
    setCopyLabel('Copied ✓');
    setTimeout(() => setCopyLabel('Copy donation link'), 2000);
  }

  function exportCSV() {
    const headers = ['Nombre', 'Cédula', 'Monto (RD$)', 'Fecha', 'Tipo'];
    const rows = donations.map((d) => [
      d.donor_name ?? 'Anónimo',
      d.donor_cedula ?? '',
      d.amount ?? 0,
      new Date(d.created_at).toLocaleDateString('es-DO'),
      d.recurring ? 'Recurrente' : 'Único',
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const date = new Date().toISOString().split('T')[0];
    a.download = `reporte-jce-${campaign.slug}-${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Status banner config
  type StatusKey = 'pending_verification' | 'active' | 'suspended';
  const statusConfig: Record<StatusKey, {
    bg: string;
    border: string;
    icon: string;
    textColor: string;
    text: string;
    pillBg: string;
    pillColor: string;
    pillText: string;
  }> = {
    pending_verification: {
      bg: '#FEF3C7',
      border: '3px solid #F59E0B',
      icon: '⏳',
      textColor: '#92400E',
      text: 'Your campaign is pending JCE verification. Our team will review and activate it within 1–2 business days.',
      pillBg: '#FDE68A',
      pillColor: '#92400E',
      pillText: 'Pending verification',
    },
    active: {
      bg: '#F0FDF4',
      border: '3px solid #16A34A',
      icon: '✅',
      textColor: '#166534',
      text: 'Your campaign is live. Your donation link is active.',
      pillBg: '#DCFCE7',
      pillColor: '#16A34A',
      pillText: 'Active',
    },
    suspended: {
      bg: '#FFF5F5',
      border: '3px solid #C8102E',
      icon: '🚫',
      textColor: '#7F1D1D',
      text: 'Your campaign has been suspended. Contact hello@impulso.do.',
      pillBg: '#FEE2E2',
      pillColor: '#C8102E',
      pillText: 'Suspended',
    },
  };

  const status = (campaign.status as StatusKey) ?? 'pending_verification';
  const banner = statusConfig[status] ?? statusConfig['pending_verification'];

  const statCards = [
    { label: 'Total raised', value: `RD$${totalRaised.toLocaleString('es-DO')}` },
    { label: 'Donors', value: `${totalDonors}` },
    { label: 'Avg. donation', value: `RD$${avgDonation.toLocaleString('es-DO')}` },
    { label: 'Days left', value: daysLeft !== null ? `${daysLeft}` : '—' },
  ];

  return (
    <div style={{ background: 'white', maxWidth: '1100px', margin: '0 auto', padding: '40px 32px' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px' }}>
        <div>
          <p style={{ fontSize: '22px', fontWeight: 700, color: '#2B2F36', letterSpacing: '-0.02em', margin: '0 0 4px' }}>
            {campaign.candidate_name}
          </p>
          <a
            href={donationLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '12px', color: '#767676', textDecoration: 'none' }}
            onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
            onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
          >
            {donationLink}
          </a>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => router.push('/dashboard/edit')}
            style={{
              border: '1px solid #E8E8E5',
              background: 'white',
              color: '#2B2F36',
              fontFamily: 'inherit',
              fontSize: '12px',
              fontWeight: 600,
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            Edit campaign
          </button>
          <button
            onClick={handleCopyLink}
            style={{
              background: '#C8102E',
              color: 'white',
              border: 'none',
              fontFamily: 'inherit',
              fontSize: '12px',
              fontWeight: 600,
              padding: '8px 16px',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {copyLabel}
          </button>
        </div>
      </div>

      {/* Status banner */}
      <div style={{
        borderRadius: '8px',
        padding: '12px 16px',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        background: banner.bg,
        borderLeft: banner.border,
      }}>
        <span>{banner.icon}</span>
        <span style={{ flex: 1, fontSize: '13px', color: banner.textColor }}>
          {banner.text}
        </span>
        <span style={{
          background: banner.pillBg,
          color: banner.pillColor,
          fontSize: '11px',
          fontWeight: 600,
          padding: '3px 10px',
          borderRadius: '20px',
          whiteSpace: 'nowrap',
        }}>
          {banner.pillText}
        </span>
      </div>

      {/* Stats grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr 1fr',
        gap: '16px',
        marginBottom: '28px',
      }}>
        {statCards.map((card) => (
          <div
            key={card.label}
            style={{
              background: 'white',
              border: '1px solid #E8E8E5',
              borderRadius: '10px',
              padding: '20px',
            }}
          >
            <p style={{
              fontSize: '10px',
              textTransform: 'uppercase',
              color: '#767676',
              letterSpacing: '0.08em',
              margin: '0 0 6px',
            }}>
              {card.label}
            </p>
            <p style={{
              fontSize: '28px',
              fontWeight: 700,
              color: '#2B2F36',
              letterSpacing: '-0.03em',
              margin: 0,
            }}>
              {card.value}
            </p>
          </div>
        ))}
      </div>

      {/* Donations table */}
      <p style={{ fontSize: '16px', fontWeight: 600, color: '#2B2F36', margin: '0 0 14px' }}>
        Recent donations
      </p>
      <div style={{ border: '1px solid #E8E8E5', borderRadius: '10px', overflow: 'hidden' }}>
        {donations.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', fontSize: '13px', color: '#767676' }}>
            No donations yet. Share your link to get started!
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#F6F6F4' }}>
                {['Donor', 'Amount', 'Date', 'Type'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '10px 16px',
                      fontSize: '10px',
                      textTransform: 'uppercase',
                      color: '#767676',
                      letterSpacing: '0.06em',
                      fontWeight: 600,
                      textAlign: 'left',
                      borderBottom: '1px solid #E8E8E5',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {donations.map((d, i) => (
                <tr key={d.id ?? i}>
                  <td style={{ padding: '12px 16px', borderBottom: '0.5px solid #F0F0F0', fontSize: '13px', color: '#2B2F36' }}>
                    {d.donor_name ?? 'Anonymous'}
                  </td>
                  <td style={{ padding: '12px 16px', borderBottom: '0.5px solid #F0F0F0', fontSize: '13px', fontWeight: 600, color: '#16A34A' }}>
                    +RD${d.amount?.toLocaleString('es-DO')}
                  </td>
                  <td style={{ padding: '12px 16px', borderBottom: '0.5px solid #F0F0F0', fontSize: '13px', color: '#2B2F36' }}>
                    {new Date(d.created_at).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '12px 16px', borderBottom: '0.5px solid #F0F0F0', fontSize: '13px', color: '#2B2F36' }}>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      borderRadius: '20px',
                      padding: '2px 8px',
                      background: d.recurring ? '#EFF6FF' : '#F6F6F4',
                      color: d.recurring ? '#1D4ED8' : '#767676',
                    }}>
                      {d.recurring ? 'Recurring' : 'One-time'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{ marginTop: '16px' }}>
        <button
          onClick={exportCSV}
          style={{
            border: '1px solid #E8E8E5',
            background: 'white',
            color: '#2B2F36',
            fontFamily: 'inherit',
            fontSize: '12px',
            fontWeight: 600,
            padding: '8px 16px',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Export JCE report
        </button>
      </div>
    </div>
  );
}
