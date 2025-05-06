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
 * Asynchronously retrieves real-time data for a given Forex pair.
 * This implementation uses freeforexapi.com, which updates data approximately every 10 minutes
 * and does not require an API key for basic usage.
 * Bid and Ask prices are derived from the main price with a small, fixed spread as the API only provides a single rate.
 *
 * @param pair The Forex pair to retrieve data for.
 * @returns A promise that resolves to a ForexData object containing real-time data.
 * @throws Error if the API request fails or returns invalid data.
 */
export async function getForexData(pair: ForexPair): Promise<ForexData> {
  const symbol = pair.symbol;
  // Ensure the symbol is in the format required by the API (e.g., EURUSD)
  const apiSymbol = symbol.replace('/', '');
  const apiUrl = `https://www.freeforexapi.com/api/live?pairs=${apiSymbol}`;

  try {
    const response = await fetch(apiUrl, { cache: 'no-store' }); // Disable caching for fresh data

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`API request failed with status ${response.status}: ${errorBody}`);
      throw new Error(`Failed to fetch data for ${symbol}. API returned status ${response.status}.`);
    }

    const data = await response.json();

    if (data.code !== 200 || !data.rates || !data.rates[apiSymbol]) {
      console.error('Invalid API response structure:', data);
      throw new Error(`Invalid or incomplete data received from API for symbol ${symbol}.`);
    }

    const rateData = data.rates[apiSymbol];
    const price = rateData.rate;

    if (typeof price !== 'number' || typeof rateData.timestamp !== 'number') {
        console.error('Invalid data types in API response:', rateData);
        throw new Error(`Invalid data types received from API for ${symbol}.`);
    }

    // The API returns a Unix timestamp (seconds since epoch). Convert to milliseconds.
    const timestamp = new Date(rateData.timestamp * 1000).toISOString();

    // Derive mock bid and ask prices with a small spread
    // This is a common approach when only a mid-price is available.
    // The spread can vary significantly depending on the pair and market conditions.
    // For a demo, a small fixed spread is used.
    const spread = 0.0002 * price; // Example: 0.02% of the price as spread
    const bid = parseFloat((price - spread / 2).toFixed(5));
    const ask = parseFloat((price + spread / 2).toFixed(5));
    const finalPrice = parseFloat(price.toFixed(5));


    return {
      timestamp,
      price: finalPrice,
      bid,
      ask,
    };
  } catch (error) {
    console.error(`Error fetching Forex data for ${symbol}:`, error);
    // Fallback to some default mock data or re-throw to be handled by UI
    // For now, re-throwing allows the UI to show a specific error toast.
    // If we wanted to be more resilient, we could return a default mock:
    // return {
    //   timestamp: new Date().toISOString(),
    //   price: 1.0, bid: 0.999, ask: 1.001, // Placeholder values
    // };
    throw error;
  }
}

