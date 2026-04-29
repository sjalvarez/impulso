'use server';
import { PDFParse } from 'pdf-parse';
import { createServerSupabaseClient } from '@/lib/supabase/server';

async function callClaude(system: string, userContent: string, maxTokens: number): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userContent }],
    }),
  });
  if (!res.ok) return '';
  const data = await res.json() as { content: Array<{ type: string; text: string }> };
  const block = data.content[0];
  return block?.type === 'text' ? block.text : '';
}

export async function generateCampaignSummary(campaignId: string) {
  const sb = await createServerSupabaseClient();
  const { data: campaign } = await sb.from('campaigns').select('campaign_platform_url, candidate_name').eq('id', campaignId).single();

  if (!campaign?.campaign_platform_url) return null;

  // Extract text using pdf-parse v2 (pass URL directly — library fetches it)
  let pdfText = '';
  try {
    const parser = new PDFParse({ url: campaign.campaign_platform_url });
    const result = await parser.getText();
    pdfText = result.text.slice(0, 8000); // limit context
    await parser.destroy();
  } catch {
    return null;
  }

  // Call Claude
  const system = `You are a campaign assistant. Based ONLY on the campaign platform document provided, generate:
1. A short intro paragraph (2-3 sentences, warm and direct, written as if introducing the candidate to a donor)
2. Exactly 3 key proposals (each with a short title max 5 words, and a description max 2 sentences)

Respond in JSON only, no markdown, no preamble:
{
  "intro": "...",
  "proposals": [
    { "title": "...", "description": "..." },
    { "title": "...", "description": "..." },
    { "title": "...", "description": "..." }
  ]
}

If the document does not contain enough information for a proposal, omit it. Never invent facts not present in the document.`;

  const text = await callClaude(system, `Campaign platform document:\n\n${pdfText}`, 1000);
  let summary = null;
  try {
    summary = JSON.parse(text);
  } catch {
    return null;
  }

  await sb.from('campaigns').update({ ai_summary: summary }).eq('id', campaignId);
  return summary;
}
