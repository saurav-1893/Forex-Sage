
// This is an AI-powered agent that analyzes forex pairs and provides buy/sell suggestions based on backtesting data.
// It also includes a timeframe and target profit for the suggestion.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {ForexData, ForexPair, getForexData} from '@/services/forex-data';

const AnalyzeForexPairsInputSchema = z.object({
  symbol: z.string().describe('The symbol of the Forex pair to analyze (e.g., EURUSD).'),
});
export type AnalyzeForexPairsInput = z.infer<typeof AnalyzeForexPairsInputSchema>;

const AnalyzeForexPairsOutputSchema = z.object({
  suggestion: z.string().describe('The suggestion to buy or sell the Forex pair.'),
  timeframe: z.string().describe('The timeframe for the suggestion (e.g., daily, weekly).'),
  targetProfit: z.number().describe('The target profit for the suggestion, in pips.'),
});
export type AnalyzeForexPairsOutput = z.infer<typeof AnalyzeForexPairsOutputSchema>;

export async function analyzeForexPairs(input: AnalyzeForexPairsInput): Promise<AnalyzeForexPairsOutput> {
  return analyzeForexPairsFlow(input);
}

const getForexPairData = ai.defineTool(
  {
    name: 'getForexPairData',
    description: 'Retrieves real-time data for a given Forex pair.',
    inputSchema: z.object({
      symbol: z.string().describe('The symbol of the Forex pair (e.g., EURUSD).'),
    }),
    outputSchema: z.object({
      timestamp: z.string(),
      price: z.number(),
      bid: z.number(),
      ask: z.number(),
    }),
  },
  async (input) => {
    const pair: ForexPair = {symbol: input.symbol};
    const data: ForexData = await getForexData(pair);
    return {
      timestamp: data.timestamp,
      price: data.price,
      bid: data.bid,
      ask: data.ask,
    };
  }
);

const prompt = ai.definePrompt({
  name: 'analyzeForexPairsPrompt',
  input: {schema: AnalyzeForexPairsInputSchema},
  output: {schema: AnalyzeForexPairsOutputSchema},
  tools: [getForexPairData],
  prompt: `You are an expert Forex trading analyst. Analyze the provided Forex pair data and provide a trading suggestion.

  Consider backtesting data, current market conditions, and technical indicators to formulate your suggestion.
  Include a timeframe for the suggestion and a target profit in pips.

  Forex Pair: {{{symbol}}}

  Use the getForexPairData tool to get the real-time data for the Forex pair before making any decision.
`,
});

const analyzeForexPairsFlow = ai.defineFlow(
  {
    name: 'analyzeForexPairsFlow',
    inputSchema: AnalyzeForexPairsInputSchema,
    outputSchema: AnalyzeForexPairsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

