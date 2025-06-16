"use client";

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { LiveDataPanel } from './live-data-panel'
import { AIAnalysisPanel } from './ai-analysis-panel'
import { TradingChart } from './trading-chart'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Activity, BarChart3, Brain, TrendingUp } from 'lucide-react'

export function ForexDashboard() {
  const [selectedPair, setSelectedPair] = useState('EUR_USD')
  const [selectedTimeframe, setSelectedTimeframe] = useState('H1')
  const [marketData, setMarketData] = useState<any>(null)
  const [isStreaming, setIsStreaming] = useState(false)

  // Handle pair change and update market data for AI analysis
  const handlePairChange = (pair: string) => {
    setSelectedPair(pair)
    // This will be updated by the LiveDataPanel when it fetches new data
  }

  const handleTimeframeChange = (timeframe: string) => {
    setSelectedTimeframe(timeframe)
  }

  // This function will be called by LiveDataPanel to update market data
  const handleMarketDataUpdate = (data: any) => {
    setMarketData(data)
    setIsStreaming(true)
  }

  useEffect(() => {
    // Set streaming status based on market data updates
    if (marketData) {
      setIsStreaming(true)
      const timeout = setTimeout(() => {
        setIsStreaming(false)
      }, 5000) // Consider offline if no updates for 5 seconds
      
      return () => clearTimeout(timeout)
    }
  }, [marketData])

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Forex Trading Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time streaming forex data with AI-powered analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isStreaming ? 'default' : 'secondary'}>
            {isStreaming ? 'Live Streaming' : 'Offline'}
          </Badge>
          {isStreaming && (
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600">Active</span>
            </div>
          )}
        </div>
      </div>

      {/* Current Market Summary */}
      {marketData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Current Market - {marketData.pair?.replace('_', '/')}
            </CardTitle>
            <CardDescription>
              Live streaming data • Last update: {new Date(marketData.timestamp).toLocaleTimeString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Bid</p>
                <p className="text-xl font-bold text-red-600">
                  {marketData.bid?.toFixed(5)}
                </p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Ask</p>
                <p className="text-xl font-bold text-green-600">
                  {marketData.ask?.toFixed(5)}
                </p>
              </div>
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Spread</p>
                <p className="text-xl font-bold text-blue-600">
                  {marketData.spread?.toFixed(5)}
                </p>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <p className="text-sm text-muted-foreground">Change</p>
                <p className={`text-xl font-bold ${
                  marketData.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {marketData.changePercent >= 0 ? '+' : ''}{marketData.changePercent?.toFixed(2)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="live-data" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="live-data" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Live Data
          </TabsTrigger>
          <TabsTrigger value="charts" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Charts
          </TabsTrigger>
          <TabsTrigger value="ai-analysis" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="live-data" className="space-y-6">
          <LiveDataPanel 
            selectedPair={selectedPair}
            onPairChange={setSelectedPair}
            selectedTimeframe={selectedTimeframe}
            onTimeframeChange={setSelectedTimeframe}
            onMarketDataUpdate={handleMarketDataUpdate}
          />
        </TabsContent>

        <TabsContent value="charts" className="space-y-6">
          <TradingChart 
            selectedPair={selectedPair}
            selectedTimeframe={selectedTimeframe}
          />
        </TabsContent>

        <TabsContent value="ai-analysis" className="space-y-6">
          <AIAnalysisPanel 
            selectedPair={selectedPair}
            selectedTimeframe={selectedTimeframe}
            marketData={marketData}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
