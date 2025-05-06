
// This is an AI-powered agent that analyzes forex pairs and provides buy/sell suggestions based on backtesting data.
// It also includes a timeframe, target profit in pips, stop loss level, profit target level, and an analysis summary.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type {ForexData, ForexPair, HistoricalForexDataPoint} from '@/services/forex-data';
import { getForexData, getHistoricalForexData } from '@/services/forex-data';

const AnalyzeForexPairsInputSchema = z.object({
  symbol: z.string().describe('The symbol of the Forex pair to analyze (e.g., EURUSD).'),
});
export type AnalyzeForexPairsInput = z.infer<typeof AnalyzeForexPairsInputSchema>;

const AnalyzeForexPairsOutputSchema = z.object({
  suggestion: z.string().describe('The suggestion to buy or sell the Forex pair.'),
  timeframe: z.string().describe('The timeframe for the suggestion (e.g., daily, weekly).'),
  targetProfitPips: z.number().describe('The target profit for the suggestion, in pips.'),
  stopLossLevel: z.number().describe('The suggested price level for stop loss (e.g., 1.12345).'),
  profitTargetLevel: z.number().describe('The suggested price level for taking profit (e.g., 1.12845).'),
  analysisSummary: z.string().describe('A brief summary of the reasoning behind the suggestion, considering both real-time and historical data, and the rationale for the stop loss and profit target levels.'),
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
  prompt: `You are an expert Forex trading analyst. Your goal is to provide a trading suggestion (buy/sell), a timeframe, a target profit in pips, a specific stop loss price level, a specific profit target price level, and a brief analysis summary.

  To do this, you MUST perform the following steps:
  1. Use the 'getRealTimeForexPairData' tool to fetch the current real-time market data for the given Forex pair: {{{symbol}}}.
  2. Use the 'getHistoricalForexPairData' tool to fetch the daily historical data for the past 30 days for {{{symbol}}}.
  
  Once you have both the real-time and historical data, analyze them in conjunction with your knowledge of backtesting data, current market conditions, and technical indicators (like Moving Averages, RSI, MACD based on the historical data). 
  
  Formulate your suggestion (buy/sell), appropriate timeframe (e.g., daily, H4, H1), target profit in pips (targetProfitPips), a precise stop loss price level (stopLossLevel, e.g., 1.12345), and a precise profit target price level (profitTargetLevel, e.g., 1.12845).

  The analysisSummary should be concise and explain your reasoning, highlighting key observations from both real-time (e.g., current price vs bid/ask spread) and historical data (e.g., recent trend, support/resistance levels observed in OHLC data). Crucially, the summary must also explain the rationale behind the chosen stopLossLevel and profitTargetLevel, referencing specific data points or indicators if possible.

  Do not ask the user to provide any data; you must fetch it using the provided tools.
  Ensure the stopLossLevel and profitTargetLevel are actual price values, not pips or percentages.
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

