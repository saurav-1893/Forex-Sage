// 'use server';
/**
 * @fileOverview This file defines a Genkit flow for a chat feature that integrates multiple LLMs.
 *
 * - llmChat - A function that handles the chat process with different LLMs.
 * - LlmChatInput - The input type for the llmChat function.
 * - LlmChatOutput - The return type for the llmChat function.
 */

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const LlmChatInputSchema = z.object({
  modelName: z.string().describe('The name of the LLM to use for the chat.'),
  message: z.string().describe('The message to send to the LLM.'),
});
export type LlmChatInput = z.infer<typeof LlmChatInputSchema>;

const LlmChatOutputSchema = z.object({
  response: z.string().describe('The response from the LLM.'),
});
export type LlmChatOutput = z.infer<typeof LlmChatOutputSchema>;

export async function llmChat(input: LlmChatInput): Promise<LlmChatOutput> {
  return llmChatFlow(input);
}

const llmChatPrompt = ai.definePrompt({
  name: 'llmChatPrompt',
  input: {schema: LlmChatInputSchema},
  output: {schema: LlmChatOutputSchema},
  prompt: `You are a helpful AI assistant.  Respond to the user's message using the specified LLM.

Message: {{{message}}}`,
});

const llmChatFlow = ai.defineFlow(
  {
    name: 'llmChatFlow',
    inputSchema: LlmChatInputSchema,
    outputSchema: LlmChatOutputSchema,
  },
  async input => {
    const {output} = await llmChatPrompt(input);
    return output!;
  }
);
