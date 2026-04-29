'use server';
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
  if (!res.ok) {
    const err = await res.text();
    console.error('[generate-summary] Anthropic error:', res.status, err);
    return '';
  }
  const data = await res.json() as { content: Array<{ type: string; text: string }> };
  const block = data.content[0];
  return block?.type === 'text' ? block.text : '';
}

function extractJson(raw: string): string {
  // Strip markdown code fences if present: ```json ... ``` or ``` ... ```
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  // Find first { and last } in case there's surrounding text
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) return raw.slice(start, end + 1);
  return raw.trim();
}

export async function generateCampaignSummary(campaignId: string): Promise<{
  intro: string;
  proposals: { title: string; description: string }[];
} | null> {
  const sb = await createServerSupabaseClient();
  const { data: campaign, error: campError } = await sb
    .from('campaigns')
    .select('campaign_platform_url, candidate_name')
    .eq('id', campaignId)
    .single();

  if (campError) {
    console.error('[generate-summary] Campaign fetch error:', campError.message);
    return null;
  }
  if (!campaign?.campaign_platform_url) {
    console.error('[generate-summary] No campaign_platform_url for campaign:', campaignId);
    return null;
  }

  // Extract text — dynamic import keeps Turbopack from bundling pdf-parse at build time
  let pdfText = '';
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod = await (Function('return import("pdf-parse")')() as Promise<any>);
    const PDFParse = mod.PDFParse ?? mod.default?.PDFParse ?? mod.default;
    const parser = new PDFParse({ url: campaign.campaign_platform_url });
    const result = await parser.getText();
    pdfText = result.text.slice(0, 8000);
    await parser.destroy();
  } catch (e) {
    console.error('[generate-summary] PDF parse error:', e);
    return null;
  }

  if (!pdfText.trim()) {
    console.error('[generate-summary] PDF text is empty');
    return null;
  }

  const system = `You are a campaign assistant. Based ONLY on the campaign platform document provided, generate:
1. A short intro paragraph (2-3 sentences, warm and direct, written as if introducing the candidate to a donor)
2. Exactly 3 key proposals (each with a short title max 5 words, and a description max 2 sentences)

Respond with ONLY a raw JSON object — no markdown, no code fences, no explanation. Start your response with { and end with }.

Format:
{
  "intro": "...",
  "proposals": [
    { "title": "...", "description": "..." },
    { "title": "...", "description": "..." },
    { "title": "...", "description": "..." }
  ]
}

Never invent facts not present in the document.`;

  const raw = await callClaude(system, `Campaign platform document:\n\n${pdfText}`, 1200);
  if (!raw) return null;

  let summary = null;
  try {
    summary = JSON.parse(extractJson(raw));
  } catch (e) {
    console.error('[generate-summary] JSON parse failed. Raw response:', raw.slice(0, 500), e);
    return null;
  }

  const { error: updateError } = await sb
    .from('campaigns')
    .update({ ai_summary: summary })
    .eq('id', campaignId);

  if (updateError) {
    console.error('[generate-summary] Supabase update error:', updateError.message);
  }

  return summary;
}
