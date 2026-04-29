import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const { campaign_id, donor_name, donor_email, donor_cedula, amount } = await request.json();

  if (!campaign_id || !donor_name || !amount) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { error } = await sb.from('donations').insert({
    campaign_id,
    donor_name,
    donor_email: donor_email || null,
    donor_cedula: donor_cedula || null,
    amount,
    is_mock: false,
  });

  if (error) {
    console.error('[donate] insert error:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
