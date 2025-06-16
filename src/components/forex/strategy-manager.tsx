"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, Trash2, Target, TrendingUp, Brain } from 'lucide-react';

interface TradingStrategy {
  id: string;
  name: string;
  description: string;
  entryRules: string;
  exitRules: string;
  stopLoss: string;
  takeProfit: string;
  indicators: string[];
  riskLevel: 'Low' | 'Medium' | 'High';
  timeframe: string;
  createdAt: Date;
}

export function StrategyManager() {
  const [strategies, setStrategies] = useState<TradingStrategy[]>([
    {
      id: '1',
      name: 'RSI Reversal Strategy',
      description: 'Buy when RSI is oversold (<30) and sell when overbought (>70)',
      entryRules: 'RSI < 30 for buy signals, RSI > 70 for sell signals',
      exitRules: 'Exit when RSI returns to 50 level or hits stop loss/take profit',
      stopLoss: '50 pips',
      takeProfit: '100 pips',
      indicators: ['RSI', 'SMA 20'],
      riskLevel: 'Medium',
      timeframe: '1H',
      createdAt: new Date()
    }
  ]);
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newStrategy, setNewStrategy] = useState<Partial<TradingStrategy>>({
    name: '',
    description: '',
    entryRules: '',
    exitRules: '',
    stopLoss: '',
    takeProfit: '',
    indicators: [],
    riskLevel: 'Medium',
    timeframe: '1H'
  });

  const handleCreateStrategy = () => {
    if (!newStrategy.name || !newStrategy.description) return;

    const strategy: TradingStrategy = {
      id: Date.now().toString(),
      name: newStrategy.name,
      description: newStrategy.description,
      entryRules: newStrategy.entryRules || '',
      exitRules: newStrategy.exitRules || '',
      stopLoss: newStrategy.stopLoss || '',
      takeProfit: newStrategy.takeProfit || '',
      indicators: newStrategy.indicators || [],
      riskLevel: newStrategy.riskLevel || 'Medium',
      timeframe: newStrategy.timeframe || '1H',
      createdAt: new Date()
    };

    setStrategies(prev => [...prev, strategy]);
    setNewStrategy({
      name: '',
      description: '',
      entryRules: '',
      exitRules: '',
      stopLoss: '',
      takeProfit: '',
      indicators: [],
      riskLevel: 'Medium',
      timeframe: '1H'
    });
    setIsCreateDialogOpen(false);
  };

  const handleDeleteStrategy = (id: string) => {
    setStrategies(prev => prev.filter(s => s.id !== id));
  };

  const generateAIStrategy = async () => {
    // This would integrate with your AI service
    const aiGeneratedStrategy = {
      name: 'AI Generated Moving Average Strategy',
      description: 'AI-generated strategy based on moving average crossovers and momentum indicators',
      entryRules: 'Enter long when 20 SMA crosses above 50 SMA and RSI > 50. Enter short when 20 SMA crosses below 50 SMA and RSI < 50.',
      exitRules: 'Exit when opposite crossover occurs or when RSI reaches extreme levels (>80 or <20)',
      stopLoss: '30 pips',
      takeProfit: '90 pips',
      indicators: ['SMA 20', 'SMA 50', 'RSI'],
      riskLevel: 'Medium' as const,
      timeframe: '4H'
    };
    
    setNewStrategy(aiGeneratedStrategy);
    setIsCreateDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Trading Strategies</h2>
          <p className="text-muted-foreground">Create and manage your custom trading strategies</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateAIStrategy}>
            <Brain className="h-4 w-4 mr-2" />
            AI Generate
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Strategy
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Trading Strategy</DialogTitle>
                <DialogDescription>
                  Define your trading strategy with entry/exit rules and risk management parameters.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Strategy Name</Label>
                    <Input
                      id="name"
                      value={newStrategy.name}
                      onChange={(e) => setNewStrategy(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g., RSI Reversal Strategy"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="timeframe">Timeframe</Label>
                    <Select value={newStrategy.timeframe} onValueChange={(value) => setNewStrategy(prev => ({ ...prev, timeframe: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="M15">15 Minutes</SelectItem>
                        <SelectItem value="1H">1 Hour</SelectItem>
                        <SelectItem value="4H">4 Hours</SelectItem>
                        <SelectItem value="1D">1 Day</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newStrategy.description}
                    onChange={(e) => setNewStrategy(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of your strategy..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="entryRules">Entry Rules</Label>
                  <Textarea
                    id="entryRules"
                    value={newStrategy.entryRules}
                    onChange={(e) => setNewStrategy(prev => ({ ...prev, entryRules: e.target.value }))}
                    placeholder="Define when to enter trades..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="exitRules">Exit Rules</Label>
                  <Textarea
                    id="exitRules"
                    value={newStrategy.exitRules}
                    onChange={(e) => setNewStrategy(prev => ({ ...prev, exitRules: e.target.value }))}
                    placeholder="Define when to exit trades..."
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="stopLoss">Stop Loss</Label>
                    <Input
                      id="stopLoss"
                      value={newStrategy.stopLoss}
                      onChange={(e) => setNewStrategy(prev => ({ ...prev, stopLoss: e.target.value }))}
                      placeholder="e.g., 50 pips"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="takeProfit">Take Profit</Label>
                    <Input
                      id="takeProfit"
                      value={newStrategy.takeProfit}
                      onChange={(e) => setNewStrategy(prev => ({ ...prev, takeProfit: e.target.value }))}
                      placeholder="e.g., 100 pips"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="riskLevel">Risk Level</Label>
                    <Select value={newStrategy.riskLevel} onValueChange={(value: 'Low' | 'Medium' | 'High') => setNewStrategy(prev => ({ ...prev, riskLevel: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateStrategy}>
                    Create Strategy
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Strategies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {strategies.map((strategy) => (
          <Card key={strategy.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{strategy.name}</CardTitle>
                  <CardDescription>{strategy.description}</CardDescription>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm">
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteStrategy(strategy.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge variant={strategy.riskLevel === 'High' ? 'destructive' : strategy.riskLevel === 'Medium' ? 'default' : 'secondary'}>
                  {strategy.riskLevel} Risk
                </Badge>
                <Badge variant="outline">{strategy.timeframe}</Badge>
              </div>
              
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Entry:</span>
                  <p className="text-muted-foreground mt-1">{strategy.entryRules}</p>
                </div>
                <div>
                  <span className="font-medium">Exit:</span>
                  <p className="text-muted-foreground mt-1">{strategy.exitRules}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-red-600">Stop Loss:</span>
                  <p>{strategy.stopLoss}</p>
                </div>
                <div>
                  <span className="font-medium text-green-600">Take Profit:</span>
                  <p>{strategy.takeProfit}</p>
                </div>
              </div>
              
              {strategy.indicators.length > 0 && (
                <div>
                  <span className="font-medium text-sm">Indicators:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {strategy.indicators.map((indicator, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {indicator}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {strategies.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No strategies yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first trading strategy or let AI generate one for you.
            </p>
            <div className="flex justify-center gap-2">
              <Button variant="outline" onClick={generateAIStrategy}>
                <Brain className="h-4 w-4 mr-2" />
                AI Generate
              </Button>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Strategy
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
