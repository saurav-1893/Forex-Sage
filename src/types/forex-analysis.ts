import { z } from 'zod';

export const AnalyzeForexPairsInputSchema = z.object({
  pairSymbol: z.string(),
  timeframe: z.string(),
  strategyId: z.string().optional(),
});

export const AnalyzeForexPairsOutputSchema = z.object({
  analysis: z.string(),
  pairSymbol: z.string(),
  timeframe: z.string(),
  strategyId: z.string().optional(),
  timestamp: z.string(),
  success: z.boolean(),
});

export type AnalyzeForexPairsInput = z.infer<typeof AnalyzeForexPairsInputSchema>;
export type AnalyzeForexPairsOutput = z.infer<typeof AnalyzeForexPairsOutputSchema>;