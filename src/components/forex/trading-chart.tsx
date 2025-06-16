'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, BarChart3, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { oandaAPI } from '@/lib/oanda-api'

interface TradingChartProps {
  selectedPair: string
  selectedTimeframe: string
}

interface CandleData {
  time: string
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

interface RealtimePrice {
  time: string
  price: number
}

export function TradingChart({ selectedPair, selectedTimeframe }: TradingChartProps) {
  const [chartData, setChartData] = useState<CandleData[]>([])
  const [realtimePrices, setRealtimePrices] = useState<RealtimePrice[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [chartType, setChartType] = useState<'line' | 'candlestick'>('line')
  const [error, setError] = useState<string | null>(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamStatus, setStreamStatus] = useState<'disconnected' | 'connected' | 'error'>('disconnected')
  
  const streamIdRef = useRef<string | null>(null)
  const maxRealtimePoints = 100

  const fetchHistoricalData = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const candles = await oandaAPI.getCandles(selectedPair, selectedTimeframe, 100)
      
      const formattedData: CandleData[] = candles.map((candle: any) => ({
        time: new Date(candle.time).toLocaleTimeString(),
        timestamp: new Date(candle.time).getTime(),
        open: parseFloat(candle.mid.o),
        high: parseFloat(candle.mid.h),
        low: parseFloat(candle.mid.l),
        close: parseFloat(candle.mid.c),
        volume: candle.volume
      }))
      
      setChartData(formattedData)
    } catch (err) {
      console.error('Failed to fetch historical data:', err)
      setError('Failed to load historical data, showing mock data')
      
      // Generate realistic mock historical data
      const mockData: CandleData[] = []
      const basePrice = selectedPair === 'GBP_USD' ? 1.3520 : 
                       selectedPair === 'EUR_USD' ? 1.0845 : 1.0000
      
      for (let i = 0; i < 50; i++) {
        const timestamp = Date.now() - (50 - i) * 60000
        const time = new Date(timestamp).toLocaleTimeString()
        const open = basePrice + (Math.random() - 0.5) * 0.01
        const close = open + (Math.random() - 0.5) * 0.005
        const high = Math.max(open, close) + Math.random() * 0.002
        const low = Math.min(open, close) - Math.random() * 0.002
        
        mockData.push({
          time,
          timestamp,
          open: Number(open.toFixed(5)),
          high: Number(high.toFixed(5)),
          low: Number(low.toFixed(5)),
          close: Number(close.toFixed(5)),
          volume: Math.floor(Math.random() * 1000) + 100
        })
      }
      
      setChartData(mockData)
    } finally {
      setIsLoading(false)
    }
  }

  const startRealtimeStream = async () => {
    if (streamIdRef.current) {
      oandaAPI.stopPriceStream(streamIdRef.current)
    }

    try {
      streamIdRef.current = await oandaAPI.startPriceStream(
        [selectedPair],
        (priceData) => {
          const price = parseFloat(priceData.closeoutBid)
          const newPrice: RealtimePrice = {
            time: new Date(priceData.time).toLocaleTimeString(),
            price
          }
          
          setRealtimePrices(prev => {
            const updated = [...prev, newPrice].slice(-maxRealtimePoints)
            return updated
          })
          
          setStreamStatus('connected')
        },
        (error) => {
          console.error('Chart streaming error:', error)
          setStreamStatus('error')
        },
        () => {
          setStreamStatus('connected')
        }
      )
      
      setIsStreaming(true)
    } catch (err) {
      console.error('Failed to start realtime stream:', err)
      setStreamStatus('error')
    }
  }

  const stopRealtimeStream = () => {
    if (streamIdRef.current) {
      oandaAPI.stopPriceStream(streamIdRef.current)
      streamIdRef.current = null
    }
    setIsStreaming(false)
    setStreamStatus('disconnected')
  }

  useEffect(() => {
    fetchHistoricalData()
  }, [selectedPair, selectedTimeframe])

  useEffect(() => {
    startRealtimeStream()
    
    return () => {
      stopRealtimeStream()
    }
  }, [selectedPair])

  // Combine historical and realtime data for display
  const combinedData = [...chartData]
  if (realtimePrices.length > 0 && chartData.length > 0) {
    // Add realtime prices as additional points
    const lastHistoricalTime = chartData[chartData.length - 1]?.timestamp || Date.now()
    
    realtimePrices.forEach((rtPrice, index) => {
      const timestamp = lastHistoricalTime + (index + 1) * 1000
      combinedData.push({
        time: rtPrice.time,
        timestamp,
        open: rtPrice.price,
        high: rtPrice.price,
        low: rtPrice.price,
        close: rtPrice.price,
        volume: 0
      })
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              {selectedPair.replace('_', '/')} Chart - {selectedTimeframe}
              {streamStatus === 'connected' ? (
                <Wifi className="h-4 w-4 text-green-600" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-600" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={streamStatus === 'connected' ? 'default' : 'secondary'}>
                {streamStatus === 'connected' ? 'Live' : 'Historical'}
              </Badge>
              <Select value={chartType} onValueChange={(value: 'line' | 'candlestick') => setChartType(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="candlestick">Candlestick</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={fetchHistoricalData} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={isStreaming ? stopRealtimeStream : startRealtimeStream}
              >
                {isStreaming ? 'Stop Live' : 'Start Live'}
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Historical price chart with real-time streaming updates
            {error && <span className="text-red-600 ml-2">• {error}</span>}
            {streamStatus === 'connected' && (
              <span className="text-green-600 ml-2">• Live data streaming</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                  <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                  <p className="text-muted-foreground">Loading chart data...</p>
                </div>
              </div>
            ) : combinedData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={combinedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={['dataMin - 0.001', 'dataMax + 0.001']} />
                  <Tooltip 
                    formatter={(value: number) => [value.toFixed(5), 'Price']}
                    labelFormatter={(label) => `Time: ${label}`}
                  />
                  <Legend />
                  {chartType === 'line' ? (
                    <>
                      {/* Historical data */}
                      <Line 
                        type="monotone" 
                        dataKey="close" 
                        stroke="#2563eb" 
                        strokeWidth={2}
                        dot={false}
                        name="Historical Price"
                        connectNulls={false}
                      />
                      {/* Realtime data overlay */}
                      {realtimePrices.length > 0 && (
                        <Line 
                          type="monotone" 
                          dataKey="close" 
                          stroke="#10b981" 
                          strokeWidth={3}
                          dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                          name="Live Price"
                          connectNulls={true}
                        />
                      )}
                    </>
                  ) : (
                    <>
                      <Line type="monotone" dataKey="high" stroke="#10b981" strokeWidth={1} dot={false} name="High" />
                      <Line type="monotone" dataKey="low" stroke="#ef4444" strokeWidth={1} dot={false} name="Low" />
                      <Line type="monotone" dataKey="close" stroke="#2563eb" strokeWidth={2} dot={false} name="Close" />
                      <Line type="monotone" dataKey="open" stroke="#f59e0b" strokeWidth={1} dot={false} name="Open" />
                    </>
                  )}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center space-y-4">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                  <p className="text-lg font-medium">No chart data available</p>
                  <p className="text-muted-foreground">Click refresh to load chart data</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Chart Statistics */}
      {combinedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Chart Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Current Price</p>
                <p className="text-xl font-bold text-blue-600">
                  {combinedData[combinedData.length - 1]?.close.toFixed(5)}
                </p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Session High</p>
                <p className="text-xl font-bold text-green-600">
                  {Math.max(...combinedData.map(d => d.high)).toFixed(5)}
                </p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Session Low</p>
                <p className="text-xl font-bold text-red-600">
                  {Math.min(...combinedData.map(d => d.low)).toFixed(5)}
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Live Points</p>
                <p className="text-xl font-bold text-purple-600">
                  {realtimePrices.length}
                </p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Stream Status</p>
                <p className={`text-xl font-bold ${
                  streamStatus === 'connected' ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {streamStatus === 'connected' ? 'Live' : 'Offline'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

