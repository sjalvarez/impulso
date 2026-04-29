'use server';
import { createClient } from '@supabase/supabase-js';

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
    console.error('[generate-summary] Anthropic error:', res.status, await res.text());
    return '';
  }
  const data = await res.json() as { content: Array<{ type: string; text: string }> };
  const block = data.content[0];
  return block?.type === 'text' ? block.text : '';
}

function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) return raw.slice(start, end + 1);
  return raw.trim();
}

export async function generateCampaignSummary(campaignId: string): Promise<{
  intro: string;
  proposals: { title: string; description: string }[];
} | null> {
  // Service role — bypasses RLS so server actions always have read/write access
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { data: campaign, error: campError } = await sb
    .from('campaigns')
    .select('campaign_platform_url, candidate_name')
    .eq('id', campaignId)
    .single();

  if (campError || !campaign) {
    console.error('[generate-summary] Campaign fetch error:', campError?.message);
    return null;
  }
  if (!campaign.campaign_platform_url) {
    console.error('[generate-summary] No PDF URL for campaign:', campaignId);
    return null;
  }

  // Fetch PDF bytes ourselves — more reliable than passing URL to pdf-parse in serverless
  let pdfText = '';
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
    pdfText = result.text.slice(0, 8000);
    await parser.destroy();
  } catch (e) {
    console.error('[generate-summary] PDF parse error:', e);
    return null;
  }

  if (!pdfText.trim()) {
    console.error('[generate-summary] PDF text is empty — may be a scanned image PDF');
    return null;
  }

  const system = `You are a campaign assistant. Based ONLY on the campaign platform document provided, generate a very concise summary.

Strict rules:
- Intro: exactly 2 sentences, maximum 30 words total, maximum 160 characters.
- Proposals: exactly 3. Each title maximum 4 words. Each description exactly 1 sentence, maximum 18 words. Use specific numbers from the document when available.
- Never invent or assume anything not explicitly stated in the document.

Respond with ONLY a raw JSON object — no markdown, no code fences, no explanation. Start your response with { and end with }.

Format:
{
  "intro": "...",
  "proposals": [
    { "title": "...", "description": "..." },
    { "title": "...", "description": "..." },
    { "title": "...", "description": "..." }
  ]
}`;

  const raw = await callClaude(system, `Campaign platform document:\n\n${pdfText}`, 1200);
  if (!raw) return null;

  let summary = null;
  try {
    summary = JSON.parse(extractJson(raw));
  } catch (e) {
    console.error('[generate-summary] JSON parse failed. Raw:', raw.slice(0, 300), e);
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
