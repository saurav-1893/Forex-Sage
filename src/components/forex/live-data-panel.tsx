'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RefreshCw, TrendingUp, TrendingDown, Activity, AlertCircle, Wifi, WifiOff } from 'lucide-react'
import { oandaAPI } from '@/lib/oanda-api'

interface ForexPair {
  symbol: string
  name: string
  bid: number
  ask: number
  spread: number
  change: number
  changePercent: number
  lastUpdate: string
  status: 'active' | 'inactive' | 'error'
}

interface LiveDataPanelProps {
  selectedPair: string
  onPairChange: (pair: string) => void
  selectedTimeframe: string
  onTimeframeChange: (timeframe: string) => void
  onMarketDataUpdate?: (data: any) => void
}

export function LiveDataPanel({ 
  selectedPair, 
  onPairChange, 
  selectedTimeframe, 
  onTimeframeChange,
  onMarketDataUpdate 
}: LiveDataPanelProps) {
  const [forexPairs, setForexPairs] = useState<ForexPair[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamStatus, setStreamStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected')
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [error, setError] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [priceHistory, setPriceHistory] = useState<Map<string, number[]>>(new Map())
  
  const streamIdRef = useRef<string | null>(null)
  const reconnectCountRef = useRef(0)

  const availablePairs = [
    { symbol: 'EUR_USD', name: 'Euro / US Dollar' },
    { symbol: 'GBP_USD', name: 'British Pound / US Dollar' },
    { symbol: 'USD_JPY', name: 'US Dollar / Japanese Yen' },
    { symbol: 'USD_CHF', name: 'US Dollar / Swiss Franc' },
    { symbol: 'AUD_USD', name: 'Australian Dollar / US Dollar' },
    { symbol: 'USD_CAD', name: 'US Dollar / Canadian Dollar' },
    { symbol: 'NZD_USD', name: 'New Zealand Dollar / US Dollar' },
    { symbol: 'EUR_GBP', name: 'Euro / British Pound' }
  ]

  const timeframes = [
    { value: 'M15', label: '15 Minutes' },
    { value: 'H1', label: '1 Hour' },
    { value: 'H4', label: '4 Hours' },
    { value: 'D', label: '1 Day' }
  ]

  // Calculate price change based on history
  const calculateChange = (symbol: string, currentPrice: number): { change: number; changePercent: number } => {
    const history = priceHistory.get(symbol) || []
    if (history.length === 0) {
      return { change: 0, changePercent: 0 }
    }
    
    const previousPrice = history[0] // First price we received
    const change = currentPrice - previousPrice
    const changePercent = (change / previousPrice) * 100
    
    return { 
      change: Number(change.toFixed(5)), 
      changePercent: Number(changePercent.toFixed(2)) 
    }
  }

  // Update price history
  const updatePriceHistory = (symbol: string, price: number) => {
    setPriceHistory(prev => {
      const newHistory = new Map(prev)
      const history = newHistory.get(symbol) || []
      
      // Keep last 100 prices for change calculation
      const updatedHistory = [price, ...history].slice(0, 100)
      newHistory.set(symbol, updatedHistory)
      
      return newHistory
    })
  }

  const startStreaming = async () => {
    if (streamIdRef.current) {
      oandaAPI.stopPriceStream(streamIdRef.current)
    }

    setStreamStatus('connecting')
    setError(null)
    
    try {
      const instruments = availablePairs.map(pair => pair.symbol)
      
      streamIdRef.current = await oandaAPI.startPriceStream(
        instruments,
        (priceData) => {
          // Handle incoming price data
          const bid = parseFloat(priceData.closeoutBid)
          const ask = parseFloat(priceData.closeoutAsk)
          const spread = ask - bid
          
          // Update price history
          updatePriceHistory(priceData.instrument, bid)
          
          // Calculate change
          const { change, changePercent } = calculateChange(priceData.instrument, bid)
          
          const pairInfo = availablePairs.find(p => p.symbol === priceData.instrument)
          
          const updatedPair: ForexPair = {
            symbol: priceData.instrument,
            name: pairInfo?.name || priceData.instrument,
            bid,
            ask,
            spread: Number(spread.toFixed(5)),
            change,
            changePercent,
            lastUpdate: new Date(priceData.time).toLocaleTimeString(),
            status: priceData.tradeable ? 'active' : 'inactive'
          }
          
          // Update the pairs state
          setForexPairs(prev => {
            const newPairs = [...prev]
            const existingIndex = newPairs.findIndex(p => p.symbol === priceData.instrument)
            
            if (existingIndex >= 0) {
              newPairs[existingIndex] = updatedPair
            } else {
              newPairs.push(updatedPair)
            }
            
            return newPairs
          })
          
          setLastUpdate(new Date().toLocaleTimeString())
          setStreamStatus('connected')
          
          // Update market data for AI analysis if this is the selected pair
          if (priceData.instrument === selectedPair && onMarketDataUpdate) {
            onMarketDataUpdate({
              pair: priceData.instrument,
              bid,
              ask,
              spread: Number(spread.toFixed(5)),
              change,
              changePercent,
              timestamp: priceData.time
            })
          }
        },
        (error) => {
          console.error('Streaming error:', error)
          setError(error.message)
          setStreamStatus('error')
          
          // Try to reconnect after a delay
          setTimeout(() => {
            if (reconnectCountRef.current < 3) {
              reconnectCountRef.current++
              startStreaming()
            }
          }, 5000)
        },
        () => {
          // On reconnect
          setStreamStatus('connected')
          setError(null)
          reconnectCountRef.current = 0
        }
      )
      
      setIsStreaming(true)
      
    } catch (err) {
      console.error('Failed to start streaming:', err)
      setError(err instanceof Error ? err.message : 'Failed to start streaming')
      setStreamStatus('error')
      
      // Fallback to mock data
      generateMockData()
    }
  }

  const stopStreaming = () => {
    if (streamIdRef.current) {
      oandaAPI.stopPriceStream(streamIdRef.current)
      streamIdRef.current = null
    }
    setIsStreaming(false)
    setStreamStatus('disconnected')
  }

  const generateMockData = () => {
    const mockPairs: ForexPair[] = availablePairs.map(pair => {
      const bid = pair.symbol === 'GBP_USD' ? 1.3521 : 
                  pair.symbol === 'EUR_USD' ? 1.0845 :
                  pair.symbol === 'USD_JPY' ? 149.85 :
                  pair.symbol === 'USD_CHF' ? 0.8756 :
                  pair.symbol === 'AUD_USD' ? 0.6789 :
                  pair.symbol === 'USD_CAD' ? 1.3456 :
                  pair.symbol === 'NZD_USD' ? 0.6234 :
                  pair.symbol === 'EUR_GBP' ? 0.8567 : 1.0000
      
      const ask = bid + 0.0002
      
      return {
        symbol: pair.symbol,
        name: pair.name,
        bid,
        ask,
        spread: 0.0002,
        change: (Math.random() - 0.5) * 0.01,
        changePercent: (Math.random() - 0.5) * 2,
        lastUpdate: new Date().toLocaleTimeString(),
        status: 'active' as const
      }
    })
    
    setForexPairs(mockPairs)
    setLastUpdate(new Date().toLocaleTimeString())
  }

  useEffect(() => {
    setMounted(true)
    setLastUpdate(new Date().toLocaleTimeString())
  }, [])

  useEffect(() => {
    if (mounted) {
      startStreaming()
    }
    
    return () => {
      stopStreaming()
    }
  }, [mounted])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamIdRef.current) {
        oandaAPI.stopPriceStream(streamIdRef.current)
      }
    }
  }, [])

  const selectedPairData = forexPairs.find(pair => pair.symbol === selectedPair)

  if (!mounted) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Live Forex Data
              {streamStatus === 'connected' ? (
                <Wifi className="h-4 w-4 text-green-600" />
              ) : streamStatus === 'connecting' ? (
                <RefreshCw className="h-4 w-4 animate-spin text-yellow-600" />
              ) : (
                <WifiOff className="h-4 w-4 text-red-600" />
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={
                streamStatus === 'connected' ? 'default' :
                streamStatus === 'connecting' ? 'secondary' : 'destructive'
              }>
                {streamStatus === 'connected' ? 'Streaming' :
                 streamStatus === 'connecting' ? 'Connecting' :
                 streamStatus === 'error' ? 'Error' : 'Disconnected'}
              </Badge>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={isStreaming ? stopStreaming : startStreaming}
              >
                {isStreaming ? 'Stop Stream' : 'Start Stream'}
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            Real-time streaming forex data • Last updated: {lastUpdate}
            {streamStatus === 'connected' && (
              <span className="text-green-600 ml-2">• Live streaming active</span>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <span className="text-sm text-red-700">
                {error}
              </span>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Currency Pair</label>
              <Select value={selectedPair} onValueChange={onPairChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availablePairs.map(pair => (
                    <SelectItem key={pair.symbol} value={pair.symbol}>
                      {pair.symbol.replace('_', '/')} - {pair.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Timeframe</label>
              <Select value={selectedTimeframe} onValueChange={onTimeframeChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeframes.map(tf => (
                    <SelectItem key={tf.value} value={tf.value}>
                      {tf.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Pair Details */}
      {selectedPairData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{selectedPairData.symbol.replace('_', '/')} - {selectedPairData.name}</span>
              <div className="flex items-center gap-2">
                <Badge variant={selectedPairData.status === 'active' ? 'default' : 'secondary'}>
                  {selectedPairData.status}
                </Badge>
                {streamStatus === 'connected' && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600">Live</span>
                  </div>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Bid Price</p>
                <p className="text-2xl font-bold text-red-600">
                  {selectedPairData.bid.toFixed(5)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Ask Price</p>
                <p className="text-2xl font-bold text-green-600">
                  {selectedPairData.ask.toFixed(5)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Spread</p>
                <p className="text-xl font-semibold">
                  {selectedPairData.spread.toFixed(5)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Change</p>
                <div className="flex items-center justify-center gap-1">
                  {selectedPairData.changePercent >= 0 ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <p className={`text-xl font-semibold ${
                    selectedPairData.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {selectedPairData.changePercent >= 0 ? '+' : ''}{selectedPairData.changePercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* All Pairs Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Market Overview</CardTitle>
          <CardDescription>
            All major currency pairs with live streaming prices
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {forexPairs.map(pair => (
              <div 
                key={pair.symbol}
                className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                  pair.symbol === selectedPair ? 'bg-primary/5 border-primary' : 'hover:bg-muted/50'
                }`}
                onClick={() => onPairChange(pair.symbol)}
              >
                <div className="flex items-center gap-3">
                  <div>
                    <p className="font-semibold">{pair.symbol.replace('_', '/')}</p>
                    <p className="text-sm text-muted-foreground">{pair.name}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold">{pair.bid.toFixed(5)}</p>
                    <p className="text-sm text-muted-foreground">Spread: {pair.spread.toFixed(5)}</p>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {pair.changePercent >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-600" />
                    )}
                    <span className={`text-sm font-medium ${
                      pair.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {pair.changePercent >= 0 ? '+' : ''}{pair.changePercent.toFixed(2)}%
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge variant={pair.status === 'active' ? 'default' : 'secondary'} className="text-xs">
                      {pair.status}
                    </Badge>
                    {streamStatus === 'connected' && (
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stream Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Stream Statistics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Stream Status</p>
              <p className="text-lg font-bold text-blue-600 capitalize">
                {streamStatus}
              </p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Active Pairs</p>
                            <p className="text-lg font-bold text-green-600">
                {forexPairs.length}
              </p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Last Update</p>
              <p className="text-lg font-bold text-purple-600">
                {lastUpdate}
              </p>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-sm text-muted-foreground">Reconnects</p>
              <p className="text-lg font-bold text-orange-600">
                {reconnectCountRef.current}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

