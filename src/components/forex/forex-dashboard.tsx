"use client";

import { useState, useEffect } from "react";
import type { ForexData, ForexPair } from "@/services/forex-data";
import { getForexData } from "@/services/forex-data";
import type { AnalyzeForexPairsInput, AnalyzeForexPairsOutput } from "@/ai/flows/analyze-forex-pairs";
import { analyzeForexPairs } from "@/ai/flows/analyze-forex-pairs";
import { useToast } from "@/hooks/use-toast";
import { useStrategyManager } from "@/hooks/use-strategy-manager";

import { ForexPairForm } from "./forex-pair-form";
import { ForexDataCard } from "./forex-data-card";
import { AnalysisResultsCard } from "./analysis-results-card";
import { StrategyManager } from "./strategy-manager";
import { Separator } from "@/components/ui/separator";
import Image from "next/image";
// import { HistoricalDataChart } from "./historical-data-chart";
// import type { HistoricalForexDataPoint } from "@/services/forex-data"; 

export function ForexDashboard() {
  const [selectedPairSymbol, setSelectedPairSymbol] = useState<string | null>(null);
  const [forexData, setForexData] = useState<ForexData | null>(null);
  // const [historicalData, setHistoricalData] = useState<HistoricalForexDataPoint[] | null>(null);
  const [analysisResults, setAnalysisResults] = useState<AnalyzeForexPairsOutput | null>(null);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const { toast } = useToast();
  const { 
    selectedStrategyId, 
    setSelectedStrategyId, 
    getStrategyById,
    isStrategyManagerInitialized 
  } = useStrategyManager();

  const handleFormSubmit = async ({ symbol }: { symbol: string }) => {
    if (!selectedStrategyId && isStrategyManagerInitialized) {
      toast({
        variant: "destructive",
        title: "No Strategy Selected",
        description: "Please select or create a trading strategy before analyzing.",
      });
      return;
    }

    setIsLoadingData(true);
    setIsLoadingAnalysis(true);
    setSelectedPairSymbol(symbol);
    setForexData(null);
    // setHistoricalData(null);
    setAnalysisResults(null);

    let realTimeDataFetched = false;

    try {
      const pair: ForexPair = { symbol };
      const data = await getForexData(pair);
      setForexData(data);
      toast({ title: "Real-time Data Fetched", description: `Data for ${symbol} loaded successfully.` });
      realTimeDataFetched = true;
    } catch (error) {
      console.error("Error fetching Forex data:", error);
      const errorMessage = error instanceof Error ? error.message : "Could not load real-time data.";
      toast({
        variant: "destructive",
        title: "Error Fetching Real-time Data",
        description: `${errorMessage} Please try again.`,
      });
      setIsLoadingData(false);
      setIsLoadingAnalysis(false); 
      return;
    } finally {
      setIsLoadingData(false);
    }

    if (realTimeDataFetched) {
      try {
        const currentStrategy = getStrategyById(selectedStrategyId);
        if (!currentStrategy) {
          throw new Error("Selected strategy not found. This should not happen.");
        }

        const analysisInput: AnalyzeForexPairsInput = { 
          symbol,
          strategyName: currentStrategy.name,
          strategyRules: currentStrategy.rules,
        };
        const results = await analyzeForexPairs(analysisInput);
        if (results) {
          setAnalysisResults(results);
          toast({ title: "AI Analysis Complete", description: `Analysis for ${symbol} using strategy "${currentStrategy.name}" generated successfully.` });
        } else {
           throw new Error("AI analysis returned no output.");
        }
      } catch (error) {
        console.error("Error performing AI analysis:", error);
        const errorMessage = error instanceof Error ? error.message : "Could not generate AI analysis.";
        toast({
          variant: "destructive",
          title: "AI Analysis Failed",
          description: `${errorMessage} Please try again.`,
        });
        setAnalysisResults(null);
      } finally {
        setIsLoadingAnalysis(false);
      }
    } else {
      setIsLoadingAnalysis(false);
    }
  };

  const isLoading = isLoadingData || isLoadingAnalysis;

  return (
    <div className="container mx-auto py-8 px-4 md:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-primary mb-2">Select Forex Pair</h2>
            <ForexPairForm onSubmit={handleFormSubmit} isLoading={isLoading} />
          </div>
          <Separator />
          <div>
             <h2 className="text-2xl font-semibold text-primary mb-2">Manage Strategy</h2>
             <StrategyManager 
                selectedStrategyId={selectedStrategyId}
                onStrategyChange={setSelectedStrategyId}
                disabled={isLoading}
              />
          </div>
          
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
             </p>
          </div>
        </div>

        <div className="md:col-span-2 space-y-8">
          <ForexDataCard data={forexData} pairSymbol={selectedPairSymbol} isLoading={isLoadingData} />
          <Separator />
          {/* Placeholder for HistoricalDataChart - needs data from somewhere */}
          {/* <HistoricalDataChart data={historicalData} pairSymbol={selectedPairSymbol} isLoading={isLoadingData} /> */}
          {/* <Separator /> */}
          <AnalysisResultsCard results={analysisResults} pairSymbol={selectedPairSymbol} isLoading={isLoadingAnalysis} />
        </div>
      </div>
    </div>
  );
}
