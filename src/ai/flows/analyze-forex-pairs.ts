// This is an AI-powered agent that analyzes forex pairs and provides buy/sell suggestions based on backtesting data.
// It also includes a timeframe, target profit in pips, stop loss level, profit target level, and an analysis summary.

'use server';

import { ai } from '@/ai/genkit';
import { DefaultStrategies } from '@/types/strategy';

// Define the types directly in this file
export interface AnalyzeForexPairsInput {
  pairSymbol: string;
  timeframe: string;
  strategyId?: string;
}

export interface AnalyzeForexPairsOutput {
  analysis: string;
  pairSymbol: string;
  timeframe: string;
  strategyId?: string;
  timestamp: string;
  success: boolean;
}

// Export the analyzeForexPairs function as an async function
export async function analyzeForexPairs(input: AnalyzeForexPairsInput): Promise<AnalyzeForexPairsOutput> {
  // Find the strategy based on strategyId or use a default
  const strategy = input.strategyId 
    ? DefaultStrategies.find(s => s.id === input.strategyId) 
    : DefaultStrategies[0];

  const systemPrompt = "You are an expert forex trading analyst. Provide detailed market analysis with clear recommendations.";
  
  const userPrompt = `
    Analyze ${input.pairSymbol} forex pair on ${input.timeframe} timeframe.
    
    Strategy: ${strategy?.name}
    Rules: ${strategy?.rules}
    
    Provide a structured analysis including:
    1. Current Market Trend
    2. Support and Resistance Levels
    3. Technical Indicators
    4. Entry/Exit Points
    5. Risk Management
    6. Trade Setup Based on Strategy Rules
  `;

  try {
    console.log('Starting analysis with OpenRouter...');
    
    const response = await ai.generate(JSON.stringify({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    }));

    console.log('OpenRouter Response:', response);

    const analysisText = response.choices?.[0]?.message?.content;
    
    if (!analysisText) {
      console.error('No analysis content in response');
      throw new Error('Empty analysis received');
    }

    // Return the analysis with additional context
    return {
      analysis: analysisText,
      pairSymbol: input.pairSymbol,
      timeframe: input.timeframe,
      strategyId: input.strategyId,
      timestamp: new Date().toISOString(),
      success: true,
    };
  } catch (error) {
    console.error('Detailed Analysis Error:', error); // This should show in your server logs
    
    // Fallback response
    return {
      analysis: "Our analysis system is currently experiencing high demand. Please try again in a moment.",
      pairSymbol: input.pairSymbol,
      timeframe: input.timeframe,
      strategyId: input.strategyId,
      timestamp: new Date().toISOString(),
      success: false, // Make sure this is set to false
    };
  }
}
