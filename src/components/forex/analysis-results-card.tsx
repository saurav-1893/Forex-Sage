import type { AnalyzeForexPairsOutput } from "@/ai/flows/analyze-forex-pairs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Target, Clock, BrainCircuit } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface AnalysisResultsCardProps {
  results: AnalyzeForexPairsOutput | null;
  pairSymbol: string | null;
  isLoading: boolean;
}

export function AnalysisResultsCard({ results, pairSymbol, isLoading }: AnalysisResultsCardProps) {
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
             <BrainCircuit className="h-6 w-6 text-primary" /> AI Analysis: <Skeleton className="h-6 w-24" />
          </CardTitle>
          <CardDescription>Fetching AI-powered trading suggestion...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-6 w-2/3" />
        </CardContent>
      </Card>
    );
  }
  
  if (!results || !pairSymbol) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BrainCircuit className="h-6 w-6 text-primary" /> AI Analysis
          </CardTitle>
          <CardDescription>AI-powered trading suggestions will appear here.</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No analysis performed yet. Select a pair and click "Analyze".</p>
        </CardContent>
      </Card>
    );
  }

  const isBuy = results.suggestion.toLowerCase().includes("buy");

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-primary">
          <BrainCircuit className="h-6 w-6 text-primary" /> AI Analysis: {pairSymbol.toUpperCase()}
        </CardTitle>
        <CardDescription>AI-powered trading suggestion based on backtesting and market data.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-lg">Suggestion:</span>
          <Badge variant={isBuy ? "default" : "destructive"} className={`text-lg px-3 py-1 ${isBuy ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white`}>
            {isBuy ? <TrendingUp className="h-5 w-5 mr-1" /> : <TrendingDown className="h-5 w-5 mr-1" />}
            {results.suggestion}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">Timeframe:</span>
          <span>{results.timeframe}</span>
        </div>
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-muted-foreground" />
          <span className="font-medium">Target Profit:</span>
          <span>{results.targetProfit} pips</span>
        </div>
      </CardContent>
    </Card>
  );
}
