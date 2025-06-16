'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { BarChart3, TrendingUp, RefreshCw, Candlestick } from 'lucide-react'

interface ChartPanelProps {
  selectedPair: string
  selectedTimeframe: string
}

interface ChartDataPoint {
  timestamp: string
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export function ChartPanel({ selectedPair, selectedTimeframe }: ChartPanelProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])
  const [chartType, setChartType] = useState<'line' | 'candlestick'>('line')
  const [isLoading, setIsLoading] = useState(false)
  const [indicators, setIndicators] = useState<string[]>(['SMA20'])

  const generateMockData = () => {
    const data: ChartDataPoint[] = []
    const basePrice = 1.0845
    let currentPrice = basePrice

    for (let i = 0; i < 50; i++) {
      const change = (Math.random() - 0.5) * 0.01
      currentPrice += change
      
      const open = currentPrice
      const close = open + (Math.random() - 0.5) * 0.005
      const high = Math.max(open, close) + Math.random() * 0.003
      const low = Math.min(open, close) - Math.random() * 0.003
      
      data.push({
        timestamp: new Date(Date.now() - (49 - i) * 60 * 60 * 1000).toISOString().slice(11, 16),
        open: Number(open.toFixed(5)),
        high: Number(high.toFixed(5)),
        low: Number(low.toFixed(5)),
        close: Number(close.toFixed(5)),
        volume: Math.floor(Math.random() * 2000) + 500
      })
      
      currentPrice = close
    }
    
    return data
  }

  const fetchChartData = async () => {
    setIsLoading(true)
    try {
      // Simulate API call - replace with actual OANDA API
      await new Promise(resolve => setTimeout(resolve, 1000))
      const mockData = generateMockData()
      setChartData(mockData)
    } catch (error) {
      console.error('Failed to fetch chart data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchChartData()
  }, [selectedPair, selectedTimeframe])

  const addSMAData = (data: ChartDataPoint[], period: number) => {
    return data.map((point, index) => {
      if (index < period - 1) {
        return { ...point, [`sma${period}`]: null }
      }
      
      const sum = data.slice(index - period + 1, index + 1)
        .reduce((acc, p) => acc + p.close, 0)
      
      return { 
        ...point, 
        [`sma${period}`]: Number((sum / period).toFixed(5))
      }
    })
  }

  const chartDataWithIndicators = chartData.length > 0 
    ? addSMAData(chartData, 20)
    : []

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{`Time: ${label}`}</p>
          <p className="text-sm">
            <span className="text-green-600">Open: {data.open}</span>
          </p>
          <p className="text-sm">
            <span className="text-blue-600">High: {data.high}</span>
          </p>
          <p className="text-sm">
            <span className="text-red-600">Low: {data.low}</span>
          </p>
          <p className="text-sm">
            <span className="text-purple-600">Close: {data.close}</span>
          </p>
          {data.sma20 && (
            <p className="text-sm">
              <span className="text-orange-600">SMA20: {data.sma20}</span>
            </p>
          )}
          <p className="text-sm text-muted-foreground">
            Volume: {data.volume?.toLocaleString()}
          </p>
        </div>
      )
    }
    return null
  }

  const CandlestickChart = ({ data }: { data: ChartDataPoint[] }) => (
    <div className="space-y-4">
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
          <XAxis 
            dataKey="timestamp" 
            tick={{ fontSize: 12 }}
            interval="preserveStartEnd"
          />
          <YAxis 
            domain={['dataMin - 0.001', 'dataMax + 0.001']}
            tick={{ fontSize: 12 }}
            tickFormatter={(value) => value.toFixed(4)}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Candlestick representation using multiple lines */}
          <Line 
            type="monotone" 
            dataKey="high" 
            stroke="#22c55e" 
            strokeWidth={1}
            dot={false}
            name="High"
          />
          <Line 
            type="monotone" 
            dataKey="low" 
            stroke="#ef4444" 
            strokeWidth={1}
            dot={false}
            name="Low"
          />
          <Line 
            type="monotone" 
            dataKey="close" 
            stroke="#3b82f6" 
            strokeWidth={2}
            dot={false}
            name="Close"
          />
          
          {indicators.includes('SMA20') && (
            <Line 
              type="monotone" 
              dataKey="sma20" 
              stroke="#f97316" 
              strokeWidth={2}
              dot={false}
              name="SMA 20"
              connectNulls={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Chart Controls */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Price Chart - {selectedPair}
              </CardTitle>
              <CardDescription>
                Historical price data with technical indicators • {selectedTimeframe}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Select value={chartType} onValueChange={(value: 'line' | 'candlestick') => setChartType(value)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="line">Line Chart</SelectItem>
                  <SelectItem value="candlestick">Candlestick</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={fetchChartData} disabled={isLoading}>
                <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="secondary">Last 50 periods</Badge>
            <Badge variant="outline">Real-time data</Badge>
            {indicators.map(indicator => (
              <Badge key={indicator} variant="default">{indicator}</Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Main Chart */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center h-[400px]">
              <div className="text-center space-y-4">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">Loading chart data...</p>
              </div>
            </div>
          ) : chartData.length > 0 ? (
            <CandlestickChart data={chartDataWithIndicators} />
          ) : (
            <div className="flex items-center justify-center h-[400px]">
              <div className="text-center space-y-4">
                <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground opacity-50" />
                <div>
                  <p className="text-lg font-medium">No chart data available</p>
                  <p className="text-muted-foreground">Try refreshing or selecting a different pair</p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Technical Indicators Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Indicators</CardTitle>
          <CardDescription>
            Add technical indicators to enhance your analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button 
              variant={indicators.includes('SMA20') ? 'default' : 'outline'}
              onClick={() => {
                setIndicators(prev => 
                  prev.includes('SMA20') 
                    ? prev.filter(i => i !== 'SMA20')
                    : [...prev, 'SMA20']
                )
              }}
            >
              SMA 20
            </Button>
            <Button variant="outline" disabled>
              SMA 50
            </Button>
            <Button variant="outline" disabled>
              RSI
            </Button>
            <Button variant="outline" disabled>
              MACD
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            More indicators coming soon...
          </p>
        </CardContent>
      </Card>
    </div>
  )
}