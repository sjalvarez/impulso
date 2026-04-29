'use server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function generateColorsFromBanner(campaignId: string): Promise<{ primary: string; accent: string }> {
  const sb = await createServerSupabaseClient();
  const { data: campaign } = await sb.from('campaigns').select('banner_url').eq('id', campaignId).single();

  let primary = '#0D2B6B';
  let accent = '#C8102E';

  if (campaign?.banner_url) {
    try {
      // Dynamic import — keeps Turbopack from trying to bundle this at build time
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mod = await (Function('return import("node-vibrant")')() as Promise<any>);
      const Vibrant = mod.Vibrant ?? mod.default?.Vibrant ?? mod.default;
      const v = new Vibrant(campaign.banner_url);
      const palette = await v.getPalette();
      if (palette.DarkVibrant?.hex) primary = palette.DarkVibrant.hex;
      if (palette.Vibrant?.hex) accent = palette.Vibrant.hex;
    } catch {
      // fallback to defaults
    }
  }

  await sb.from('campaigns').update({ page_primary_color: primary, page_accent_color: accent }).eq('id', campaignId);
  return { primary, accent };
}
