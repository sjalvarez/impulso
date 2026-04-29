import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  const { message, campaignId } = await request.json();

  // Service role — works for unauthenticated donors
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

  // Build context from whatever we have
  let context = `Candidate: ${campaign.candidate_name}\nRunning for: ${campaign.race_type ?? 'office'}\nParty: ${campaign.party_affiliation ?? 'unknown'}\n`;

  // Add AI summary if available
  const summary = campaign.ai_summary as { intro?: string; proposals?: { title: string; description: string }[] } | null;
  if (summary?.intro) context += `\nCampaign intro: ${summary.intro}\n`;

  const proposals = (campaign.proposal_overrides as { title: string; description: string }[] | null)
    ?? summary?.proposals;
  if (proposals?.length) {
    context += '\nKey proposals:\n';
    proposals.forEach((p: { title: string; description: string }, i: number) => {
      context += `${i + 1}. ${p.title}: ${p.description}\n`;
    });
  }

  // Fetch PDF bytes manually and parse — passing URL directly is unreliable in Vercel serverless
  if (campaign.campaign_platform_url) {
    try {
      const pdfRes = await fetch(campaign.campaign_platform_url);
      if (!pdfRes.ok) throw new Error(`PDF fetch failed: ${pdfRes.status}`);
      const arrayBuffer = await pdfRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mod = await (Function('return import("pdf-parse")')() as Promise<any>);
      const PDFParse = mod.PDFParse ?? mod.default?.PDFParse ?? mod.default;
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      const result = await parser.getText();
      const pdfText = result.text.slice(0, 7000);
      await parser.destroy();
      if (pdfText.trim()) {
        // PDF ingested — replace the summary context with the full document
        context = `Candidate: ${campaign.candidate_name}\nRunning for: ${campaign.race_type ?? 'office'}\nParty: ${campaign.party_affiliation ?? 'unknown'}\n\nFull campaign platform document:\n${pdfText}`;
      }
    } catch (e) {
      console.error('[chat] PDF parse failed, falling back to summary:', e);
      // summary context already built above, carry on
    }
  }

  const systemPrompt = `You are a helpful campaign assistant for ${campaign.candidate_name}. Answer questions about their campaign using ONLY the information below. Keep answers concise (2-4 sentences). ${contactLine} Do not invent anything not stated below.

CAMPAIGN INFORMATION:
${context}`;

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
    return NextResponse.json({ reply: 'Sorry, I could not process that right now.' });
  }

  const data = await apiRes.json() as { content: Array<{ type: string; text: string }> };
  const block = data.content[0];
  const reply = block?.type === 'text' ? block.text : 'Sorry, I could not process that right now.';
  return NextResponse.json({ reply });
}
