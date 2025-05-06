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
