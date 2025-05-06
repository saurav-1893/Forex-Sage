"use client";

import { useState, useEffect } from "react";
import type { ForexData, ForexPair, HistoricalForexDataPoint } from "@/services/forex-data";
import { getForexData, getHistoricalForexData } from "@/services/forex-data";
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
import { HistoricalDataChart, type TimeframeOption } from "./historical-data-chart"; 
import { DEFAULT_TIMEFRAME, TIMEFRAME_CONFIG } from "@/config/forex";


export function ForexDashboard() {
  const [selectedPairSymbol, setSelectedPairSymbol] = useState<string | null>(null);
  const [forexData, setForexData] = useState<ForexData | null>(null);
  const [historicalData, setHistoricalData] = useState<HistoricalForexDataPoint[] | null>(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState<TimeframeOption>(DEFAULT_TIMEFRAME);
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
    if (!isStrategyManagerInitialized) {
      toast({
        variant: "destructive",
        title: "Strategy Manager Not Ready",
        description: "Please wait a moment for strategies to load.",
      });
      return;
    }
    
    if (!selectedStrategyId) {
      toast({
        variant: "destructive",
        title: "No Strategy Selected",
        description: "Please select or create a trading strategy before analyzing.",
      });
      return;
    }

    const currentStrategy = getStrategyById(selectedStrategyId);
    if (!currentStrategy) {
        toast({
            variant: "destructive",
            title: "Strategy Not Found",
            description: "The selected strategy could not be found. Please select another strategy.",
        });
        return;
    }

    setIsLoadingData(true);
    setIsLoadingAnalysis(true);
    setSelectedPairSymbol(symbol);
    setForexData(null);
    setHistoricalData(null);
    setAnalysisResults(null);

    let realTimeDataFetched = false;

    try {
      const pair: ForexPair = { symbol };
      const data = await getForexData(pair);
      setForexData(data);
      realTimeDataFetched = true; // Mark as fetched to proceed to historical/analysis
      toast({ title: "Real-time Data Fetched", description: `Data for ${symbol} loaded successfully.` });
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
      return; // Stop if real-time fails
    }

    // Fetch historical data regardless of real-time data outcome for chart, but after real-time attempt
    try {
        const config = TIMEFRAME_CONFIG[selectedTimeframe.value];
        const histData = await getHistoricalForexData(symbol, config.days, config.timespan, config.multiplier);
        setHistoricalData(histData);
        toast({ title: "Historical Data Fetched", description: `Historical data for ${symbol} (${selectedTimeframe.label}) loaded.` });
    } catch (error) {
        console.error("Error fetching historical Forex data:", error);
        const errorMessage = error instanceof Error ? error.message : "Could not load historical data.";
        toast({
            variant: "destructive",
            title: "Error Fetching Historical Data",
            description: `${errorMessage}`,
        });
        // Don't necessarily stop analysis if historical fails, but log it. AI flow might handle missing historical.
    } finally {
       setIsLoadingData(false); // Finished loading data (real-time and historical attempts)
    }


    if (realTimeDataFetched) { // Only proceed to AI analysis if real-time data was fetched
      try {
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
      // If real-time data failed, we already returned, but as a safeguard:
      setIsLoadingAnalysis(false);
    }
  };
  
  const handleTimeframeChange = async (newTimeframe: TimeframeOption) => {
    setSelectedTimeframe(newTimeframe);
    if (selectedPairSymbol) {
      setIsLoadingData(true);
      setHistoricalData(null);
      try {
        const config = TIMEFRAME_CONFIG[newTimeframe.value];
        const histData = await getHistoricalForexData(selectedPairSymbol, config.days, config.timespan, config.multiplier);
        setHistoricalData(histData);
        toast({ title: "Historical Data Updated", description: `Historical data for ${selectedPairSymbol} (${newTimeframe.label}) loaded.` });
      } catch (error) {
        console.error("Error fetching historical Forex data on timeframe change:", error);
        const errorMessage = error instanceof Error ? error.message : "Could not load historical data for new timeframe.";
        toast({
            variant: "destructive",
            title: "Error Fetching Historical Data",
            description: `${errorMessage}`,
        });
      } finally {
        setIsLoadingData(false);
      }
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
                disabled={isLoading || !isStrategyManagerInitialized}
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
          <ForexDataCard data={forexData} pairSymbol={selectedPairSymbol} isLoading={isLoadingData && !historicalData} />
          <Separator />
          <HistoricalDataChart 
            data={historicalData} 
            pairSymbol={selectedPairSymbol} 
            isLoading={isLoadingData}
            selectedTimeframe={selectedTimeframe}
            onTimeframeChange={handleTimeframeChange}
          />
          <Separator />
          <AnalysisResultsCard results={analysisResults} pairSymbol={selectedPairSymbol} isLoading={isLoadingAnalysis} />
        </div>
      </div>
    </div>
  );
}
