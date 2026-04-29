import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return NextResponse.json({
      error: 'Missing env vars',
      hasUrl: !!url,
      hasKey: !!key,
    });
  }

  const sb = createClient(url, key);

  const { data: campaigns, error: campError } = await sb
    .from('campaigns')
    .select('id, candidate_name, user_id')
    .limit(5);

  if (campError) {
    return NextResponse.json({ error: 'Campaign query failed', detail: campError.message });
  }

  const results = await Promise.all(
    (campaigns ?? []).map(async (c) => {
      const { count, error } = await sb
        .from('donations')
        .select('*', { count: 'exact', head: true })
        .eq('campaign_id', c.id);
      return { candidate: c.candidate_name, campaignId: c.id, donationCount: count, error: error?.message };
    })
  );

  return NextResponse.json({ ok: true, campaigns: results });
}
