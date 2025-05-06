// This is an AI-powered agent that analyzes forex pairs and provides buy/sell suggestions based on backtesting data.
// It also includes a timeframe, target profit in pips, stop loss level, profit target level, and an analysis summary.

'use server';

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type {ForexData, ForexPair, HistoricalForexDataPoint} from '@/services/forex-data';
import { getForexData, getHistoricalForexData, calculateRSI, calculateSMA } from '@/services/forex-data';

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
  analysisSummary: z.string().describe('A brief summary of the reasoning behind the suggestion, considering the provided strategy rules, real-time data, and historical data (including calculated indicators like RSI or SMAs if mentioned in the strategy). It should explain how the current market conditions align (or not) with the strategy.'),
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

const getHistoricalForexPairDataTool = ai.defineTool(
  {
    name: 'getHistoricalForexPairData',
    description: 'Retrieves historical OHLCV (Open, High, Low, Close, Volume) data for a given Forex pair. The data is sorted oldest to newest. This tool MUST be called to analyze trends and patterns according to the strategy. For daily data to calculate common SMAs (e.g., 10-period, 30-period), request at least 90 days.',
    inputSchema: z.object({
      symbol: z.string().describe('The symbol of the Forex pair (e.g., EURUSD).'),
      days: z.number().describe('The number of past days to fetch historical data for. E.g., 90 for 90 days of daily data.'),
      timespan: z.enum(['minute', 'hour', 'day', 'week', 'month', 'quarter', 'year']).describe("The candle interval unit (e.g., 'day', 'hour', 'minute')."),
      multiplier: z.number().describe("The value for the candle interval (e.g., 1 for 1 day, 15 for 15 minutes)."),
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
  async (input: {symbol: string, days: number, timespan: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year', multiplier: number}) => {
    const data: HistoricalForexDataPoint[] = await getHistoricalForexData(input.symbol, input.days, input.timespan, input.multiplier);
    return data;
  }
);


const calculateRSIFromHistoricalData = ai.defineTool(
  {
    name: 'calculateRSIFromHistoricalData',
    description: 'Calculates the Relative Strength Index (RSI) from a provided list of historical closing prices. The historical data MUST be sorted oldest to newest. This tool should be called if the trading strategy involves RSI.',
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

const calculateSMAFromHistoricalData = ai.defineTool(
  {
    name: 'calculateSMAFromHistoricalData',
    description: 'Calculates Simple Moving Average (SMA) values from a provided list of historical closing prices. The historical data MUST be sorted oldest to newest. This tool should be called if the trading strategy involves SMAs (e.g., SMA crossover).',
    inputSchema: z.object({
      closingPrices: z.array(z.number()).describe('An array of historical closing prices, ordered from oldest to newest.'),
      period: z.number().describe('The period for SMA calculation (e.g., 10, 30).')
    }),
    outputSchema: z.object({
      smaValues: z.array(z.number()).describe('An array of SMA values, with the latest SMA at the end. Returns empty array if not enough data.'),
    }),
  },
  async (input: {closingPrices: number[], period: number}) => {
    const smaValues = await calculateSMA(input.closingPrices, input.period);
    return { smaValues };
  }
);


const prompt = ai.definePrompt({
  name: 'analyzeForexPairsPrompt',
  input: {schema: AnalyzeForexPairsInputSchema},
  output: {schema: AnalyzeForexPairsOutputSchema},
  tools: [getRealTimeForexPairData, getHistoricalForexPairDataTool, calculateRSIFromHistoricalData, calculateSMAFromHistoricalData],
  prompt: `You are an expert Forex trading analyst. Your goal is to provide a trading suggestion (buy/sell/hold), a timeframe, a target profit in pips, a specific stop loss price level, a specific profit target price level, and a brief analysis summary based on a GIVEN TRADING STRATEGY.

  Forex Pair: {{{symbol}}}
  Trading Strategy Name: {{{strategyName}}}
  Trading Strategy Rules:
  {{{strategyRules}}}

  To do this, you MUST perform the following steps:
  1. Use the 'getRealTimeForexPairData' tool to fetch the current real-time market data for {{{symbol}}}.
  2. If the 'Trading Strategy Rules' mention RSI, Simple Moving Averages (SMA), or other indicators requiring historical data:
     a. Use the 'getHistoricalForexPairData' tool to fetch appropriate historical data. For daily SMAs (e.g., 10-period, 30-period), request daily data for at least the past 90 days (e.g., symbol={{{symbol}}}, days=90, timespan='day', multiplier=1). Adjust 'days', 'timespan', and 'multiplier' as needed for other indicators or timeframes mentioned in the strategy. The data is sorted oldest to newest.
     b. Extract the closing prices from the historical data obtained.
     c. If the strategy uses RSI: Use the 'calculateRSIFromHistoricalData' tool with these closing prices to get the current RSI value. Incorporate this RSI value into your analysis. If RSI calculation is not possible (e.g. tool returns null), state this.
     d. If the strategy uses SMAs (e.g., "10-period SMA", "30-period SMA"): For EACH SMA period mentioned, use the 'calculateSMAFromHistoricalData' tool with the closing prices and the respective period to get the SMA values. You will get an array of SMA values; the last value in the array is the most recent. Use these recent SMA values for your analysis (e.g., checking for crossovers). If SMA calculation returns an empty array, state this.
  
  Once you have the real-time data, and relevant historical data derivatives (like RSI, SMAs), analyze them STRICTLY according to the provided 'Trading Strategy Rules'.
  
  Based on this strategy application:
  - Determine if a 'buy', 'sell', or 'hold' signal is generated. If no clear signal according to the strategy, state "Hold" or "No Signal".
  - Identify the most appropriate timeframe (e.g., daily, H4, H1) if not specified in the strategy, otherwise use the strategy's timeframe.
  - Calculate/determine the target profit in pips (targetProfitPips). If the strategy does not specify, you can suggest a reasonable target based on volatility or recent price action, typically between 20-100 pips for daily timeframe.
  - Calculate/determine a precise stop loss price level (stopLossLevel, e.g., 1.12345). Base this on the strategy, or if not specified, place it below a recent support (for buy) or above a recent resistance (for sell), typically 20-50 pips away for daily timeframe from the current price or entry point.
  - Calculate/determine a precise profit target price level (profitTargetLevel, e.g., 1.12845). Base this on the strategy, or if not specified, use a risk/reward ratio (e.g., 1:1.5 or 1:2) relative to the stop loss, or target a recent resistance (for buy) or support (for sell). The profit target level should be calculated from the current price or entry point.
  
  The analysisSummary should be concise and explain your reasoning by directly referencing how the current real-time data, historical data (and calculated indicators like RSI, SMAs) aligns with the specific conditions outlined in the 'Trading Strategy Rules'. Explicitly mention which parts of the strategy are met or not met. Explain the rationale for the stopLossLevel and profitTargetLevel based on the strategy or derived from it if not explicitly stated.

  Do not deviate from the provided strategy. If the strategy is unclear on certain aspects (e.g., exact SL/TP levels but implies a method), use your analytical skills to derive them in a way that is consistent with the strategy's logic.
  Ensure the stopLossLevel and profitTargetLevel are actual price values, correctly calculated based on the current price and the strategy's pip definition for SL/TP. For example, if current price is 1.12500 and strategy says buy with SL 20 pips, SL level is 1.12300.
  If critical data for the strategy (like RSI or SMAs when specified) cannot be obtained or calculated, clearly state this and explain why a definitive suggestion cannot be made. In such cases, the suggestion might be "No Signal due to missing data".
  Ensure numeric outputs (targetProfitPips, stopLossLevel, profitTargetLevel) are valid numbers.
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
    // Default to 0 if conversion fails, but the AI should ideally provide valid numbers.
    output.targetProfitPips = Number(output.targetProfitPips) || 0;
    output.stopLossLevel = Number(output.stopLossLevel) || 0;
    output.profitTargetLevel = Number(output.profitTargetLevel) || 0;
    
    // Additional validation: stop loss and profit target should make sense relative to a buy/sell
    // This is complex as it depends on current price and suggestion, better handled by prompt.
    // For example, for a BUY, profitTargetLevel should be > current price, stopLossLevel < current price.
    // The prompt already asks the AI to ensure this.

    return output;
  }
);
