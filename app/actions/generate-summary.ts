'use server';
import { createClient } from '@supabase/supabase-js';

function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) return raw.slice(start, end + 1);
  return raw.trim();
}

export async function generateCampaignSummary(campaignId: string, locale = 'en'): Promise<{
  intro: string;
  proposals: { title: string; description: string }[];
  _error?: string;
} | null> {
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
    return { intro: '', proposals: [], _error: `DB error: ${campError?.message ?? 'campaign not found'}` };
  }
  if (!campaign.campaign_platform_url) {
    return { intro: '', proposals: [], _error: 'No PDF uploaded for this campaign' };
  }

  // Fetch the full PDF — do NOT slice; slicing corrupts the PDF structure and causes 400 errors
  let pdfBase64: string;
  try {
    const pdfRes = await fetch(campaign.campaign_platform_url);
    if (!pdfRes.ok) throw new Error(`HTTP ${pdfRes.status}`);
    const arrayBuffer = await pdfRes.arrayBuffer();
    pdfBase64 = Buffer.from(arrayBuffer).toString('base64');
  } catch (e) {
    return { intro: '', proposals: [], _error: `PDF fetch failed: ${e instanceof Error ? e.message : String(e)}` };
  }

  const langInstruction = locale === 'es'
    ? 'Respond in Spanish.'
    : 'Respond in English, regardless of the language of the document.';

  const system = `You are a campaign assistant. Based ONLY on the campaign platform document provided, generate a very concise summary. ${langInstruction}

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

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      system,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 },
          },
          { type: 'text', text: 'Generate the campaign summary from this document.' },
        ],
      }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    return { intro: '', proposals: [], _error: `Anthropic error ${res.status}: ${err.slice(0, 200)}` };
  }

  const data = await res.json() as { content: Array<{ type: string; text: string }> };
  const raw = data.content[0]?.type === 'text' ? data.content[0].text : '';
  if (!raw) return { intro: '', proposals: [], _error: 'Claude returned empty response' };

  let summary = null;
  try {
    summary = JSON.parse(extractJson(raw));
  } catch {
    return { intro: '', proposals: [], _error: `JSON parse failed. Claude returned: ${raw.slice(0, 200)}` };
  }

  await sb.from('campaigns').update({ ai_summary: summary }).eq('id', campaignId);
  return summary;
}
