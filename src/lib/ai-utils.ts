import { ai } from '@/ai/genkit';

/**
 * Wrapper for AI generate calls with retry logic for rate limits
 * @param prompt The prompt to send to the AI
 * @param maxRetries Maximum number of retries (default: 3)
 * @param initialDelay Initial delay in ms before retrying (default: 2000)
 * @returns The AI generation result
 */
export async function generateWithRetry(
  prompt: string,
  maxRetries: number = 3,
  initialDelay: number = 2000
) {
  let retries = 0;
  let delay = initialDelay;

  while (true) {
    try {
      // Try different models in order of preference
      const models = [
        'googleai/gemini-1.0-pro',
        'googleai/gemini-flash',
        'googleai/gemini-1.0-pro-vision',
        'googleai/gemini-1.5-flash'
      ];
      
      // Try each model until one works
      let lastError;
      for (const model of models) {
        try {
          return await ai.generate({
            model,
            prompt,
          });
        } catch (error) {
          lastError = error;
          // If it's not a rate limit error, try the next model
          if (!error.toString().includes('429') && !error.toString().includes('quota')) {
            continue;
          }
          // If it is a rate limit error, break and use the retry logic
          break;
        }
      }
      
      // If we've tried all models and still have an error, throw the last one
      throw lastError;
      
    } catch (error) {
      if (retries >= maxRetries) {
        throw error; // Give up after max retries
      }
      
      // Check if it's a rate limit error
      if (error.toString().includes('429') || error.toString().includes('quota')) {
        console.log(`Rate limit hit, retrying in ${delay}ms... (${retries + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        retries++;
        delay *= 2; // Exponential backoff
      } else {
        throw error; // Not a rate limit error, rethrow
      }
    }
  }
}