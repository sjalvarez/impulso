import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function extractJson(raw: string): string {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) return fenced[1].trim();
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) return raw.slice(start, end + 1);
  return raw.trim();
}

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.slice(7);

  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
  const { data: { user }, error: authError } = await anonClient.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const { step, campaignId, locale = 'en' } = await request.json() as {
    step: 'extract' | 'summarize';
    campaignId: string;
    locale?: string;
  };

  const { data: campaign, error: campError } = await sb
    .from('campaigns')
    .select('id, user_id, candidate_name, campaign_platform_url, platform_text, chatbot_context')
    .eq('id', campaignId)
    .single();

  if (campError || !campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }
  if (campaign.user_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // ── Step 1: Extract full text via PDF.co ─────────────────────────────────────
  if (step === 'extract') {
    if (campaign.platform_text) {
      return NextResponse.json({ ok: true, skipped: true });
    }
    if (!campaign.campaign_platform_url) {
      return NextResponse.json({ error: 'No PDF uploaded for this campaign' }, { status: 400 });
    }

    await sb.from('campaigns').update({ processing_status: 'extracting', processing_error: null }).eq('id', campaignId);

    const res = await fetch('https://api.pdf.co/v1/pdf/convert/to/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.PDFCO_API_KEY!,
      },
      body: JSON.stringify({ url: campaign.campaign_platform_url, inline: true, pages: '0-' }),
    });

    if (!res.ok) {
      const msg = `PDF.co error ${res.status}: ${(await res.text()).slice(0, 200)}`;
      await sb.from('campaigns').update({ processing_status: 'error', processing_error: msg }).eq('id', campaignId);
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const data = await res.json() as { body?: string; error?: boolean; message?: string };
    if (data.error || !data.body) {
      const msg = `PDF.co extraction failed: ${data.message ?? 'empty response'}`;
      await sb.from('campaigns').update({ processing_status: 'error', processing_error: msg }).eq('id', campaignId);
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const platformText = data.body.trim();
    if (platformText.length < 50) {
      const msg = 'PDF has no readable text. Make sure it is not a scanned image.';
      await sb.from('campaigns').update({ processing_status: 'error', processing_error: msg }).eq('id', campaignId);
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    await sb.from('campaigns').update({ platform_text: platformText }).eq('id', campaignId);
    return NextResponse.json({ ok: true, chars: platformText.length });
  }

  // ── Step 2: Generate chatbot_context + ai_summary via Claude ─────────────────
  if (step === 'summarize') {
    const langInstruction = locale === 'es' ? 'Respond in Spanish.' : 'Respond in English, regardless of the language of the document.';

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

    await sb.from('campaigns').update({ processing_status: 'summarizing' }).eq('id', campaignId);

    // Fast path: chatbot_context already exists — only regenerate display summary
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
        const msg = `Anthropic error ${res.status}: ${(await res.text()).slice(0, 200)}`;
        await sb.from('campaigns').update({ processing_status: 'error', processing_error: msg }).eq('id', campaignId);
        return NextResponse.json({ error: msg }, { status: 500 });
      }

      const data = await res.json() as { content: Array<{ type: string; text: string }> };
      const raw = data.content[0]?.type === 'text' ? data.content[0].text : '';
      let summary = null;
      try { summary = JSON.parse(extractJson(raw)); }
      catch { return NextResponse.json({ error: `JSON parse failed: ${raw.slice(0, 200)}` }, { status: 500 }); }

      await sb.from('campaigns').update({ ai_summary: summary, processing_status: 'done', processing_error: null }).eq('id', campaignId);
      return NextResponse.json({ summary });
    }

    // Slow path: generate chatbot_context from platform_text, then summary from context
    const platformText = campaign.platform_text as string | null;
    if (!platformText) {
      const msg = 'No extracted text found. Run extract step first.';
      await sb.from('campaigns').update({ processing_status: 'error', processing_error: msg }).eq('id', campaignId);
      return NextResponse.json({ error: msg }, { status: 400 });
    }

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

    const chatbotRes = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: claudeHeaders,
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 14000,
        system: chatbotSystem,
        messages: [{ role: 'user', content: `Candidate: ${campaign.candidate_name}\n\nCampaign platform text:\n\n${platformText}\n\nGenerate the comprehensive chatbot reference.` }],
      }),
    });

    if (!chatbotRes.ok) {
      const msg = `Anthropic error ${chatbotRes.status}: ${(await chatbotRes.text()).slice(0, 200)}`;
      await sb.from('campaigns').update({ processing_status: 'error', processing_error: msg }).eq('id', campaignId);
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const chatbotData = await chatbotRes.json() as { content: Array<{ type: string; text: string }> };
    const chatbotContext = chatbotData.content[0]?.type === 'text' ? chatbotData.content[0].text : null;
    if (!chatbotContext) {
      const msg = 'Claude returned empty chatbot context';
      await sb.from('campaigns').update({ processing_status: 'error', processing_error: msg }).eq('id', campaignId);
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    await sb.from('campaigns').update({ chatbot_context: chatbotContext }).eq('id', campaignId);

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
      const msg = `Anthropic error ${summaryRes.status}: ${(await summaryRes.text()).slice(0, 200)}`;
      await sb.from('campaigns').update({ processing_status: 'error', processing_error: msg }).eq('id', campaignId);
      return NextResponse.json({ error: msg }, { status: 500 });
    }

    const summaryData = await summaryRes.json() as { content: Array<{ type: string; text: string }> };
    const raw = summaryData.content[0]?.type === 'text' ? summaryData.content[0].text : '';
    let summary = null;
    try { summary = JSON.parse(extractJson(raw)); }
    catch { return NextResponse.json({ error: `JSON parse failed: ${raw.slice(0, 200)}` }, { status: 500 }); }

    await sb.from('campaigns').update({ ai_summary: summary, processing_status: 'done', processing_error: null }).eq('id', campaignId);
    return NextResponse.json({ summary });
  }

  return NextResponse.json({ error: 'Invalid step' }, { status: 400 });
}
