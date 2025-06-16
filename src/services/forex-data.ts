import type { ForexData, ForexPair, HistoricalForexDataPoint, TimeframeOption } from "@/types/forex";
import { prisma } from '@/lib/prisma';
import { oandaApiService } from './oanda-api'
import { validateOandaConfig } from '@/lib/env-config'
import { fetchLivePrices } from '@/actions/forex-actions'

/**
 * Fetches current forex data for a given pair
 * @param pair The forex pair to fetch data for
 * @returns Promise resolving to forex data
 */
export async function getForexData(symbol: string) {
  try {
    // Fetch live prices for a single instrument
    const livePrices = await fetchLivePrices([symbol])
    
    // Return the first (and only) price
    const data = livePrices[0]
    
    // Transform Oanda response to your needed format
    return {
      symbol: data.instrument,
      price: data.bid, // or data.ask, depending on your preference
      timestamp: new Date(data.timestamp)
    }
  } catch (error) {
    console.error('Forex Data Fetch Error:', error)
    throw error
  }
}

/**
 * Provides mock forex data for development/demo purposes
 */
function getMockForexData(symbol: string): ForexData {
  // Generate realistic but fake data based on the symbol
  const baseValue = getBaseValueForSymbol(symbol);
  const spread = 0.0002; // 2 pips spread
  
  return {
    symbol,
    bid: baseValue,
    ask: baseValue + spread,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generates a realistic base value for a forex pair
 */
function getBaseValueForSymbol(symbol: string): number {
  // Common forex pairs with realistic values
  const basePrices: Record<string, number> = {
    'EURUSD': 1.0876,
    'GBPUSD': 1.2654,
    'USDJPY': 149.67,
    'AUDUSD': 0.6543,
    'USDCAD': 1.3654,
    'USDCHF': 0.8976,
    'NZDUSD': 0.6123,
    'EURGBP': 0.8567,
    'EURJPY': 162.76,
    'GBPJPY': 189.43,
  };
  
  // Return the base price if it exists, otherwise generate a random one
  return basePrices[symbol] || 1.0 + Math.random() * 0.5;
}

/**
 * Fetches historical forex data for a given pair and timeframe
 */
export async function getHistoricalForexData(
  pair: ForexPair | string,
  timeframe: TimeframeOption
): Promise<HistoricalForexDataPoint[]> {
  const symbol = typeof pair === 'string' 
    ? pair.toUpperCase() 
    : pair?.symbol?.toUpperCase();
  const timeframeStart = getTimeframeStartDate(timeframe);

  // Fetch historical data from database
  const historicalData = await prisma.forexData.findMany({
    where: {
      symbol,
      timestamp: {
        gte: timeframeStart
      }
    },
    orderBy: {
      timestamp: 'asc'
    }
  });

  return historicalData.map(data => ({
    timestamp: data.timestamp.toISOString(),
    open: data.bid,
    high: data.ask,
    low: data.bid,
    close: data.ask,
    volume: Math.floor(Math.random() * 1000) + 500 // Mock volume data
  }));
}

function getTimeframeStartDate(timeframe: TimeframeOption): Date {
  const now = new Date();
  switch(timeframe) {
    case '1h': return new Date(now.setHours(now.getHours() - 1));
    case '4h': return new Date(now.setHours(now.getHours() - 4));
    case '1d': return new Date(now.setDate(now.getDate() - 1));
    case '1w': return new Date(now.setDate(now.getDate() - 7));
    case '1m': return new Date(now.setMonth(now.getMonth() - 1));
    default: return new Date(now.setDate(now.getDate() - 1));
  }
}