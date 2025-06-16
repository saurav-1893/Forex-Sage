import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json()
    
    // Simple forex-related responses for now
    const responses = [
      "Based on current market conditions, it's important to consider risk management in your trading strategy. The forex market can be volatile, so always use proper position sizing.",
      "For forex trading, key factors to watch include economic indicators, central bank policies, and geopolitical events. These can significantly impact currency pairs.",
      "Remember that successful forex trading requires patience, discipline, and continuous learning. Consider starting with a demo account if you're new to trading.",
      "Technical analysis tools like moving averages, RSI, and support/resistance levels can help identify potential trading opportunities in the forex market.",
      "Risk management is crucial in forex trading. Never risk more than you can afford to lose, and consider using stop-loss orders to protect your capital."
    ]
    
    const randomResponse = responses[Math.floor(Math.random() * responses.length)]
    
    return NextResponse.json({ response: randomResponse })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    )
  }
}