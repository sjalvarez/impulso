'use client';

import { useState } from 'react';
import { Link } from '@/lib/i18n/navigation';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

interface Props {
  campaign: any;
  locale: string;
}

export default function EditCampaignForm({ campaign, locale }: Props) {
  const [name, setName] = useState<string>(campaign.candidate_name ?? '');
  const [desc, setDesc] = useState<string>(campaign.description ?? '');
  const [goal, setGoal] = useState<number>(campaign.goal_amount ?? 0);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createBrowserSupabaseClient();
    const { error: updateError } = await supabase
      .from('campaigns')
      .update({ candidate_name: name, description: desc, goal_amount: goal })
      .eq('id', campaign.id);

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  }

  const labelStyle: React.CSSProperties = {
    fontSize: '12px',
    fontWeight: 600,
    color: '#2B2F36',
    marginBottom: '6px',
    display: 'block',
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    height: '40px',
    border: '1px solid #E8E8E5',
    borderRadius: '6px',
    padding: '0 12px',
    fontSize: '13px',
    fontFamily: 'inherit',
    boxSizing: 'border-box',
  };

  return (
    <div style={{ background: 'white', maxWidth: '560px', margin: '0 auto', padding: '60px 24px' }}>
      <h1 style={{ fontSize: '22px', fontWeight: 600, color: '#2B2F36', letterSpacing: '-0.02em', marginBottom: '6px' }}>
        Edit campaign
      </h1>
      <p style={{ fontSize: '13px', color: '#767676', marginBottom: '32px' }}>
        Update your campaign details.
      </p>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Campaign name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Campaign description</label>
          <textarea
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            maxLength={280}
            style={{
              width: '100%',
              height: '100px',
              border: '1px solid #E8E8E5',
              borderRadius: '6px',
              padding: '10px 12px',
              fontSize: '13px',
              fontFamily: 'inherit',
              resize: 'vertical',
              boxSizing: 'border-box',
            }}
          />
          <p style={{ fontSize: '11px', color: '#767676', margin: '4px 0 0' }}>
            {desc.length} / 280
          </p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>Campaign goal (RD$)</label>
          <input
            type="number"
            value={goal}
            onChange={(e) => setGoal(Number(e.target.value))}
            style={inputStyle}
          />
        </div>

        <p style={{ fontSize: '11px', color: '#767676', marginBottom: '24px' }}>
          Your donation link (impulso.do/dona/{campaign.slug}) and JCE registration number cannot be changed.
        </p>

        {error && (
          <p style={{ fontSize: '13px', color: '#C8102E', marginBottom: '16px' }}>
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            height: '44px',
            background: '#C8102E',
            color: 'white',
            fontFamily: 'inherit',
            fontSize: '14px',
            fontWeight: 600,
            borderRadius: '4px',
            border: 'none',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Saving…' : 'Save changes'}
        </button>
      </form>

      <Link
        href="/dashboard"
        style={{
          fontSize: '12px',
          color: '#767676',
          textDecoration: 'none',
          display: 'block',
          marginTop: '16px',
        }}
      >
        ← Back to dashboard
      </Link>

      {showToast && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: '#16A34A',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '8px',
          fontSize: '13px',
          fontWeight: 600,
          zIndex: 1000,
        }}>
          Changes saved.
        </div>
      )}
    </div>
  );
}
