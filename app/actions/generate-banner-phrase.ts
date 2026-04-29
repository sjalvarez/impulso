'use server';
export async function generateBannerPhrase(candidateName: string, raceType: string, partyName: string): Promise<string> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-sonnet-4-6', max_tokens: 30, messages: [{ role: 'user', content: `Generate a short powerful 3-6 word campaign slogan for ${candidateName} running for ${raceType} with ${partyName}. Return only the phrase, nothing else.` }] }),
  });
  if (!res.ok) return '';
  const data = await res.json() as { content: Array<{ type: string; text: string }> };
  return data.content[0]?.type === 'text' ? data.content[0].text.trim() : '';
}
