import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const { message, campaignId, locale = 'en' } = await request.json();

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: campaign } = await sb
    .from('campaigns')
    .select('candidate_name, whatsapp, race_type, party_affiliation, ai_summary, proposal_overrides, chatbot_context')
    .eq('id', campaignId)
    .single();

  if (!campaign) {
    return NextResponse.json({ reply: 'Campaign not found.' });
  }

  const whatsapp = campaign.whatsapp ?? null;
  const contactLine = whatsapp
    ? `If the answer is not in the information provided, say: "I don't have that information — please contact the campaign directly on WhatsApp: ${whatsapp}."`
    : `If the answer is not in the information provided, say: "I don't have that information — please reach out to the campaign directly."`;

  const langInstruction = locale === 'es' ? 'Respond in Spanish.' : 'Respond in English.';

  const systemPrompt = `You are a helpful campaign assistant for ${campaign.candidate_name}. Answer questions about their campaign using ONLY the information provided. Keep answers concise (2-4 sentences). ${contactLine} Do not invent anything. ${langInstruction}`;

  // Build context — prefer comprehensive chatbot_context (generated alongside ai_summary),
  // fall back to ai_summary bullets if not yet generated
  const summary = campaign.ai_summary as { intro?: string; proposals?: { title: string; description: string }[] } | null;
  const proposals = (campaign.proposal_overrides as { title: string; description: string }[] | null) ?? summary?.proposals;
  const chatbotContext = campaign.chatbot_context as string | null;

  let ctx = `Candidate: ${campaign.candidate_name}\nRunning for: ${campaign.race_type ?? 'office'}\nParty: ${campaign.party_affiliation ?? 'unknown'}\n`;

  if (chatbotContext) {
    ctx += `\nCampaign platform (comprehensive):\n${chatbotContext}\n`;
  } else {
    // Fall back to summary bullets until chatbot_context is generated
    if (summary?.intro) ctx += `\nCampaign intro: ${summary.intro}\n`;
    if (proposals?.length) {
      ctx += '\nKey proposals:\n';
      proposals.forEach((p, i) => { ctx += `${i + 1}. ${p.title}: ${p.description}\n`; });
    }
  }

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
      messages: [{ role: 'user', content: `Campaign information:\n${ctx}\n\nQuestion: ${message}` }],
    }),
  });

  if (!apiRes.ok) {
    const err = await apiRes.text();
    console.error('[chat] Anthropic error:', apiRes.status, err);
    let hint = 'Sorry, I could not process that right now.';
    try {
      const parsed = JSON.parse(err);
      if (parsed?.error?.type === 'rate_limit_error') hint = 'Rate limit hit — please try again in a moment.';
      else if (parsed?.error?.message) hint = `Error: ${parsed.error.message.slice(0, 120)}`;
    } catch { /* ignore */ }
    return NextResponse.json({ reply: hint });
  }

  const data = await apiRes.json() as { content: Array<{ type: string; text: string }> };
  const reply = data.content[0]?.type === 'text' ? data.content[0].text : 'Sorry, I could not process that right now.';
  return NextResponse.json({ reply });
}
