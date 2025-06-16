const OANDA_API_KEY = process.env.NEXT_PUBLIC_OANDA_API_KEY
const OANDA_ACCOUNT_ID = process.env.NEXT_PUBLIC_OANDA_ACCOUNT_ID
const OANDA_ENV = process.env.NEXT_PUBLIC_OANDA_ENV || 'live'

// Use streaming API for real-time data
const OANDA_STREAM_URL = OANDA_ENV === 'practice' 
  ? 'https://stream-fxpractice.oanda.com'
  : 'https://stream-fxtrade.oanda.com'

// Keep REST API for historical data and account operations
const OANDA_REST_URL = OANDA_ENV === 'practice'
  ? 'https://api-fxpractice.oanda.com'
  : 'https://api-fxtrade.oanda.com'

interface StreamingPrice {
  type: 'PRICE'
  instrument: string
  time: string
  status: string
  tradeable: boolean
  bids: Array<{ price: string; liquidity: number }>
  asks: Array<{ price: string; liquidity: number }>
  closeoutBid: string
  closeoutAsk: string
  quoteHomeConversionFactors?: any
  unitsAvailable?: any
}

interface StreamingHeartbeat {
  type: 'HEARTBEAT'
  time: string
}

type StreamingData = StreamingPrice | StreamingHeartbeat

class OandaStreamingAPI {
  private activeStreams: Map<string, AbortController> = new Map()
  private priceCallbacks: Map<string, (price: StreamingPrice) => void> = new Map()
  private reconnectAttempts: Map<string, number> = new Map()
  private maxReconnectAttempts = 5
  private reconnectDelay = 1000 // Start with 1 second

  // REST API methods for historical data
  async getCandles(instrument: string, granularity: string, count: number = 100) {
    if (!OANDA_API_KEY) {
      throw new Error('OANDA API key not configured')
    }

    const url = `${OANDA_REST_URL}/v3/instruments/${instrument}/candles`
    const params = new URLSearchParams({
      granularity,
      count: count.toString(),
      price: 'M' // Mid prices
    })

    const response = await fetch(`${url}?${params}`, {
      headers: {
        'Authorization': `Bearer ${OANDA_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      throw new Error(`OANDA API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()
    return data.candles || []
  }

  // Streaming API methods
  async startPriceStream(
    instruments: string[], 
    onPrice: (price: StreamingPrice) => void,
    onError?: (error: Error) => void,
    onReconnect?: () => void
  ): Promise<string> {
    if (!OANDA_API_KEY) {
      throw new Error('OANDA API key not configured')
    }

    const streamId = `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const controller = new AbortController()
    
    this.activeStreams.set(streamId, controller)
    this.priceCallbacks.set(streamId, onPrice)
    this.reconnectAttempts.set(streamId, 0)

    const startStream = async () => {
      try {
        const url = `${OANDA_STREAM_URL}/v3/accounts/${OANDA_ACCOUNT_ID}/pricing/stream`
        const params = new URLSearchParams({
          instruments: instruments.join(','),
          snapshot: 'true'
        })

        console.log(`Starting OANDA price stream for: ${instruments.join(', ')}`)

        const response = await fetch(`${url}?${params}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${OANDA_API_KEY}`,
            'Accept': 'application/stream+json'
          },
          signal: controller.signal
        })

        if (!response.ok) {
          throw new Error(`OANDA Streaming API error: ${response.status} ${response.statusText}`)
        }

        if (!response.body) {
          throw new Error('No response body from OANDA streaming API')
        }

        // Reset reconnect attempts on successful connection
        this.reconnectAttempts.set(streamId, 0)
        onReconnect?.()

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          
          if (done) {
            console.log('OANDA stream ended')
            break
          }

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || '' // Keep incomplete line in buffer

          for (const line of lines) {
            if (line.trim()) {
              try {
                const data: StreamingData = JSON.parse(line)
                
                if (data.type === 'PRICE') {
                  onPrice(data)
                } else if (data.type === 'HEARTBEAT') {
                  // Handle heartbeat to keep connection alive
                  console.log('OANDA heartbeat received')
                }
              } catch (parseError) {
                console.error('Error parsing streaming data:', parseError, 'Line:', line)
              }
            }
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('OANDA stream aborted')
          return
        }

        console.error('OANDA streaming error:', error)
        onError?.(error instanceof Error ? error : new Error('Unknown streaming error'))

        // Attempt to reconnect
        const attempts = this.reconnectAttempts.get(streamId) || 0
        if (attempts < this.maxReconnectAttempts && this.activeStreams.has(streamId)) {
          this.reconnectAttempts.set(streamId, attempts + 1)
          const delay = this.reconnectDelay * Math.pow(2, attempts) // Exponential backoff
          
          console.log(`Attempting to reconnect OANDA stream in ${delay}ms (attempt ${attempts + 1}/${this.maxReconnectAttempts})`)
          
          setTimeout(() => {
            if (this.activeStreams.has(streamId)) {
              startStream()
            }
          }, delay)
        } else {
          console.error('Max reconnection attempts reached for OANDA stream')
          this.stopPriceStream(streamId)
        }
      }
    }

    startStream()
    return streamId
  }

  stopPriceStream(streamId: string) {
    const controller = this.activeStreams.get(streamId)
    if (controller) {
      controller.abort()
      this.activeStreams.delete(streamId)
      this.priceCallbacks.delete(streamId)
      this.reconnectAttempts.delete(streamId)
      console.log(`Stopped OANDA price stream: ${streamId}`)
    }
  }

  stopAllStreams() {
    console.log('Stopping all OANDA price streams')
    for (const [streamId] of this.activeStreams) {
      this.stopPriceStream(streamId)
    }
  }

  // Legacy method for backward compatibility - now uses streaming data
  async getCurrentPrices(instruments: string[]): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const prices: any[] = []
      const receivedInstruments = new Set<string>()
      
      const streamId = this.startPriceStream(
        instruments,
        (price) => {
          // Convert streaming price to legacy format
          const legacyPrice = {
            instrument: price.instrument,
            time: price.time,
            closeoutBid: price.closeoutBid,
            closeoutAsk: price.closeoutAsk,
            status: price.tradeable ? 'tradeable' : 'non-tradeable'
          }
          
          // Update or add price
          const existingIndex = prices.findIndex(p => p.instrument === price.instrument)
          if (existingIndex >= 0) {
            prices[existingIndex] = legacyPrice
          } else {
            prices.push(legacyPrice)
          }
          
          receivedInstruments.add(price.instrument)
          
          // Resolve when we have prices for all requested instruments
          if (receivedInstruments.size === instruments.length) {
            this.stopPriceStream(streamId)
            resolve(prices)
          }
        },
        (error) => {
          this.stopPriceStream(streamId)
          reject(error)
        }
      )
      
      // Timeout after 10 seconds
      setTimeout(() => {
        if (this.activeStreams.has(streamId)) {
          this.stopPriceStream(streamId)
          if (prices.length > 0) {
            resolve(prices) // Return partial data
          } else {
            reject(new Error('Timeout waiting for price data'))
          }
        }
      }, 10000)
    })
  }

  getActiveStreamCount(): number {
    return this.activeStreams.size
  }

  getStreamStatus(): { streamId: string; reconnectAttempts: number }[] {
    return Array.from(this.activeStreams.keys()).map(streamId => ({
      streamId,
      reconnectAttempts: this.reconnectAttempts.get(streamId) || 0
    }))
  }
}

export const oandaAPI = new OandaStreamingAPI()

// Cleanup streams when page unloads
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    oandaAPI.stopAllStreams()
  })
}