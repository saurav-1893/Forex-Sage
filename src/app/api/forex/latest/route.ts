import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    // Log incoming request
    console.log('Incoming request URL:', request.url)

    const { searchParams } = new URL(request.url)
    const symbol = searchParams.get('symbol')

    console.log('Requested Symbol:', symbol)

    if (!symbol) {
      return NextResponse.json({ error: 'Symbol is required' }, { status: 400 })
    }

    // Verify model exists and log total records
    const totalRecords = await prisma.forexData.count()
    console.log('Total Forex Data Records:', totalRecords)

    const latestData = await prisma.forexData.findFirst({
      where: { symbol },
      orderBy: { timestamp: 'desc' },
      // Add select to ensure fields exist
      select: {
        id: true,
        symbol: true,
        timestamp: true,
        price: true
      }
    })

    console.log('Latest Data Found:', latestData)

    if (!latestData) {
      return NextResponse.json({ 
        error: `No data found for symbol: ${symbol}` 
      }, { status: 404 })
    }

    return NextResponse.json(latestData)
  } catch (error) {
    console.error('Detailed Error:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch data', 
      details: error instanceof Error ? error.message : String(error) 
    }, { status: 500 })
  }
}