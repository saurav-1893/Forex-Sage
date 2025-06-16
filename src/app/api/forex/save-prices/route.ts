import { NextResponse } from 'next/server'
import { oandaApiService } from '@/services/oanda-api'
import { prisma } from '@/lib/server/prisma-service'

export async function POST(request: Request) {
  try {
    const { instruments } = await request.json()
    
    // Fetch live prices
    const livePrices = await oandaApiService.fetchLivePrices(instruments)
    
    // Save prices server-side
    await prisma.livePrice.createMany({
      data: livePrices,
      skipDuplicates: true
    })

    return NextResponse.json({ 
      success: true, 
      savedPrices: livePrices.length 
    })
  } catch (error) {
    console.error('Price Saving Error:', error)
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}