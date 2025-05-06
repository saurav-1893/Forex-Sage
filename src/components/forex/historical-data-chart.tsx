"use client";

import React, { useMemo } from 'react';
import * as RechartsPrimitive from "recharts"; 
import type { HistoricalForexDataPoint } from '@/services/forex-data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TimeframeOption, TimeframeValue } from '@/config/forex';
import { TIMEFRAME_OPTIONS } from '@/config/forex';
import { TrendingUp, Clock } from 'lucide-react';

interface CandlestickDataPoint {
  timestamp: number; // Use number for recharts
  open: number;
  high: number;
  low: number;
  close: number;
  // Recharts CandlestickChart expects an array for the candle shape
  // typically in the order [open, high, low, close] or [open, close, low, high]
  // Let's stick to [open, high, low, close] as it's common
  ohlc: [number, number, number, number]; 
  volume?: number; // Keep volume if available
}

interface HistoricalDataChartProps {
  data: HistoricalForexDataPoint[] | null;
  pairSymbol: string | null;
  isLoading: boolean;
  selectedTimeframe: TimeframeOption;
  onTimeframeChange: (timeframe: TimeframeOption) => void;
}

// Custom Tooltip for Candlestick Chart
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0].payload; // The underlying data for this candle
    return (
      <div className="p-2 bg-background/80 border rounded-md shadow-lg text-xs">
        <p className="font-bold">{format(new Date(dataPoint.timestamp), 'MMM dd, yyyy HH:mm')}</p>
        <p>Open: <span className="font-medium">{dataPoint.open.toFixed(5)}</span></p>
        <p>High: <span className="font-medium">{dataPoint.high.toFixed(5)}</span></p>
        <p>Low: <span className="font-medium">{dataPoint.low.toFixed(5)}</span></p>
        <p>Close: <span className="font-medium">{dataPoint.close.toFixed(5)}</span></p>
        {dataPoint.volume && <p>Volume: <span className="font-medium">{dataPoint.volume.toLocaleString()}</span></p>}
      </div>
    );
  }
  return null;
};


export function HistoricalDataChart({ 
  data, 
  pairSymbol, 
  isLoading,
  selectedTimeframe,
  onTimeframeChange 
}: HistoricalDataChartProps) {

  const chartData: CandlestickDataPoint[] = useMemo(() => {
    if (!data) return [];
    return data.map(point => ({
      timestamp: new Date(point.timestamp).getTime(),
      open: point.open,
      high: point.high,
      low: point.low,
      close: point.close,
      ohlc: [point.open, point.high, point.low, point.close], 
      volume: point.volume,
    }));
  }, [data]);

  const yDomain = useMemo(() => {
    if (!chartData || chartData.length === 0) return ['auto', 'auto'];
    const lows = chartData.map(d => d.low);
    const highs = chartData.map(d => d.high);
    const minVal = Math.min(...lows);
    const maxVal = Math.max(...highs);
    const padding = (maxVal - minVal) * 0.1; // 10% padding
    return [minVal - padding, maxVal + padding];
  }, [chartData]);


  if (isLoading) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
              Historical Price Chart: <Skeleton className="h-6 w-24" />
            </div>
             <Skeleton className="h-9 w-32" /> {/* Placeholder for timeframe selector */}
          </CardTitle>
          <CardDescription>Loading historical price data...</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px]">
          <Skeleton className="h-full w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!pairSymbol || !data || data.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-primary" />
               Historical Price Chart
            </div>
            <Select
                value={selectedTimeframe.value}
                onValueChange={(value) => {
                    const newTimeframe = TIMEFRAME_OPTIONS.find(opt => opt.value === value);
                    if (newTimeframe) onTimeframeChange(newTimeframe);
                }}
                disabled={!pairSymbol || isLoading}
            >
                <SelectTrigger className="w-[150px] text-sm">
                <Clock className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Select timeframe" />
                </SelectTrigger>
                <SelectContent>
                {TIMEFRAME_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                    {option.label}
                    </SelectItem>
                ))}
                </SelectContent>
            </Select>
          </CardTitle>
          <CardDescription>Historical price movements will appear here once a pair is selected and data is fetched.</CardDescription>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <p className="text-muted-foreground">
            {pairSymbol ? "No historical data available for the selected timeframe or pair." : "Select a Forex pair to view its historical chart."}
          </p>
        </CardContent>
      </Card>
    );
  }
  
  const getXAxisTickFormatter = (timeframeValue: TimeframeValue) => {
    switch (timeframeValue) {
      case '1min':
      case '5min':
      case '15min':
        return (unixTime: number) => format(new Date(unixTime), 'HH:mm');
      case '1h':
      case '4h':
        return (unixTime: number) => format(new Date(unixTime), 'MMM dd HH:mm');
      case '1d':
      case '1wk':
        return (unixTime: number) => format(new Date(unixTime), 'MMM dd');
      default:
        return (unixTime: number) => format(new Date(unixTime), 'MMM dd, yy');
    }
  };


  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
           <div className="flex items-center gap-2 text-primary">
            <TrendingUp className="h-6 w-6 text-primary" />
             Historical Chart: {pairSymbol.toUpperCase()}
           </div>
            <Select
                value={selectedTimeframe.value}
                onValueChange={(value) => {
                    const newTimeframe = TIMEFRAME_OPTIONS.find(opt => opt.value === value);
                    if (newTimeframe) onTimeframeChange(newTimeframe);
                }}
                disabled={isLoading}
            >
                <SelectTrigger className="w-[150px] text-sm">
                    <Clock className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Timeframe" />
                </SelectTrigger>
                <SelectContent>
                {TIMEFRAME_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                    {option.label}
                    </SelectItem>
                ))}
                </SelectContent>
            </Select>
        </CardTitle>
        <CardDescription>
          Displaying candlestick chart for {pairSymbol.toUpperCase()} ({selectedTimeframe.label} timeframe).
        </CardDescription>
      </CardHeader>
      <CardContent className="h-[400px] w-full pt-6">
        <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
          <RechartsPrimitive.CandlestickChart 
            data={chartData} 
            margin={{ top: 5, right: 20, left: -20, bottom: 5 }}
          >
            <RechartsPrimitive.CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <RechartsPrimitive.XAxis 
                dataKey="timestamp" 
                tickFormatter={getXAxisTickFormatter(selectedTimeframe.value)}
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 10 }}
                dy={5} 
                domain={['dataMin', 'dataMax']}
                scale="time"
                type="number"
            />
            <RechartsPrimitive.YAxis 
                orientation="left" 
                domain={yDomain}
                tickFormatter={(value) => typeof value === 'number' ? value.toFixed(5) : value} 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 10 }}
                dx={-5} 
            />
            <RechartsPrimitive.Tooltip content={<CustomTooltip />} cursor={{ stroke: 'hsl(var(--accent))', strokeWidth: 1 }}/>
            <RechartsPrimitive.Legend />
            <RechartsPrimitive.Bar dataKey="ohlc" name={pairSymbol} fill="hsl(var(--chart-1))" shape={<CustomCandleShape />} />

            {/* Optional: Add a reference line for the current price if available */}
            {/* {forexData && <ReferenceLine y={forexData.price} label="Current" stroke="orange" strokeDasharray="3 3" />} */}
          </RechartsPrimitive.CandlestickChart>
        </RechartsPrimitive.ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

// CustomCandleShape is necessary if RechartsCandlestickChart doesn't have direct up/down color props
// or if you need very specific rendering. 
// However, usually CandlestickChart has built-in ways to color up/down candles.
// If RechartsCandlestickChart does not have `upColor`/`downColor` props,
// we have to use a custom shape.
const CustomCandleShape = (props: any) => {
  const { x, y, width, height, open, close, low, high, fill, stroke } = props;
  // Determine color based on open/close
  const isRising = close > open;
  const candleColor = isRising ? 'hsl(var(--chart-2))' : 'hsl(var(--chart-1))'; // Green for up, Red for down

  const candleWidth = Math.max(1, width * 0.8); // Ensure candle has some width
  const xOffset = (width - candleWidth) / 2;


  // Calculate body and wick positions
  // const bodyY = isRising ? y + height * (1 - (close - low) / (high - low)) : y + height * (1 - (open - low) / (high - low));
  const bodyHeight = Math.abs(open - close) / (high - low) * height;
  
  const bodyActualY = isRising ? y + (high - close) / (high - low) * height : y + (high - open) / (high - low) * height;


  return (
    <g stroke={stroke || candleColor} fill={candleColor} strokeWidth="1">
      {/* Wick */}
      <line x1={x + width / 2} y1={y} x2={x + width / 2} y2={y + height} stroke={candleColor} />
      {/* Body */}
      <rect x={x + xOffset} y={bodyActualY} width={candleWidth} height={bodyHeight > 0 ? bodyHeight : 1} fill={candleColor} />
    </g>
  );
};
