
// This is an AI-powered agent that analyzes forex pairs and provides buy/sell suggestions based on backtesting data.
// It also includes a timeframe and target profit for the suggestion.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {ForexData, ForexPair, getForexData, HistoricalForexDataPoint, getHistoricalForexData} from '@/services/forex-data';

const AnalyzeForexPairsInputSchema = z.object({
  symbol: z.string().describe('The symbol of the Forex pair to analyze (e.g., EURUSD).'),
});
export type AnalyzeForexPairsInput = z.infer<typeof AnalyzeForexPairsInputSchema>;

const AnalyzeForexPairsOutputSchema = z.object({
  suggestion: z.string().describe('The suggestion to buy or sell the Forex pair.'),
  timeframe: z.string().describe('The timeframe for the suggestion (e.g., daily, weekly).'),
  targetProfit: z.number().describe('The target profit for the suggestion, in pips.'),
  analysisSummary: z.string().describe('A brief summary of the reasoning behind the suggestion, considering both real-time and historical data.'),
});
export type AnalyzeForexPairsOutput = z.infer<typeof AnalyzeForexPairsOutputSchema>;

export async function analyzeForexPairs(input: AnalyzeForexPairsInput): Promise<AnalyzeForexPairsOutput> {
  return analyzeForexPairsFlow(input);
}

const getRealTimeForexPairData = ai.defineTool(
  {
    name: 'getRealTimeForexPairData',
    description: 'Retrieves real-time quote data for a given Forex pair. This tool MUST be called to get the latest market data before making a trading suggestion.',
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

const getHistoricalForexPairData = ai.defineTool(
  {
    name: 'getHistoricalForexPairData',
    description: 'Retrieves historical daily OHLCV (Open, High, Low, Close, Volume) data for a given Forex pair for the past 30 days. This tool MUST be called to analyze trends and patterns.',
    inputSchema: z.object({
      symbol: z.string().describe('The symbol of the Forex pair (e.g., EURUSD).'),
    }),
    outputSchema: z.array(z.object({
      timestamp: z.string(),
      open: z.number(),
      high: z.number(),
      low: z.number(),
      close: z.number(),
      volume: z.number(),
    })),
  },
  async (input: {symbol: string}) => {
    const data: HistoricalForexDataPoint[] = await getHistoricalForexData(input.symbol, 30, 'day');
    return data;
  }
);


const prompt = ai.definePrompt({
  name: 'analyzeForexPairsPrompt',
  input: {schema: AnalyzeForexPairsInputSchema},
  output: {schema: AnalyzeForexPairsOutputSchema},
  tools: [getRealTimeForexPairData, getHistoricalForexPairData],
  prompt: `You are an expert Forex trading analyst. Your goal is to provide a trading suggestion (buy/sell), a timeframe, a target profit in pips, and a brief analysis summary.

  To do this, you MUST perform the following steps:
  1. Use the 'getRealTimeForexPairData' tool to fetch the current real-time market data for the given Forex pair: {{{symbol}}}.
  2. Use the 'getHistoricalForexPairData' tool to fetch the daily historical data for the past 30 days for {{{symbol}}}.
  
  Once you have both the real-time and historical data, analyze them in conjunction with your knowledge of backtesting data, current market conditions, and technical indicators (like Moving Averages, RSI, MACD based on the historical data). 
  
  Formulate your suggestion (buy/sell), appropriate timeframe (e.g., daily, H4, H1), target profit in pips, and a concise analysisSummary explaining your reasoning.
  The analysis summary should highlight key observations from both real-time (e.g., current price vs bid/ask spread) and historical data (e.g., recent trend, support/resistance levels observed in OHLC data).

  Do not ask the user to provide any data; you must fetch it using the provided tools.
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
    if (!output) {
        throw new Error("AI analysis did not produce an output.");
    }
    return output;
  }
);
