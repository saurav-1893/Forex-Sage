"use client";

import { useState } from "react";
import type { ForexData, ForexPair } from "@/services/forex-data";
import { getForexData } from "@/services/forex-data";
import type { AnalyzeForexPairsInput, AnalyzeForexPairsOutput } from "@/ai/flows/analyze-forex-pairs";
import { analyzeForexPairs } from "@/ai/flows/analyze-forex-pairs";
import { useToast } from "@/hooks/use-toast";

import { ForexPairForm } from "./forex-pair-form";
import { ForexDataCard } from "./forex-data-card";
import { AnalysisResultsCard } from "./analysis-results-card";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";

export function ForexDashboard() {
  const [selectedPairSymbol, setSelectedPairSymbol] = useState<string | null>(null);
  const [forexData, setForexData] = useState<ForexData | null>(null);
  const [analysisResults, setAnalysisResults] = useState<AnalyzeForexPairsOutput | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const { toast } = useToast();

  const handleFormSubmit = async ({ symbol }: { symbol: string }) => {
    setIsLoadingData(true);
    setIsLoadingAnalysis(true);
    setSelectedPairSymbol(symbol);
    setForexData(null); // Clear previous data
    setAnalysisResults(null); // Clear previous analysis

    try {
      const pair: ForexPair = { symbol };
      const data = await getForexData(pair);
      setForexData(data);
      toast({ title: "Real-time Data Fetched", description: `Data for ${symbol} loaded successfully.` });
    } catch (error) {
      console.error("Error fetching Forex data:", error);
      toast({
        variant: "destructive",
        title: "Error Fetching Data",
        description: "Could not load real-time data. Please try again.",
      });
    } finally {
      setIsLoadingData(false);
    }

    try {
      const analysisInput: AnalyzeForexPairsInput = { symbol };
      const results = await analyzeForexPairs(analysisInput);
      setAnalysisResults(results);
      toast({ title: "AI Analysis Complete", description: `Analysis for ${symbol} generated.` });
    } catch (error) {
      console.error("Error performing AI analysis:", error);
      toast({
        variant: "destructive",
        title: "AI Analysis Failed",
        description: "Could not generate AI analysis. Please try again.",
      });
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <h2 className="text-2xl font-semibold text-primary mb-4">Select Forex Pair</h2>
          <ForexPairForm onSubmit={handleFormSubmit} isLoading={isLoadingData || isLoadingAnalysis} />
          <div className="mt-6 p-4 border border-dashed rounded-lg bg-secondary/50">
             <h3 className="text-lg font-medium text-foreground mb-2">Market Overview</h3>
             <Image 
                src="https://picsum.photos/400/200" 
                alt="Forex Market Chart" 
                width={400} 
                height={200} 
                className="rounded-md shadow-md object-cover w-full"
                data-ai-hint="financial chart" 
              />
             <p className="text-sm text-muted-foreground mt-2">
                Placeholder for a general market overview chart or news feed. 
                For a real application, this could be an embeddable widget or a dynamic chart.
             </p>
          </div>
        </div>

        <div className="md:col-span-2 space-y-8">
          <ForexDataCard data={forexData} pairSymbol={selectedPairSymbol} isLoading={isLoadingData} />
          <Separator />
          <AnalysisResultsCard results={analysisResults} pairSymbol={selectedPairSymbol} isLoading={isLoadingAnalysis} />
        </div>
      </div>
    </div>
  );
}
