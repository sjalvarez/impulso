import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const { message, campaignId } = await request.json();

  // Use service role so unauthenticated visitors (donors) can still use the chatbot
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
  const { data: campaign } = await sb.from('campaigns').select('candidate_name, whatsapp, campaign_platform_url').eq('id', campaignId).single();

  if (!campaign?.campaign_platform_url) {
    return NextResponse.json({ reply: 'Campaign platform document not available yet.' });
  }

  // Dynamic import — keeps Turbopack from bundling pdf-parse at build time
  let pdfText = '';
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod = await (Function('return import("pdf-parse")')() as Promise<any>);
    const PDFParse = mod.PDFParse ?? mod.default?.PDFParse ?? mod.default;
    const parser = new PDFParse({ url: campaign.campaign_platform_url });
    const result = await parser.getText();
    pdfText = result.text.slice(0, 8000);
    await parser.destroy();
  } catch {
    return NextResponse.json({ reply: 'Campaign platform document not available yet.' });
  }

  const whatsapp = campaign.whatsapp ?? 'the campaign team';
  const systemPrompt = `You are a campaign assistant for ${campaign.candidate_name}. Answer questions ONLY using the information provided below from their official campaign platform document. Keep answers concise (2-4 sentences max). If the answer is not in the document, respond exactly with: "I don't have that information — please contact the campaign directly on WhatsApp: ${whatsapp}." Do not invent, assume, or extrapolate anything not explicitly stated in the document.

CAMPAIGN PLATFORM DOCUMENT:
${pdfText}`;

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
      messages: [{ role: 'user', content: message }],
    }),
  });

  if (!apiRes.ok) {
    return NextResponse.json({ reply: 'Sorry, I could not process that.' });
  }

  const data = await apiRes.json() as { content: Array<{ type: string; text: string }> };
  const block = data.content[0];
  const reply = block?.type === 'text' ? block.text : 'Sorry, I could not process that.';
  return NextResponse.json({ reply });
}
