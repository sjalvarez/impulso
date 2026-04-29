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

async function extractTextFromPdf(pdfUrl: string): Promise<string> {
  const res = await fetch('https://api.pdf.co/v1/pdf/convert/to/text', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.PDFCO_API_KEY!,
    },
    body: JSON.stringify({
      url: pdfUrl,
      inline: true,
      pages: '0-',
    }),
  });

  if (!res.ok) {
    throw new Error(`PDF.co error ${res.status}: ${(await res.text()).slice(0, 200)}`);
  }

  const data = await res.json() as { body?: string; error?: boolean; message?: string };
  if (data.error || !data.body) {
    throw new Error(`PDF.co extraction failed: ${data.message ?? 'empty response'}`);
  }

  return data.body.trim();
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
    .select('campaign_platform_url, candidate_name, chatbot_context, platform_text')
    .eq('id', campaignId)
    .single();

  if (campError || !campaign) {
    return { intro: '', proposals: [], _error: `DB error: ${campError?.message ?? 'campaign not found'}` };
  }
  if (!campaign.campaign_platform_url) {
    return { intro: '', proposals: [], _error: 'No PDF uploaded for this campaign' };
  }

  const langInstruction = locale === 'es'
    ? 'Respond in Spanish.'
    : 'Respond in English, regardless of the language of the document.';

  const claudeHeaders = {
    'Content-Type': 'application/json',
    'x-api-key': process.env.ANTHROPIC_API_KEY!,
    'anthropic-version': '2023-06-01',
  };

  const summarySystem = `You are a campaign assistant. Based ONLY on the campaign platform information provided, generate a very concise summary. ${langInstruction}

Strict rules:
- Intro: exactly 2 sentences, maximum 30 words total, maximum 160 characters.
- Proposals: exactly 3. Each title maximum 4 words. Each description exactly 1 sentence, maximum 18 words. Use specific numbers when available.
- Never invent or assume anything not explicitly stated.

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

  const chatbotSystem = `You are a campaign analyst. Read the full campaign platform text and produce an exhaustive reference that a chatbot will use to answer ANY question a donor or voter might ask. ${langInstruction}

Cover EVERYTHING in the document in exhaustive detail:
- Candidate biography, background, professional experience, and political history
- Overall vision, mission, and governing philosophy
- EVERY policy area with full specifics: economy, employment, education, healthcare, security, infrastructure, environment, housing, agriculture, tourism, digital transformation, youth, women, diaspora, and any others mentioned
- All specific numbers, percentages, budget figures, targets, timelines, and measurable commitments
- Party affiliation, coalition partners, and political positioning
- Stance on key national issues
- Any campaign promises, slogans, or key messages

Be exhaustive — a donor asking about any specific topic (healthcare costs, teacher salaries, crime statistics, housing prices) should get a detailed answer from this reference. This is the chatbot's only knowledge source. Do not invent anything not in the document. Write in clear prose organized by topic. Aim for 4000-5000 words.`;

  // ── Fast path: chatbot_context exists — regenerate display summary only ────────
  const existingContext = campaign.chatbot_context as string | null;
  if (existingContext) {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: claudeHeaders,
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1200,
        system: summarySystem,
        messages: [{ role: 'user', content: `Candidate: ${campaign.candidate_name}\n\nCampaign platform:\n\n${existingContext}\n\nGenerate the campaign summary.` }],
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
    try { summary = JSON.parse(extractJson(raw)); }
    catch { return { intro: '', proposals: [], _error: `JSON parse failed. Claude returned: ${raw.slice(0, 200)}` }; }

    await sb.from('campaigns').update({ ai_summary: summary }).eq('id', campaignId);
    return summary;
  }

  // ── Slow path: extract text via PDF.co, then generate both context + summary ───

  // Use stored platform_text if available, otherwise extract fresh from PDF.co
  let platformText = campaign.platform_text as string | null;
  if (!platformText) {
    try {
      platformText = await extractTextFromPdf(campaign.campaign_platform_url);
      await sb.from('campaigns').update({ platform_text: platformText }).eq('id', campaignId);
    } catch (e) {
      return { intro: '', proposals: [], _error: `${e instanceof Error ? e.message : String(e)}` };
    }
  }

  if (!platformText || platformText.length < 50) {
    return { intro: '', proposals: [], _error: 'PDF has no readable text. Make sure it is not a scanned image.' };
  }

  // ── Step 1: Generate comprehensive chatbot context from plain text ─────────────
  const chatbotRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: claudeHeaders,
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 5000,
      system: chatbotSystem,
      messages: [{ role: 'user', content: `Candidate: ${campaign.candidate_name}\n\nCampaign platform text:\n\n${platformText.slice(0, 120_000)}\n\nGenerate the comprehensive chatbot reference.` }],
    }),
  });

  if (!chatbotRes.ok) {
    const err = await chatbotRes.text();
    return { intro: '', proposals: [], _error: `Anthropic error ${chatbotRes.status}: ${err.slice(0, 200)}` };
  }

  const chatbotData = await chatbotRes.json() as { content: Array<{ type: string; text: string }> };
  const chatbotContext = chatbotData.content[0]?.type === 'text' ? chatbotData.content[0].text : null;
  if (!chatbotContext) return { intro: '', proposals: [], _error: 'Claude returned empty chatbot context' };

  await sb.from('campaigns').update({ chatbot_context: chatbotContext }).eq('id', campaignId);

  // ── Step 2: Generate display summary from chatbot context (no PDF re-upload) ───
  const summaryRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: claudeHeaders,
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      system: summarySystem,
      messages: [{ role: 'user', content: `Candidate: ${campaign.candidate_name}\n\nCampaign platform:\n\n${chatbotContext}\n\nGenerate the campaign summary.` }],
    }),
  });

  if (!summaryRes.ok) {
    const err = await summaryRes.text();
    return { intro: '', proposals: [], _error: `Anthropic error ${summaryRes.status}: ${err.slice(0, 200)}` };
  }

  const summaryData = await summaryRes.json() as { content: Array<{ type: string; text: string }> };
  const raw = summaryData.content[0]?.type === 'text' ? summaryData.content[0].text : '';
  if (!raw) return { intro: '', proposals: [], _error: 'Claude returned empty response' };

  let summary = null;
  try { summary = JSON.parse(extractJson(raw)); }
  catch { return { intro: '', proposals: [], _error: `JSON parse failed. Claude returned: ${raw.slice(0, 200)}` }; }

  await sb.from('campaigns').update({ ai_summary: summary }).eq('id', campaignId);
  return summary;
}
