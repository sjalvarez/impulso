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

function claudeDoc(pdfBase64: string) {
  return {
    type: 'document' as const,
    source: { type: 'base64' as const, media_type: 'application/pdf' as const, data: pdfBase64 },
  };
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

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': process.env.ANTHROPIC_API_KEY!,
    'anthropic-version': '2023-06-01',
  };

  // ── Call 1: Short display summary for donation page ──────────────────────────
  const summarySystem = `You are a campaign assistant. Based ONLY on the campaign platform document provided, generate a very concise summary. ${langInstruction}

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

  // ── Call 2: Comprehensive chatbot context ─────────────────────────────────────
  const chatbotSystem = `You are a campaign analyst. Read the full campaign platform document and produce a comprehensive reference that a chatbot can use to answer any question a donor might ask. ${langInstruction}

Cover ALL of the following that appear in the document:
- Candidate background, biography, and experience
- Overall campaign vision and mission
- Every policy area and proposal (economy, education, health, security, infrastructure, environment, etc.)
- Specific numbers, targets, timelines, and commitments
- Party affiliation and political positioning
- Any other information relevant to a donor or voter

Write in clear prose, organized by topic. Be thorough — this is the chatbot's only reference. Do not invent anything not in the document. Aim for 400-800 words.`;

  // Run both calls in parallel
  const [summaryRes, chatbotRes] = await Promise.all([
    fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1200,
        system: summarySystem,
        messages: [{
          role: 'user',
          content: [
            claudeDoc(pdfBase64),
            { type: 'text', text: 'Generate the campaign summary from this document.' },
          ],
        }],
      }),
    }),
    fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 2000,
        system: chatbotSystem,
        messages: [{
          role: 'user',
          content: [
            claudeDoc(pdfBase64),
            { type: 'text', text: 'Generate the comprehensive chatbot reference from this document.' },
          ],
        }],
      }),
    }),
  ]);

  if (!summaryRes.ok) {
    const err = await summaryRes.text();
    return { intro: '', proposals: [], _error: `Anthropic error ${summaryRes.status}: ${err.slice(0, 200)}` };
  }

  const summaryData = await summaryRes.json() as { content: Array<{ type: string; text: string }> };
  const raw = summaryData.content[0]?.type === 'text' ? summaryData.content[0].text : '';
  if (!raw) return { intro: '', proposals: [], _error: 'Claude returned empty response' };

  let summary = null;
  try {
    summary = JSON.parse(extractJson(raw));
  } catch {
    return { intro: '', proposals: [], _error: `JSON parse failed. Claude returned: ${raw.slice(0, 200)}` };
  }

  // Store chatbot context if the second call succeeded (non-blocking — don't fail summary on this)
  let chatbotContext: string | null = null;
  if (chatbotRes.ok) {
    const chatbotData = await chatbotRes.json() as { content: Array<{ type: string; text: string }> };
    chatbotContext = chatbotData.content[0]?.type === 'text' ? chatbotData.content[0].text : null;
  }

  await sb.from('campaigns').update({
    ai_summary: summary,
    ...(chatbotContext ? { chatbot_context: chatbotContext } : {}),
  }).eq('id', campaignId);

  return summary;
}
