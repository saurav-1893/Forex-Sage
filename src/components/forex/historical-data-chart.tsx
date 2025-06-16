"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface HistoricalDataChartProps {
  data: any[];
  isLoading: boolean;
  pairSymbol: string;
  timeframe: { label: string; value: string };
  onTimeframeChange: (timeframe: { label: string; value: string }) => void;
}

export default function HistoricalDataChart({ 
  data, 
  isLoading, 
  pairSymbol, 
  timeframe 
}: HistoricalDataChartProps) {
  if (isLoading) {
    return <div className="text-center py-8">Loading historical data...</div>;
  }

  if (!data || data.length === 0) {
    return <div className="text-center py-8">No historical data available</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-4">
        {pairSymbol} - {timeframe.label}
      </h3>
      
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="time" 
            tickFormatter={(value) => new Date(value).toLocaleDateString()}
          />
          <YAxis domain={['dataMin', 'dataMax']} />
          <Tooltip 
            labelFormatter={(value) => new Date(value).toLocaleString()}
            formatter={(value: any) => [value.toFixed(5), 'Price']}
          />
          <Line 
            type="monotone" 
            dataKey="close" 
            stroke="#8884d8" 
            strokeWidth={2}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}