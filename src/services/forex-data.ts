'use server';

import { format, subDays } from 'date-fns';

/**
 * Represents a Forex pair.
 */
export interface ForexPair {
  /**
   * The symbol of the Forex pair (e.g., EURUSD).
   */
  symbol: string;
}

/**
 * Represents real-time data for a Forex pair, including price, timestamp, and other relevant metrics.
 */
export interface ForexData {
  /**
   * The timestamp of the data.
   */
  timestamp: string;
  /**
   * The current price of the Forex pair.
   */
  price: number;
  /**
   * The bid price of the Forex pair.
   */
  bid: number;
  /**
   * The ask price of the Forex pair.
   */
  ask: number;
}

/**
 * Represents a single historical data point for a Forex pair (OHLCV).
 */
export interface HistoricalForexDataPoint {
  timestamp: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Asynchronously retrieves real-time data for a given Forex pair using the Finage API.
 * This function is a Server Action and will be executed on the server.
 *
 * @param pair The Forex pair to retrieve data for.
 * @returns A promise that resolves to a ForexData object containing real-time data.
 * @throws Error if the API request fails or returns invalid data.
 */
export async function getForexData(pair: ForexPair): Promise<ForexData> {
  const symbol = pair.symbol.toUpperCase(); // Finage expects uppercase symbols like EURUSD
  const apiKey = process.env.FINAGE_API_KEY;

  if (!apiKey) {
    console.error("FINAGE_API_KEY is not set in environment variables.");
    throw new Error("API key for Finage is not configured. Please set FINAGE_API_KEY in your .env file.");
  }

  const apiUrl = `https://api.finage.co.uk/last/forex/${symbol}?apikey=${apiKey}`;

  try {
    const response = await fetch(apiUrl, { cache: 'no-store' }); 

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Finage API request failed for ${symbol} with status ${response.status}: ${errorBody}`);
      let errorMessage = `Failed to fetch real-time data for ${symbol}. Finage API returned status ${response.status}.`;
      if (response.status === 401) {
        errorMessage += " This might be due to an invalid API key.";
      } else if (response.status === 429) {
        errorMessage += " API rate limit exceeded.";
      } else if (response.status === 400 && errorBody.includes("not supported")) {
        errorMessage += ` The symbol ${symbol} may not be supported or is invalid.`;
      } else {
        errorMessage += ` Details: ${errorBody}`;
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    
    if (!data || typeof data.ask !== 'number' || typeof data.bid !== 'number' || typeof data.timestamp !== 'number') {
      console.error('Invalid API response structure from Finage for real-time data for symbol ' + symbol + ':', data);
      throw new Error(`Invalid or incomplete real-time data received from Finage API for symbol ${symbol}. Expected 'ask', 'bid', and 'timestamp' to be numbers.`);
    }
    
    const ask = parseFloat(data.ask.toFixed(5));
    const bid = parseFloat(data.bid.toFixed(5));
    const price = parseFloat(((ask + bid) / 2).toFixed(5)); 
    const timestamp = new Date(data.timestamp).toISOString();

    return {
      timestamp,
      price,
      bid,
      ask,
    };
  } catch (error) {
    console.error(`Error fetching real-time Forex data for ${symbol} from Finage:`, error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(`An unknown error occurred while fetching real-time data for ${symbol} from Finage.`);
    }
  }
}


/**
 * Asynchronously retrieves historical data (OHLCV candles) for a given Forex pair.
 * Fetches enough data to calculate indicators like a 14-period RSI (e.g., at least 14 + some buffer, so ~30-45 days for daily RSI).
 *
 * @param symbol The Forex pair symbol (e.g., EURUSD).
 * @param days The number of past days to fetch historical data for. Defaults to 45 to ensure enough data for typical indicators.
 * @param interval The candle interval (e.g., 'day', 'hour', 'minute'). Defaults to 'day'.
 * @returns A promise that resolves to an array of HistoricalForexDataPoint objects, ordered oldest to newest.
 * @throws Error if the API request fails or returns invalid data.
 */
export async function getHistoricalForexData(
  symbol: string,
  days: number = 45, // Increased default to ensure enough data for RSI(14)
  interval: 'day' | 'hour' | 'minute' = 'day'
): Promise<HistoricalForexDataPoint[]> {
  const upperSymbol = symbol.toUpperCase();
  const apiKey = process.env.FINAGE_API_KEY;

  if (!apiKey) {
    console.error("FINAGE_API_KEY is not set in environment variables.");
    throw new Error("API key for Finage is not configured. Please set FINAGE_API_KEY in your .env file.");
  }

  const toDate = new Date();
  const fromDate = subDays(toDate, days);

  const toDateString = format(toDate, 'yyyy-MM-dd');
  const fromDateString = format(fromDate, 'yyyy-MM-dd');
  
  const multiplier = 1; 

  const apiUrl = `https://api.finage.co.uk/agg/forex/${upperSymbol}/${multiplier}/${interval}/${fromDateString}/${toDateString}?apikey=${apiKey}&limit=500`; // Added limit just in case days is very large for other intervals

  try {
    const response = await fetch(apiUrl, { cache: 'no-store' });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Finage API request failed for historical data of ${upperSymbol} with status ${response.status}: ${errorBody}`);
      let errorMessage = `Failed to fetch historical data for ${upperSymbol}. Finage API returned status ${response.status}.`;
      if (response.status === 401) errorMessage += " Invalid API key.";
      else if (response.status === 429) errorMessage += " API rate limit exceeded.";
      else if (response.status === 400 && errorBody.includes("not supported")) errorMessage += ` Symbol ${upperSymbol} or interval ${interval} may not be supported.`;
      else errorMessage += ` Details: ${errorBody}`;
      throw new Error(errorMessage);
    }

    const data = await response.json();

    if (!data || !data.results || !Array.isArray(data.results)) {
      console.error('Invalid API response structure from Finage for historical data for symbol ' + upperSymbol + ':', data);
      if (data && data.note && data.note.includes("limit")) {
          throw new Error(`Finage API limit likely reached for historical data for symbol ${upperSymbol}. Check your Finage plan. Note: ${data.note}`);
      }
      throw new Error(`Invalid or incomplete historical data received from Finage API for symbol ${upperSymbol}. Expected 'results' to be an array.`);
    }
    
    const historicalPoints = data.results.map((point: any) => {
      if (
        typeof point.o !== 'number' ||
        typeof point.h !== 'number' ||
        typeof point.l !== 'number' ||
        typeof point.c !== 'number' ||
        typeof point.v !== 'number' ||
        typeof point.t !== 'number'
      ) {
        console.warn('Skipping invalid historical data point for ' + upperSymbol + ':', point);
        return null;
      }
      return {
        timestamp: new Date(point.t).toISOString(),
        open: parseFloat(point.o.toFixed(5)),
        high: parseFloat(point.h.toFixed(5)),
        low: parseFloat(point.l.toFixed(5)),
        close: parseFloat(point.c.toFixed(5)),
        volume: point.v,
      };
    }).filter((point: HistoricalForexDataPoint | null): point is HistoricalForexDataPoint => point !== null);

    // Ensure data is sorted from oldest to newest for RSI calculation
    return historicalPoints.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  } catch (error) {
    console.error(`Error fetching historical Forex data for ${upperSymbol} from Finage:`, error);
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(`An unknown error occurred while fetching historical data for ${upperSymbol} from Finage.`);
    }
  }
}


/**
 * Calculates the Relative Strength Index (RSI) for a given period from historical closing prices.
 * @param closingPrices An array of closing prices, ordered from oldest to newest.
 * @param period The period for RSI calculation (e.g., 14).
 * @returns The latest RSI value, or null if not enough data.
 */
export async function calculateRSI(closingPrices: number[], period: number = 14): Promise<number | null> {
  if (closingPrices.length < period + 1) {
    // Not enough data to calculate RSI reliably (need at least `period` changes)
    console.warn(`Not enough data (${closingPrices.length} points) to calculate RSI for period ${period}. Need at least ${period + 1} points.`);
    return null;
  }

  let gains = 0;
  let losses = 0;

  // Calculate initial average gain and loss for the first `period` changes
  for (let i = 1; i <= period; i++) {
    const change = closingPrices[i] - closingPrices[i - 1];
    if (change > 0) {
      gains += change;
    } else {
      losses -= change; // losses are positive values
    }
  }

  let avgGain = gains / period;
  let avgLoss = losses / period;

  // Smooth RSI for subsequent periods
  for (let i = period + 1; i < closingPrices.length; i++) {
    const change = closingPrices[i] - closingPrices[i - 1];
    let currentGain = 0;
    let currentLoss = 0;

    if (change > 0) {
      currentGain = change;
    } else {
      currentLoss = -change;
    }

    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;
  }

  if (avgLoss === 0) {
    return 100; // RSI is 100 if average loss is zero (all gains)
  }

  const rs = avgGain / avgLoss;
  const rsi = 100 - (100 / (1 + rs));

  return parseFloat(rsi.toFixed(2));
}
