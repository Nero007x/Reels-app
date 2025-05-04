import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: 'https://api.deepseek.com',
  apiKey: process.env.DEEPSEEK_API_KEY,
});

export async function generateScriptWithDeepSeek(celebrityName: string): Promise<string> {
  const prompt = `give very shortvoiceover by telling story about the historical sports celebrity ${celebrityName}, focusing on their achievements, unique qualities, and what makes them inspiring. Do not mention that this is AI-generated.`;
  const response = await openai.chat.completions.create({
    model: 'deepseek-chat',
    messages: [
      { role: 'system', content: 'You are a creative storyteller for historical sportsfigures.' },
      { role: 'user', content: prompt },
    ],
    max_tokens: 50,
    temperature: 0.5,
  });
  const script = response.choices[0].message?.content?.trim() || '';
  console.log('Generated script:', script);
  return script;
} 