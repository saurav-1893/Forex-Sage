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
  timestamp: string; // ISO string format
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
    throw new Error("API key for Finage is not configured. Please set FINAGE_API_KEY in your .env file. This is a required server-side environment variable.");
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
 *
 * @param symbol The Forex pair symbol (e.g., EURUSD).
 * @param days The number of past days to determine the `fromDate`.
 * @param timespan The candle interval unit (e.g., 'day', 'hour', 'minute').
 * @param multiplier The value for the candle interval (e.g., 1 for 1 day, 15 for 15 minutes).
 * @returns A promise that resolves to an array of HistoricalForexDataPoint objects, ordered oldest to newest.
 * @throws Error if the API request fails or returns invalid data.
 */
export async function getHistoricalForexData(
  symbol: string,
  days: number,
  timespan: 'minute' | 'hour' | 'day' | 'week' | 'month' | 'quarter' | 'year',
  multiplier: number
): Promise<HistoricalForexDataPoint[]> {
  const upperSymbol = symbol.toUpperCase();
  const apiKey = process.env.FINAGE_API_KEY;

  if (!apiKey) {
    console.error("FINAGE_API_KEY is not set in environment variables.");
    throw new Error("API key for Finage is not configured. Please set FINAGE_API_KEY in your .env file. This is a required server-side environment variable.");
  }

  const toDate = new Date();
  const fromDate = subDays(toDate, days); // Calculate fromDate based on 'days' lookback

  const toDateString = format(toDate, 'yyyy-MM-dd');
  const fromDateString = format(fromDate, 'yyyy-MM-dd');
  
  // Finage uses 'timespan' for interval unit and 'multiplier' for its value.
  // Example: 1 Day candle = multiplier: 1, timespan: 'day'
  // Example: 15 Minute candle = multiplier: 15, timespan: 'minute'
  const apiUrl = `https://api.finage.co.uk/agg/forex/${upperSymbol}/${multiplier}/${timespan}/${fromDateString}/${toDateString}?apikey=${apiKey}&limit=5000`; // Increased limit for more data points

  try {
    const response = await fetch(apiUrl, { cache: 'no-store' });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Finage API request failed for historical data of ${upperSymbol} (multiplier: ${multiplier}, timespan: ${timespan}) with status ${response.status}: ${errorBody}`);
      let errorMessage = `Failed to fetch historical data for ${upperSymbol}. Finage API returned status ${response.status}.`;
      if (response.status === 401) errorMessage += " Invalid API key.";
      else if (response.status === 429) errorMessage += " API rate limit exceeded.";
      else if (response.status === 400 && errorBody.includes("not supported")) errorMessage += ` Symbol ${upperSymbol}, multiplier ${multiplier}, or timespan ${timespan} may not be supported.`;
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
        typeof point.t !== 'number' // Finage timestamp is in milliseconds
      ) {
        console.warn('Skipping invalid historical data point for ' + upperSymbol + ':', point);
        return null;
      }
      return {
        timestamp: new Date(point.t).toISOString(), // Convert ms to ISO string
        open: parseFloat(point.o.toFixed(5)),
        high: parseFloat(point.h.toFixed(5)),
        low: parseFloat(point.l.toFixed(5)),
        close: parseFloat(point.c.toFixed(5)),
        volume: point.v,
      };
    }).filter((point: HistoricalForexDataPoint | null): point is HistoricalForexDataPoint => point !== null);

    // Ensure data is sorted from oldest to newest
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


/**
 * Calculates Simple Moving Average (SMA) for a given period from historical closing prices.
 * @param closingPrices An array of closing prices, ordered from oldest to newest.
 * @param period The period for SMA calculation (e.g., 10, 30).
 * @returns An array of SMA values, with the latest SMA at the end. Returns empty array if not enough data.
 */
export async function calculateSMA(closingPrices: number[], period: number): Promise<number[]> {
  if (closingPrices.length < period) {
    console.warn(`Not enough data (${closingPrices.length} points) to calculate SMA for period ${period}. Need at least ${period} points.`);
    return [];
  }

  const smaValues: number[] = [];
  for (let i = period - 1; i < closingPrices.length; i++) {
    const sum = closingPrices.slice(i - period + 1, i + 1).reduce((acc, val) => acc + val, 0);
    smaValues.push(parseFloat((sum / period).toFixed(5)));
  }
  return smaValues;
}
