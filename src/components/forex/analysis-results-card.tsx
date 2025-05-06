import type { AnalyzeForexPairsOutput } from "@/ai/flows/analyze-forex-pairs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Target, Clock, BrainCircuit, Info, ShieldAlert, Landmark } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

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
          <CardDescription>Fetching AI-powered trading suggestion and analysis...</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-8 w-1/2" /> {/* Suggestion Badge */}
          <Skeleton className="h-6 w-3/4" /> {/* Timeframe */}
          <Skeleton className="h-6 w-2/3" /> {/* Target Profit Pips */}
          <Skeleton className="h-6 w-2/3" /> {/* Stop Loss Level */}
          <Skeleton className="h-6 w-2/3" /> {/* Profit Target Level */}
          <Skeleton className="h-10 w-full" /> {/* Analysis Summary Accordion Trigger */}
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
        <CardTitle className="flex items-center gap-2">
          <BrainCircuit className="h-6 w-6 text-primary" /> AI Analysis: {pairSymbol.toUpperCase()}
        </CardTitle>
        <CardDescription>AI-powered trading suggestion based on real-time and historical data.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-lg">Suggestion:</span>
          <Badge variant={isBuy ? "default" : "destructive"} className={`text-lg px-3 py-1 ${isBuy ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white`}>
            {isBuy ? <TrendingUp className="h-5 w-5 mr-1" /> : <TrendingDown className="h-5 w-5 mr-1" />}
            {results.suggestion}
          </Badge>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">Timeframe:</span>
            <span>{results.timeframe}</span>
          </div>
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium">Target Profit:</span>
            <span>{results.targetProfitPips} pips</span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-muted-foreground text-red-500" />
            <span className="font-medium">Stop Loss:</span>
            <span>{results.stopLossLevel.toFixed(5)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Landmark className="h-5 w-5 text-muted-foreground text-green-500" />
            <span className="font-medium">Profit Target:</span>
            <span>{results.profitTargetLevel.toFixed(5)}</span>
          </div>
        </div>
        
        <Accordion type="single" collapsible className="w-full pt-2">
          <AccordionItem value="item-1">
            <AccordionTrigger>
              <div className="flex items-center gap-2">
                <Info className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">Analysis Summary & Rationale</span>
              </div>
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {results.analysisSummary || "No summary provided."}
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>

      </CardContent>
    </Card>
  );
}

