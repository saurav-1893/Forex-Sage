import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY
});

export const ai = {
  async generate(prompt: string) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://github.com/saurav-1893/Forex-Sage',
          'X-Title': 'Forex Analysis Bot'
        },
        body: JSON.stringify({
          model: 'anthropic/claude-2',
          messages: [
            {
              role: 'system',
              content: 'You are an expert forex trading analyst providing detailed market analysis.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.log('OpenRouter API Error:', errorData);
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      console.log('OpenRouter API Response:', data);
      return data;
    } catch (error) {
      console.log('OpenRouter Request Error:', error);
      throw error;
    }
  }
};

// Add a safe generation wrapper
export async function safeGenerateText(prompt: string) {
  try {
    const response = await ai.generate({
      model: 'openai/gpt-3.5-turbo',
      prompt,
    });
    return response;
  } catch (error) {
    console.error('AI generation error:', error);
    return {
      text: () => "Mock response due to AI generation error",
    };
  }
}
