import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')
    const timeframe = searchParams.get('timeframe')

    if (!symbol || !timeframe) {
      return NextResponse.json({ 
        error: 'Symbol and timeframe are required' 
      }, { status: 400 })
    }

    // Calculate date range based on timeframe
    const now = new Date()
    let startDate = new Date()

    switch (timeframe) {
      case '1D':
        startDate.setDate(now.getDate() - 1)
        break
      case '1W':
        startDate.setDate(now.getDate() - 7)
        break
      case '1M':
        startDate.setMonth(now.getMonth() - 1)
        break
      default:
        return NextResponse.json({ 
          error: 'Invalid timeframe' 
        }, { status: 400 })
    }

    const historicalData = await prisma.forexData.findMany({
      where: {
        symbol,
        timestamp: {
          gte: startDate
        }
      },
      orderBy: {
        timestamp: 'desc'
      }
    })

    return NextResponse.json(historicalData)
  } catch (error) {
    console.error('Error in historical data route:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch historical data' 
    }, { status: 500 })
  }
}