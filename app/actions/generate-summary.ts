'use server';
import { createClient } from '@supabase/supabase-js';

const MAX_TEXT_CHARS = 15_000; // ~4k tokens — enough for any platform document

function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) return raw.slice(start, end + 1);
  return raw.trim();
}

async function pdfToText(arrayBuffer: ArrayBuffer): Promise<string> {
  // Use Function() to hide ESM-only unpdf from Turbopack static analysis
  const mod = await (Function('return import("unpdf")')() as Promise<{
    extractText: (src: Uint8Array, opts?: { mergePages?: boolean }) => Promise<{ text: string }>;
  }>);
  const { text } = await mod.extractText(new Uint8Array(arrayBuffer), { mergePages: true });
  return text.trim().slice(0, MAX_TEXT_CHARS);
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

  // Fetch full PDF (no slicing — slicing corrupts the PDF structure)
  let arrayBuffer: ArrayBuffer;
  try {
    const pdfRes = await fetch(campaign.campaign_platform_url);
    if (!pdfRes.ok) throw new Error(`HTTP ${pdfRes.status}`);
    arrayBuffer = await pdfRes.arrayBuffer();
  } catch (e) {
    return { intro: '', proposals: [], _error: `PDF fetch failed: ${e instanceof Error ? e.message : String(e)}` };
  }

  // Extract plain text — avoids sending binary PDF to Claude entirely
  let platformText: string;
  try {
    platformText = await pdfToText(arrayBuffer);
  } catch (e) {
    return { intro: '', proposals: [], _error: `Could not read PDF text: ${e instanceof Error ? e.message : String(e)}` };
  }

  if (!platformText || platformText.length < 50) {
    return { intro: '', proposals: [], _error: 'PDF has no readable text. Make sure it is not a scanned image.' };
  }

  // Store extracted text so chatbot can use the full platform for richer answers
  await sb.from('campaigns').update({ platform_text: platformText }).eq('id', campaignId);

  const langInstruction = locale === 'es'
    ? 'Respond in Spanish.'
    : 'Respond in English, regardless of the language of the document.';

  const system = `You are a campaign assistant. Based ONLY on the campaign platform text provided, generate a very concise summary. ${langInstruction}

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
        content: `Candidate: ${campaign.candidate_name}\n\nCampaign platform:\n\n${platformText}\n\nGenerate the campaign summary.`,
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
