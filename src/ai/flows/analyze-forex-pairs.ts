// This is an AI-powered agent that analyzes forex pairs and provides buy/sell suggestions based on backtesting data.
// It also includes a timeframe, target profit in pips, stop loss level, profit target level, and an analysis summary.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type {ForexData, ForexPair, HistoricalForexDataPoint} from '@/services/forex-data';
import { getForexData, getHistoricalForexData, calculateRSI } from '@/services/forex-data';

const AnalyzeForexPairsInputSchema = z.object({
  symbol: z.string().describe('The symbol of the Forex pair to analyze (e.g., EURUSD).'),
  strategyName: z.string().describe('The name of the trading strategy to apply.'),
  strategyRules: z.string().describe('The detailed rules of the trading strategy to apply for analysis. This includes entry, exit, stop loss, and profit target conditions.'),
});
export type AnalyzeForexPairsInput = z.infer<typeof AnalyzeForexPairsInputSchema>;

const AnalyzeForexPairsOutputSchema = z.object({
  suggestion: z.string().describe('The suggestion to buy or sell the Forex pair based on the applied strategy.'),
  timeframe: z.string().describe('The timeframe for the suggestion (e.g., daily, H4, H1).'),
  targetProfitPips: z.number().describe('The target profit for the suggestion, in pips, as per the strategy or analysis.'),
  stopLossLevel: z.number().describe('The suggested price level for stop loss (e.g., 1.12345) based on the strategy.'),
  profitTargetLevel: z.number().describe('The suggested price level for taking profit (e.g., 1.12845) based on the strategy.'),
  analysisSummary: z.string().describe('A brief summary of the reasoning behind the suggestion, considering the provided strategy rules, real-time data, and historical data (including calculated indicators like RSI if mentioned in the strategy). It should explain how the current market conditions align (or not) with the strategy.'),
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
    description: 'Retrieves historical daily OHLCV (Open, High, Low, Close, Volume) data for a given Forex pair for the past 45 days. This tool MUST be called to analyze trends and patterns according to the strategy. The data is sorted oldest to newest.',
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
    // Fetching 45 days for daily to have enough data for common indicators like RSI(14)
    const data: HistoricalForexDataPoint[] = await getHistoricalForexData(input.symbol, 45, 'day');
    return data;
  }
);

const calculateRSIFromHistoricalData = ai.defineTool(
  {
    name: 'calculateRSIFromHistoricalData',
    description: 'Calculates the 14-period Relative Strength Index (RSI) from a provided list of historical closing prices. The historical data MUST be sorted oldest to newest. This tool should be called if the trading strategy involves RSI.',
    inputSchema: z.object({
      closingPrices: z.array(z.number()).describe('An array of historical closing prices, ordered from oldest to newest.'),
      period: z.number().optional().default(14).describe('The period for RSI calculation, defaults to 14.')
    }),
    outputSchema: z.object({
      rsi: z.number().nullable().describe('The calculated RSI value, or null if calculation is not possible (e.g., insufficient data).'),
    }),
  },
  async (input: {closingPrices: number[], period?: number}) => {
    const rsiValue = await calculateRSI(input.closingPrices, input.period);
    return { rsi: rsiValue };
  }
);


const prompt = ai.definePrompt({
  name: 'analyzeForexPairsPrompt',
  input: {schema: AnalyzeForexPairsInputSchema},
  output: {schema: AnalyzeForexPairsOutputSchema},
  tools: [getRealTimeForexPairData, getHistoricalForexPairData, calculateRSIFromHistoricalData],
  prompt: `You are an expert Forex trading analyst. Your goal is to provide a trading suggestion (buy/sell/hold), a timeframe, a target profit in pips, a specific stop loss price level, a specific profit target price level, and a brief analysis summary based on a GIVEN TRADING STRATEGY.

  Forex Pair: {{{symbol}}}
  Trading Strategy Name: {{{strategyName}}}
  Trading Strategy Rules:
  {{{strategyRules}}}

  To do this, you MUST perform the following steps:
  1. Use the 'getRealTimeForexPairData' tool to fetch the current real-time market data for {{{symbol}}}.
  2. Use the 'getHistoricalForexPairData' tool to fetch the daily historical data for the past 45 days for {{{symbol}}}. This data is sorted oldest to newest.
  3. If the 'Trading Strategy Rules' mention RSI (Relative Strength Index):
     a. Extract the closing prices from the historical data obtained in step 2.
     b. Use the 'calculateRSIFromHistoricalData' tool with these closing prices to get the current RSI value.
     c. Incorporate this RSI value into your analysis. If RSI calculation is not possible (e.g. tool returns null), state this in your analysis and explain its impact on the strategy application.
  
  Once you have the real-time data, historical data, and RSI (if applicable), analyze them STRICTLY according to the provided 'Trading Strategy Rules'.
  
  Based on this strategy application:
  - Determine if a 'buy', 'sell', or 'hold' signal is generated. If no clear signal according to the strategy, state "Hold" or "No Signal".
  - Identify the most appropriate timeframe (e.g., daily, H4, H1) if not specified in the strategy, otherwise use the strategy's timeframe.
  - Calculate/determine the target profit in pips (targetProfitPips). If the strategy does not specify, you can suggest a reasonable target based on volatility or recent price action, typically between 20-100 pips for daily timeframe.
  - Calculate/determine a precise stop loss price level (stopLossLevel, e.g., 1.12345). Base this on the strategy, or if not specified, place it below a recent support (for buy) or above a recent resistance (for sell), typically 20-50 pips away for daily timeframe.
  - Calculate/determine a precise profit target price level (profitTargetLevel, e.g., 1.12845). Base this on the strategy, or if not specified, use a risk/reward ratio (e.g., 1:1.5 or 1:2) relative to the stop loss, or target a recent resistance (for buy) or support (for sell).
  
  The analysisSummary should be concise and explain your reasoning by directly referencing how the current real-time data, historical data (and RSI if used) aligns with the specific conditions outlined in the 'Trading Strategy Rules'. Explicitly mention which parts of the strategy are met or not met. Explain the rationale for the stopLossLevel and profitTargetLevel based on the strategy or derived from it if not explicitly stated.

  Do not deviate from the provided strategy. If the strategy is unclear on certain aspects (e.g., exact SL/TP levels but implies a method), use your analytical skills to derive them in a way that is consistent with the strategy's logic.
  Ensure the stopLossLevel and profitTargetLevel are actual price values.
  If critical data for the strategy (like RSI when specified) cannot be obtained or calculated, clearly state this and explain why a definitive suggestion cannot be made. In such cases, the suggestion might be "No Signal due to missing data".
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
    // Ensure numeric outputs are numbers, not strings, and handle potential NaN or undefined.
    output.targetProfitPips = Number(output.targetProfitPips) || 0;
    output.stopLossLevel = Number(output.stopLossLevel) || 0;
    output.profitTargetLevel = Number(output.profitTargetLevel) || 0;
    
    return output;
  }
);
