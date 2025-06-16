import { fetchHistoricalCandles } from '@/actions/forex-actions'

export async function getHistoricalForexData(
  symbol: string,
  timeframe: string = 'H1',
  count: number = 500
) {
  try {
    const candles = await fetchHistoricalCandles(symbol, timeframe, count)
    
    return {
      candles: candles.map((candle: any) => ({
        time: candle.timestamp,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
        volume: candle.volume
      }))
    }
  } catch (error) {
    console.error('Historical Forex Data Error:', error)
    throw error
  }
}