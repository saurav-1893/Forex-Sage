import { oandaApiService } from '@/services/oanda-api'

export async function syncForexData() {
  const instruments = ['EUR/USD', 'GBP/USD', 'USD/JPY']
  const granularities = ['M1', 'M5', 'H1', 'D']

  for (const instrument of instruments) {
    for (const granularity of granularities) {
      try {
        await oandaApiService.fetchAndSaveHistoricalCandles(
          instrument, 
          granularity
        )
      } catch (error) {
        console.error(`Sync Error for ${instrument} - ${granularity}:`, error)
      }
    }
  }
}

// Can be used with a task scheduler or cron job