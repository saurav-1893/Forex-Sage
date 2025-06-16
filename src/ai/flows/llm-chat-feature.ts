// 'use server';
/**
 * @fileOverview This file defines a Genkit flow for a chat feature that integrates multiple LLMs.
 *
 * - llmChat - A function that handles the chat process with different LLMs.
 * - LlmChatInput - The input type for the llmChat function.
 * - LlmChatOutput - The return type for the llmChat function.
 */

'use server';

import { ai } from '@/ai/genkit';

export async function chatWithAI(message: string) {
  try {
    const response = await ai.generate(message);
    return {
      message: response.choices[0]?.message?.content || "No response generated",
      success: true
    };
  } catch (error) {
    console.error('Chat Error:', error);
    return {
      message: "Unable to process your request at this time",
      success: false
    };
  }
}
