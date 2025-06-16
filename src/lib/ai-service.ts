interface AIProvider {
  id: string
  name: string
  apiKey: string
  baseUrl: string
  models: string[]
}

interface AIResponse {
  content: string
  model: string
  provider: string
}

class AIService {
  private providers: AIProvider[] = [
    {
      id: 'openrouter-1',
      name: 'OpenRouter Primary',
      apiKey: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY || '',
      baseUrl: 'https://openrouter.ai/api/v1',
      models: [
        'anthropic/claude-3-haiku',
        'openai/gpt-4-turbo-preview',
        'google/gemini-pro',
        'meta-llama/llama-2-70b-chat'
      ]
    },
    {
      id: 'openrouter-2',
      name: 'OpenRouter Secondary',
      apiKey: process.env.OPENROUTER_API_KEY || '',
      baseUrl: 'https://openrouter.ai/api/v1',
      models: [
        'anthropic/claude-3-haiku',
        'openai/gpt-4-turbo-preview',
        'google/gemini-pro',
        'meta-llama/llama-2-70b-chat'
      ]
    },
    {
      id: 'google',
      name: 'Google Gemini',
      apiKey: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || '',
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      models: ['gemini-pro']
    }
  ]

  private currentProvider: string = 'openrouter-1'
  private currentModel: string = 'anthropic/claude-3-haiku'

  getProviders(): AIProvider[] {
    return this.providers.filter(p => p.apiKey) // Only return providers with API keys
  }

  getCurrentProvider(): AIProvider | undefined {
    return this.providers.find(p => p.id === this.currentProvider)
  }

  setProvider(providerId: string, model?: string): void {
    const provider = this.providers.find(p => p.id === providerId)
    if (provider) {
      this.currentProvider = providerId
      if (model && provider.models.includes(model)) {
        this.currentModel = model
      } else {
        this.currentModel = provider.models[0]
      }
    }
  }

  async analyzeForex(
    pair: string,
    timeframe: string,
    marketData: any,
    analysisType: 'technical' | 'fundamental' | 'sentiment' = 'technical'
  ): Promise<AIResponse> {
    const provider = this.getCurrentProvider()
    if (!provider) {
      throw new Error('No AI provider configured')
    }

    const prompt = this.buildForexAnalysisPrompt(pair, timeframe, marketData, analysisType)

    try {
      if (provider.id.startsWith('openrouter')) {
        return await this.callOpenRouter(provider, prompt)
      } else if (provider.id === 'google') {
        return await this.callGoogleAI(provider, prompt)
      } else {
        throw new Error(`Unsupported provider: ${provider.id}`)
      }
    } catch (error) {
      console.error(`AI Analysis failed with ${provider.name}:`, error)
      
      // Try fallback provider
      const fallbackProvider = this.providers.find(p => p.id !== this.currentProvider && p.apiKey)
      if (fallbackProvider) {
        console.log(`Trying fallback provider: ${fallbackProvider.name}`)
        const originalProvider = this.currentProvider
        this.setProvider(fallbackProvider.id)
        
        try {
          const result = await this.analyzeForex(pair, timeframe, marketData, analysisType)
          this.setProvider(originalProvider) // Restore original provider
          return result
        } catch (fallbackError) {
          this.setProvider(originalProvider) // Restore original provider
          throw fallbackError
        }
      }
      
      throw error
    }
  }

  private buildForexAnalysisPrompt(
    pair: string,
    timeframe: string,
    marketData: any,
    analysisType: string
  ): string {
    return `
Analyze the ${pair} forex pair for ${timeframe} timeframe.

Market Data:
- Current Bid: ${marketData.bid}
- Current Ask: ${marketData.ask}
- Spread: ${marketData.spread}
- Recent Change: ${marketData.changePercent}%

Analysis Type: ${analysisType}

Please provide:
1. Market Direction Prediction (BUY/SELL/HOLD)
2. Confidence Level (1-10)
3. Key Technical Levels
4. Risk Assessment
5. Entry/Exit Strategy

Format your response as JSON:
{
  "recommendation": "BUY|SELL|HOLD",
  "confidence": 1-10,
  "reasoning": "detailed explanation",
  "technicalLevels": {
    "support": number,
    "resistance": number
  },
  "riskLevel": "LOW|MEDIUM|HIGH",
  "entryPrice": number,
  "stopLoss": number,
  "takeProfit": number
}
`
  }

  private async callOpenRouter(provider: AIProvider, prompt: string): Promise<AIResponse> {
    const response = await fetch(`${provider.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${provider.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
        'X-Title': 'ForexSage'
      },
      body: JSON.stringify({
        model: this.currentModel,
        messages: [
          {
            role: 'system',
            content: 'You are a professional forex trading analyst with expertise in technical analysis, market sentiment, and risk management.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenRouter API error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    return {
      content: data.choices[0].message.content,
      model: this.currentModel,
      provider: provider.name
    }
  }

  private async callGoogleAI(provider: AIProvider, prompt: string): Promise<AIResponse> {
    const response = await fetch(`${provider.baseUrl}/models/gemini-pro:generateContent?key=${provider.apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Google AI error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    return {
      content: data.candidates[0].content.parts[0].text,
      model: 'gemini-pro',
      provider: provider.name
    }
  }
}

export const aiService = new AIService()