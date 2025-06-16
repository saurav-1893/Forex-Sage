// This file now serves as a client-side wrapper for server actions
import { fetchLivePrices, saveLivePrices, fetchHistoricalCandles } from '@/actions/forex-actions'

export class OandaApiService {
  // Client-side method to fetch live prices
  async fetchLivePrices(instruments: string[]) {
    return fetchLivePrices(instruments)
  }

  // Client-side method to save live prices
  async saveLivePrices(instruments: string[]) {
    return saveLivePrices(instruments)
  }

  // Client-side method to fetch historical candles
  async fetchHistoricalCandles(
    instrument: string, 
    granularity: string = 'H1', 
    count: number = 500
  ) {
    return fetchHistoricalCandles(instrument, granularity, count)
  }
}

// Singleton instance
export const oandaApiService = new OandaApiService()