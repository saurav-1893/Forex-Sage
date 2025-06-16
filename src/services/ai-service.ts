'use server';

import { safeGenerateText } from '@/ai/genkit';

/**
 * Generates an AI response based on user input
 * @param userMessage The message from the user
 * @returns The AI-generated response
 */
export async function smartGenerate(prompt: string): Promise<string> {
  // Check if we're in development and don't have internet access
  if (process.env.NODE_ENV === 'development') {
    console.warn('AI service unavailable in development mode')
    return "I'm sorry, the AI service is currently unavailable. This appears to be a network connectivity issue. Please check your internet connection and try again."
  }

  try {
    const response = await fetch('https://api.openrouter.com/v1/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'ForexSage'
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful forex trading assistant. Provide accurate, helpful information about forex trading, market analysis, and trading strategies.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`)
    }

    const data = await response.json()
    return data.choices[0]?.message?.content || 'No response generated'
    
  } catch (error) {
    console.error('AI Service Error:', error)
    
    // Return a helpful fallback response
    if (error instanceof Error && error.message.includes('ENOTFOUND')) {
      return "I'm experiencing network connectivity issues. Please check your internet connection and try again. In the meantime, feel free to explore the live forex data and trading strategies on the main dashboard."
    }
    
    return "I'm temporarily unavailable. Please try again in a moment, or explore the forex dashboard for live market data and trading insights."
  }
}

/**
 * Analyzes a forex pair and provides trading insights
 * @param pairSymbol The forex pair symbol (e.g., EURUSD)
 * @param timeframe The timeframe for analysis
 * @param strategyRules Optional trading strategy rules to apply
 * @returns Analysis results and recommendations
 */
export async function analyzeForexPair(
  pairSymbol: string,
  timeframe: string,
  strategyRules?: string
) {
  try {
    const prompt = `Analyze the ${pairSymbol} forex pair on the ${timeframe} timeframe.
    ${strategyRules ? `Apply the following trading strategy: ${strategyRules}` : ''}
    
    Provide:
    1. Current market sentiment
    2. Key support and resistance levels
    3. Technical indicator analysis
    4. Trading recommendation (buy, sell, or hold)
    5. Risk management suggestions`;

    const response = await safeGenerateText(prompt);

    return {
      analysis: response.text(),
      pairSymbol,
      timeframe,
      timestamp: new Date().toISOString(),
      success: true,
    };
  } catch (error) {
    console.error('Error analyzing forex pair:', error);
    return {
      analysis: "I'm sorry, I encountered an error while analyzing this forex pair. Please try again later.",
      pairSymbol,
      timeframe,
      timestamp: new Date().toISOString(),
      success: false,
    };
  }
}

/**
 * Generates a mock response for development and testing
 * @param prompt The prompt to generate a response for
 * @returns A mock response
 */
export async function generateMockResponse(prompt: string): Promise<{ response: string }> {
  console.log("Using mock AI response for prompt:", prompt.substring(0, 100) + "...");

  // Return different mock responses based on prompt content
  if (prompt.toLowerCase().includes("forex") || prompt.toLowerCase().includes("trading")) {
    return {
      response: "This is a mock response for forex-related queries. In a real scenario, I would analyze market trends, technical indicators, and provide trading insights based on historical data patterns.",
    };
  } else if (prompt.toLowerCase().includes("strategy")) {
    return {
      response: "This is a mock response about trading strategies. I would typically recommend diversification, risk management, and technical analysis based on your specific goals and risk tolerance.",
    };
  } else {
    return {
      response: "This is a mock AI response to save API quota during development. In production, this would be a real response from the AI API.",
    };
  }
}
