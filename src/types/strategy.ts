import { z } from 'zod';

export const TradingStrategySchema = z.object({
  id: z.string().uuid().describe('Unique identifier for the strategy'),
  name: z.string().min(3, 'Strategy name must be at least 3 characters').max(50, 'Strategy name must be at most 50 characters').describe('User-defined name for the strategy'),
  description: z.string().max(200, 'Description must be at most 200 characters').optional().describe('Optional description of the strategy'),
  rules: z.string().min(10, 'Strategy rules must be at least 10 characters').describe('Detailed rules and conditions of the trading strategy, understandable by an AI model.'),
  // Example of more structured parameters if needed in the future:
  // parameters: z.array(z.object({
  //   indicator: z.string(),
  //   settings: z.record(z.any()),
  // })).optional(),
});

export type TradingStrategy = z.infer<typeof TradingStrategySchema>;

export const DefaultStrategies: TradingStrategy[] = [
  {
    id: 'f5a4c4b3-1b6d-4a9c-8f3a-4d3e2c1b0a9e',
    name: 'Simple MA Crossover',
    description: 'A basic strategy using moving average crossovers.',
    rules: 'Generate a BUY signal when a short-term moving average (e.g., 10-period SMA) crosses above a long-term moving average (e.g., 30-period SMA). Generate a SELL signal when the short-term MA crosses below the long-term MA. Consider recent price action and volume for confirmation. Set stop loss 20 pips below/above entry for buy/sell respectively. Set profit target at 40 pips.'
  },
  {
    id: 'c2b1a1e0-5e8d-4f2a-9c8b-7d6e5f4a3b2c',
    name: 'RSI Overbought/Oversold',
    description: 'Trades based on RSI indicator reaching overbought or oversold levels.',
    rules: 'Generate a SELL signal when RSI (14-period) crosses above 70 (overbought) and then starts to decline. Generate a BUY signal when RSI crosses below 30 (oversold) and then starts to rise. Confirm with price action (e.g., reversal candlestick patterns). Set stop loss 25 pips beyond the recent swing high/low. Set profit target at 50 pips or next significant support/resistance.'
  }
];
