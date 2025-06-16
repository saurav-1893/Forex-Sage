'use server'

import { prisma } from '@/lib/server/prisma-service'
import axios from 'axios'

const OANDA_BASE_URL = 'https://api-fxtrade.oanda.com/v3'
const ACCOUNT_ID = process.env.NEXT_PUBLIC_OANDA_ACCOUNT_ID
const API_KEY = process.env.NEXT_PUBLIC_OANDA_API_KEY

// Server-side function to fetch live prices
export async function fetchLivePrices(instruments: string[]) {
  try {
    const client = axios.create({
      baseURL: OANDA_BASE_URL,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept-Datetime-Format': 'RFC3339'
      }
    })

    const response = await client.get(`/accounts/${ACCOUNT_ID}/pricing`, {
      params: {
        instruments: instruments.map(i => i.replace('/', '_')).join(',')
      }
    })

    return response.data.prices.map((price: any) => ({
      instrument: price.instrument,
      bid: parseFloat(price.bids[0].price),
      ask: parseFloat(price.asks[0].price),
      timestamp: new Date(price.time)
    }))
  } catch (error) {
    console.error('Live Prices Fetch Error:', error)
    throw error
  }
}

// Server-side function to fetch historical candles
export async function fetchHistoricalCandles(
  instrument: string, 
  granularity: string = 'H1', 
  count: number = 500
) {
  try {
    const client = axios.create({
      baseURL: OANDA_BASE_URL,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept-Datetime-Format': 'RFC3339'
      }
    })

    const formattedInstrument = instrument.replace('/', '_')
    
    const response = await client.get(`/accounts/${ACCOUNT_ID}/instruments/${formattedInstrument}/candles`, {
      params: {
        granularity,
        count,
        price: 'M'
      }
    })

    const candles = response.data.candles
      .filter((candle: any) => candle.complete)
      .map((candle: any) => ({
        instrument: formattedInstrument,
        granularity,
        timestamp: new Date(candle.time),
        open: parseFloat(candle.mid.o),
        high: parseFloat(candle.mid.h),
        low: parseFloat(candle.mid.l),
        close: parseFloat(candle.mid.c),
        volume: candle.volume || 0
      }))

    // Try to save to database, but don't fail if it doesn't work
    try {
      await prisma.forexCandle.createMany({
        data: candles,
        skipDuplicates: true
      })
    } catch (dbError) {
      console.warn('Database save failed, continuing without saving:', dbError)
    }

    return candles
  } catch (error) {
    console.error('Historical Candles Fetch Error:', error)
    throw error
  }
}

// Server-side function to save live prices
export async function saveLivePrices(instruments: string[]) {
  try {
    const livePrices = await fetchLivePrices(instruments)
    
    // Try to save to database
    try {
      await prisma.livePrice.createMany({
        data: livePrices,
        skipDuplicates: true
      })
    } catch (dbError) {
      console.warn('Database save failed:', dbError)
    }

    return {
      success: true,
      savedCount: livePrices.length,
      prices: livePrices
    }
  } catch (error) {
    console.error('Save Live Prices Error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}