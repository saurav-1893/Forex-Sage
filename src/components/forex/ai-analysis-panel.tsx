'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Brain, TrendingUp, TrendingDown, AlertTriangle, RefreshCw, Settings } from 'lucide-react'
import { aiService } from '@/lib/ai-service'

interface AIAnalysisPanelProps {
  selectedPair: string
  selectedTimeframe: string
  marketData?: any
}

interface AIAnalysis {
  recommendation: 'BUY' | 'SELL' | 'HOLD'
  confidence: number
  reasoning: string
  technicalLevels: {
    support: number
    resistance: number
  }
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH'
  entryPrice: number
  stopLoss: number
  takeProfit: number
  timestamp: Date
  provider: string
  model: string
}

export function AIAnalysisPanel({ selectedPair, selectedTimeframe, marketData }: AIAnalysisPanelProps) {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedProvider, setSelectedProvider] = useState('openrouter-1')
  const [selectedModel, setSelectedModel] = useState('anthropic/claude-3-haiku')
  const [analysisType, setAnalysisType] = useState<'technical' | 'fundamental' | 'sentiment'>('technical')

  const providers = aiService.getProviders()
  const currentProvider = providers.find(p => p.id === selectedProvider)

  const performAnalysis = async () => {
    if (!marketData) {
      setError('No market data available for analysis')
      return
    }

    setIsAnalyzing(true)
    setError(null)

    try {
      // Set the selected provider and model
      aiService.setProvider(selectedProvider, selectedModel)
      
      const response = await aiService.analyzeForex(
        selectedPair,
        selectedTimeframe,
        marketData,
        analysisType
      )

      // Try to parse JSON response
      let analysisData: any
      try {
        analysisData = JSON.parse(response.content)
      } catch {
        // If not JSON, create a structured response from text
        analysisData = {
          recommendation: response.content.includes('BUY') ? 'BUY' : 
                        response.content.includes('SELL') ? 'SELL' : 'HOLD',
          confidence: 7,
          reasoning: response.content,
          technicalLevels: {
            support: marketData.bid - 0.01,
            resistance: marketData.ask + 0.01
          },
          riskLevel: 'MEDIUM',
          entryPrice: marketData.bid,
          stopLoss: marketData.bid - 0.005,
          takeProfit: marketData.bid + 0.01
        }
      }

      setAnalysis({
        ...analysisData,
        timestamp: new Date(),
        provider: response.provider,
        model: response.model
      })
    } catch (err) {
      console.error('AI Analysis failed:', err)
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  useEffect(() => {
    if (marketData) {
      performAnalysis()
    }
  }, [selectedPair, selectedTimeframe, marketData])

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'BUY': return 'text-green-600'
      case 'SELL': return 'text-red-600'
      case 'HOLD': return 'text-yellow-600'
      default: return 'text-gray-600'
    }
  }

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'BUY': return <TrendingUp className="h-5 w-5" />
      case 'SELL': return <TrendingDown className="h-5 w-5" />
      case 'HOLD': return <AlertTriangle className="h-5 w-5" />
      default: return <Brain className="h-5 w-5" />
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'LOW': return 'bg-green-100 text-green-800'
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800'
      case 'HIGH': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="space-y-6">
      {/* AI Provider Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            AI Configuration
          </CardTitle>
          <CardDescription>
            Configure AI provider and analysis settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">AI Provider</label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {providers.map(provider => (
                    <SelectItem key={provider.id} value={provider.id}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Model</label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {currentProvider?.models.map(model => (
                    <SelectItem key={model} value={model}>
                      {model.split('/').pop()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Analysis Type</label>
              <Select value={analysisType} onValueChange={(value: 'technical' | 'fundamental' | 'sentiment') => setAnalysisType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="technical">Technical Analysis</SelectItem>
                  <SelectItem value="fundamental">Fundamental Analysis</SelectItem>
                  <SelectItem value="sentiment">Sentiment Analysis</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="mt-4 flex justify-between items-center">
            <div className="text-sm text-muted-foreground">
              Current: {currentProvider?.name} • {selectedModel.split('/').pop()}
            </div>
            <Button onClick={performAnalysis} disabled={isAnalyzing}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isAnalyzing ? 'animate-spin' : ''}`} />
              {isAnalyzing ? 'Analyzing...' : 'Refresh Analysis'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Analysis - {selectedPair.replace('_', '/')}
          </CardTitle>
          <CardDescription>
            AI-powered trading recommendation for {selectedTimeframe} timeframe
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {isAnalyzing ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center space-y-4">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="text-muted-foreground">Analyzing market conditions...</p>
              </div>
            </div>
          ) : analysis ? (
            <div className="space-y-6">
              {/* Main Recommendation */}
              <div className="text-center p-6 bg-muted/50 rounded-lg">
                <div className={`flex items-center justify-center gap-2 mb-2 ${getRecommendationColor(analysis.recommendation)}`}>
                  {getRecommendationIcon(analysis.recommendation)}
                  <h3 className="text-2xl font-bold">{analysis.recommendation}</h3>
                </div>
                <div className="flex items-center justify-center gap-4">
                  <Badge variant="outline">
                    Confidence: {analysis.confidence}/10
                  </Badge>
                  <Badge className={getRiskColor(analysis.riskLevel)}>
                    {analysis.riskLevel} Risk
                  </Badge>
                </div>
              </div>

              {/* Technical Levels */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Entry Price</p>
                  <p className="text-lg font-semibold text-green-600">
                    {analysis.entryPrice.toFixed(5)}
                  </p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Stop Loss</p>
                  <p className="text-lg font-semibold text-red-600">
                    {analysis.stopLoss.toFixed(5)}
                  </p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Take Profit</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {analysis.takeProfit.toFixed(5)}
                  </p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Risk/Reward</p>
                  <p className="text-lg font-semibold text-purple-600">
                    1:{((analysis.takeProfit - analysis.entryPrice) / Math.abs(analysis.entryPrice - analysis.stopLoss)).toFixed(1)}
                  </p>
                </div>
              </div>

              {/* Support & Resistance */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-green-600 mb-2">Support Level</h4>
                  <p className="text-2xl font-bold">{analysis.technicalLevels.support.toFixed(5)}</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-red-600 mb-2">Resistance Level</h4>
                  <p className="text-2xl font-bold">{analysis.technicalLevels.resistance.toFixed(5)}</p>
                </div>
              </div>

              <Separator />

              {/* Analysis Reasoning */}
              <div>
                <h4 className="font-semibold mb-3">Analysis Reasoning</h4>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {analysis.reasoning}
                  </p>
                </div>
              </div>

              {/* Analysis Metadata */}
              <div className="flex justify-between items-center text-sm text-muted-foreground pt-4 border-t">
                <div>
                  Generated by {analysis.provider} • {analysis.model}
                </div>
                <div>
                  {analysis.timestamp.toLocaleString()}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
              <p className="text-lg font-medium">No analysis available</p>
              <p className="text-muted-foreground">Click "Refresh Analysis" to get AI recommendations</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}