"use client";

interface TimeframeOption {
  label: string
  value: string
}

interface TimeframeSelectorProps {
  timeframes: TimeframeOption[]
  selectedTimeframe: TimeframeOption
  onTimeframeChange: (timeframe: TimeframeOption) => void
}

export default function TimeframeSelector({ 
  timeframes, 
  selectedTimeframe, 
  onTimeframeChange 
}: TimeframeSelectorProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium mb-2">Timeframe:</label>
      <select 
        value={selectedTimeframe.value}
        onChange={(e) => {
          const timeframe = timeframes.find(t => t.value === e.target.value)
          if (timeframe) onTimeframeChange(timeframe)
        }}
        className="border rounded px-3 py-2"
      >
        {timeframes.map(timeframe => (
          <option key={timeframe.value} value={timeframe.value}>
            {timeframe.label}
          </option>
        ))}
      </select>
    </div>
  );
}