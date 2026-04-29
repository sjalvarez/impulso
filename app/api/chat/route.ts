import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const { message, campaignId } = await request.json();

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: campaign } = await sb
    .from('campaigns')
    .select('candidate_name, whatsapp, campaign_platform_url, race_type, party_affiliation, ai_summary, proposal_overrides')
    .eq('id', campaignId)
    .single();

  if (!campaign) {
    return NextResponse.json({ reply: 'Campaign not found.' });
  }

  const whatsapp = campaign.whatsapp ?? null;
  const contactLine = whatsapp
    ? `If the answer is not in the information provided, say: "I don't have that information — please contact the campaign directly on WhatsApp: ${whatsapp}."`
    : `If the answer is not in the information provided, say: "I don't have that information — please reach out to the campaign directly."`;

  const systemPrompt = `You are a helpful campaign assistant for ${campaign.candidate_name}. Answer questions about their campaign using ONLY the information provided. Keep answers concise (2-4 sentences). ${contactLine} Do not invent anything not stated in the provided materials.`;

  // Build user content — PDF document if available, otherwise text summary
  type ContentBlock =
    | { type: 'document'; source: { type: 'base64'; media_type: 'application/pdf'; data: string } }
    | { type: 'text'; text: string };

  const content: ContentBlock[] = [];

  if (campaign.campaign_platform_url) {
    try {
      const pdfRes = await fetch(campaign.campaign_platform_url);
      if (!pdfRes.ok) throw new Error(`${pdfRes.status}`);
      const arrayBuffer = await pdfRes.arrayBuffer();
      const pdfBase64 = Buffer.from(arrayBuffer).toString('base64');
      content.push({
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 },
      });
    } catch (e) {
      console.error('[chat] PDF fetch failed, falling back to summary:', e);
    }
  }

  // Always add summary context as text (fallback or supplement)
  if (content.length === 0) {
    const summary = campaign.ai_summary as { intro?: string; proposals?: { title: string; description: string }[] } | null;
    const proposals = (campaign.proposal_overrides as { title: string; description: string }[] | null) ?? summary?.proposals;
    let ctx = `Candidate: ${campaign.candidate_name}\nRunning for: ${campaign.race_type ?? 'office'}\nParty: ${campaign.party_affiliation ?? 'unknown'}\n`;
    if (summary?.intro) ctx += `\nCampaign intro: ${summary.intro}\n`;
    if (proposals?.length) {
      ctx += '\nKey proposals:\n';
      proposals.forEach((p, i) => { ctx += `${i + 1}. ${p.title}: ${p.description}\n`; });
    }
    content.push({ type: 'text', text: ctx });
  }

  content.push({ type: 'text', text: message });

  const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: 'user', content }],
    }),
  });

  if (!apiRes.ok) {
    return NextResponse.json({ reply: 'Sorry, I could not process that right now.' });
  }

  const data = await apiRes.json() as { content: Array<{ type: string; text: string }> };
  const reply = data.content[0]?.type === 'text' ? data.content[0].text : 'Sorry, I could not process that right now.';
  return NextResponse.json({ reply });
}
