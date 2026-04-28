'use client';

import { useState } from 'react';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

interface Props {
  campaigns: any[];
}

export default function AdminCampaignsClient({ campaigns: initialCampaigns }: Props) {
  const [rows, setRows] = useState<any[]>(initialCampaigns);
  const [loading, setLoading] = useState<Set<string>>(new Set());

  async function updateStatus(id: string, status: string) {
    setLoading((prev) => new Set(prev).add(id));
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase
      .from('campaigns')
      .update({ status })
      .eq('id', id);
    if (error) {
      alert(`Update failed: ${error.message}`);
    } else {
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, status } : r)));
    }
    setLoading((prev) => {
      const s = new Set(prev);
      s.delete(id);
      return s;
    });
  }

  type StatusKey = 'pending_verification' | 'active' | 'suspended';

  const pillStyle: Record<StatusKey, { background: string; color: string; text: string }> = {
    pending_verification: { background: '#FDE68A', color: '#92400E', text: 'Pending' },
    active: { background: '#DCFCE7', color: '#16A34A', text: 'Active' },
    suspended: { background: '#FEE2E2', color: '#C8102E', text: 'Suspended' },
  };

  return (
    <div style={{ background: 'white', maxWidth: '1100px', margin: '0 auto', padding: '40px 32px' }}>
      <h1 style={{
        fontSize: '22px',
        fontWeight: 600,
        color: '#2B2F36',
        letterSpacing: '-0.02em',
        marginBottom: '28px',
      }}>
        Impulso Admin — Campaign Review
      </h1>

      <div style={{ border: '1px solid #E8E8E5', borderRadius: '10px', overflow: 'hidden', width: '100%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#F6F6F4' }}>
              {['Candidate name', 'Campaign name', 'JCE Number', 'Status', 'Election type', 'Created', 'Actions'].map((h) => (
                <th
                  key={h}
                  style={{
                    fontSize: '10px',
                    textTransform: 'uppercase',
                    color: '#767676',
                    letterSpacing: '0.06em',
                    padding: '10px 16px',
                    borderBottom: '1px solid #E8E8E5',
                    textAlign: 'left',
                    fontWeight: 600,
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const status = (c.status as StatusKey) ?? 'pending_verification';
              const pill = pillStyle[status] ?? pillStyle['pending_verification'];
              const isLoading = loading.has(c.id);

              return (
                <tr key={c.id}>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#2B2F36', borderBottom: '0.5px solid #F0F0F0' }}>
                    {c.candidate_name}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#2B2F36', borderBottom: '0.5px solid #F0F0F0' }}>
                    {c.slug}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#2B2F36', borderBottom: '0.5px solid #F0F0F0' }}>
                    {c.jce_registration_number ?? '—'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#2B2F36', borderBottom: '0.5px solid #F0F0F0' }}>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: 600,
                      padding: '3px 10px',
                      borderRadius: '20px',
                      background: pill.background,
                      color: pill.color,
                    }}>
                      {pill.text}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#2B2F36', borderBottom: '0.5px solid #F0F0F0' }}>
                    {c.election_type ?? '—'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#2B2F36', borderBottom: '0.5px solid #F0F0F0' }}>
                    {new Date(c.created_at).toLocaleDateString('es-DO')}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#2B2F36', borderBottom: '0.5px solid #F0F0F0' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {status !== 'active' && (
                        <button
                          onClick={() => updateStatus(c.id, 'active')}
                          disabled={isLoading}
                          style={{
                            background: '#16A34A',
                            color: 'white',
                            fontSize: '11px',
                            fontWeight: 600,
                            borderRadius: '4px',
                            padding: '4px 12px',
                            border: 'none',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            fontFamily: 'inherit',
                            opacity: isLoading ? 0.6 : 1,
                          }}
                        >
                          Approve
                        </button>
                      )}
                      {status !== 'suspended' && (
                        <button
                          onClick={() => updateStatus(c.id, 'suspended')}
                          disabled={isLoading}
                          style={{
                            background: '#FEE2E2',
                            color: '#C8102E',
                            fontSize: '11px',
                            fontWeight: 600,
                            borderRadius: '4px',
                            padding: '4px 12px',
                            border: 'none',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            fontFamily: 'inherit',
                            opacity: isLoading ? 0.6 : 1,
                          }}
                        >
                          Suspend
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
