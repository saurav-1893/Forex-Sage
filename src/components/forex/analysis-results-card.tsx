import type { AnalyzeForexPairsOutput } from "@/types/forex-analysis-types"; // Assuming this type is correctly imported
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
  // Safe number formatting helper (kept in case it's used elsewhere or needed later,
  // but not used in the dangerouslySetInnerHTML below)
  const formatNumber = (value: number | undefined | null) => {
    return typeof value === 'number' ? value.toFixed(4) : '0.0000';
  };

  // Optional chaining and nullish coalescing for safe access
  const formattedPairSymbol = pairSymbol?.toLowerCase() ?? '';

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm">
      <div className="flex flex-col space-y-1.5 p-6">
        <h3 className="text-2xl font-semibold leading-none tracking-tight">
          {pairSymbol ? `${pairSymbol} Analysis` : 'Forex Pair Analysis'}
        </h3>
        <p className="text-sm text-muted-foreground">
          AI-powered trading insights and recommendations
        </p>
      </div>
      <div className="p-6 pt-0">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
            <p className="text-sm text-muted-foreground">Analyzing market data...</p>
          </div>
        ) : results ? (
          <div className="prose max-w-none dark:prose-invert">
            {/* Check if results.analysis exists before rendering */}
            {results.analysis ? (
              <div dangerouslySetInnerHTML={{ 
                __html: results.analysis
                  .replace(/\n/g, '<br />')
              }} />
            ) : null}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <p className="text-center text-muted-foreground">
              Select a forex pair and submit to get AI-powered analysis and trading recommendations.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
