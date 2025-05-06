export const FOREX_PAIRS = [
  { value: "EURUSD", label: "EUR/USD" },
  { value: "GBPUSD", label: "GBP/USD" },
  { value: "USDJPY", label: "USD/JPY" },
  { value: "AUDUSD", label: "AUD/USD" },
  { value: "USDCAD", label: "USD/CAD" },
  { value: "USDCHF", label: "USD/CHF" },
  { value: "NZDUSD", label: "NZD/USD" },
];

export const LLM_MODELS = [
  { value: "gemini", label: "Gemini (Mock)" },
  { value: "chatgpt", label: "ChatGPT (Mock)" },
  { value: "claude", label: "Claude (Mock)" },
  { value: "deepseek", label: "DeepSeek (Mock)" },
];

export type ForexPairSymbol = typeof FOREX_PAIRS[number]['value'];
export type LlmModelValue = typeof LLM_MODELS[number]['value'];

export type TimeframeValue = '1min' | '5min' | '15min' | '1h' | '4h' | '1d' | '1wk';

export interface TimeframeOption {
  value: TimeframeValue;
  label: string;
}

export const TIMEFRAME_OPTIONS: TimeframeOption[] = [
  { value: '1min', label: '1 Minute' },
  { value: '5min', label: '5 Minutes' },
  { value: '15min', label: '15 Minutes' },
  { value: '1h', label: '1 Hour' },
  { value: '4h', label: '4 Hours' },
  { value: '1d', label: '1 Day' },
  { value: '1wk', label: '1 Week' },
];

export const DEFAULT_TIMEFRAME: TimeframeOption = TIMEFRAME_OPTIONS.find(opt => opt.value === '1d')!;

export interface TimeframeApiConfig {
  days: number; // How many days of data to look back to fetch enough candles
  multiplier: number;
  timespan: 'minute' | 'hour' | 'day' | 'week';
}

export const TIMEFRAME_CONFIG: Record<TimeframeValue, TimeframeApiConfig> = {
  '1min': { days: 2, multiplier: 1, timespan: 'minute' },      // ~2880 candles
  '5min': { days: 7, multiplier: 5, timespan: 'minute' },      // ~2016 candles
  '15min': { days: 20, multiplier: 15, timespan: 'minute' },   // ~1920 candles
  '1h': { days: 80, multiplier: 1, timespan: 'hour' },       // ~1920 candles
  '4h': { days: 320, multiplier: 4, timespan: 'hour' },      // ~1920 candles
  '1d': { days: 500, multiplier: 1, timespan: 'day' },        // ~500 candles (Finage limit is 5000)
  '1wk': { days: 2000, multiplier: 1, timespan: 'week' },    // ~285 candles
};
