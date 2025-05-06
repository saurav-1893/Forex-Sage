
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
    description: 'Retrieves real-time data for a given Forex pair. This tool MUST be called to get the latest market data before making a trading suggestion.',
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
  async (input: {symbol: string}) => {
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
  prompt: `You are an expert Forex trading analyst. Your goal is to provide a trading suggestion (buy/sell), a timeframe, and a target profit in pips.

  To do this, you MUST first use the 'getForexPairData' tool to fetch the current real-time market data for the given Forex pair: {{{symbol}}}.
  
  Once you have the real-time data from the tool, analyze it in conjunction with your knowledge of backtesting data, current market conditions, and technical indicators to formulate your suggestion.
  Do not ask the user to provide the data; you must fetch it using the tool.
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

