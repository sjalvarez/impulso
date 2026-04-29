import Link from 'next/link';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export default async function ThankYouPage({ params, searchParams }: { params: Promise<{ locale: string; slug: string }>; searchParams: Promise<{ amount?: string }> }) {
  const { slug } = await params;
  const { amount } = await searchParams;
  const sb = await createServerSupabaseClient();
  const { data: campaign } = await sb.from('campaigns').select('candidate_name, slug').eq('slug', slug).single();
  if (!campaign) return null;

  const amountFmt = amount ? parseInt(amount).toLocaleString('es-DO') : '0';
  const shareText = encodeURIComponent(`I just donated to ${campaign.candidate_name}'s campaign on Impulso! impulso.do/dona/${campaign.slug}`);

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Sora', sans-serif" }}>
      <div style={{ maxWidth: 440, width: '100%', background: 'white', borderRadius: 16, padding: '40px 32px', textAlign: 'center', border: '0.5px solid #E8E8E5' }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16A34A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: '#2B2F36', letterSpacing: '-0.02em', margin: '0 0 10px' }}>Thank you for your support!</h1>
        <p style={{ fontSize: 13, color: '#767676', lineHeight: 1.65, margin: '0 0 24px' }}>
          Your donation of <strong>RD${amountFmt}</strong> to {campaign.candidate_name}&apos;s campaign has been recorded.
        </p>
        <a
          href={`https://wa.me/?text=${shareText}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'inline-block', background: '#25D366', color: 'white', padding: '11px 24px', borderRadius: 6, fontSize: 13, fontWeight: 600, textDecoration: 'none', marginBottom: 12 }}
        >
          Share on WhatsApp
        </a>
        <div style={{ marginBottom: 24 }}>
          <a
            href={`/dona/${campaign.slug}`}
            style={{ fontSize: 12, color: '#767676', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Back to donation page
          </a>
        </div>
        <p style={{ fontSize: 10, color: '#767676', margin: 0 }}>Powered by Impulso</p>
      </div>
    </div>
  );
}
