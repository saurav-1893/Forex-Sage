'use server';

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
    // This error will be caught by the try...catch block in handleFormSubmit in ForexDashboard
    throw new Error("API key for Finage is not configured. Please set FINAGE_API_KEY in your .env file.");
  }

  // Using the "Last Forex Quote" endpoint from Finage: https://api.finage.co.uk/last/forex/{symbol}
  // Documentation: https://finage.co.uk/docs/api/forex-data-api?_gl=1*1mxxd9s*_gcl_au*MTEwMjE2MDQxNC4xNzQ2NTQxOTgxLjIwODc0NDE5NDYuMTc0NjU0MjU0OC4xNzQ2NTQyNTU2*_ga*MTk1NTU0Nzk2NC4xNzQ2NTQxOTgw*_ga_SZF7V0PBZF*czE3NDY1NDE5ODAkbzEkZzEkdDE3NDY1NDI2MzAkajYwJGwwJGgw#last-quote
  const apiUrl = `https://api.finage.co.uk/last/forex/${symbol}?apikey=${apiKey}`;

  try {
    const response = await fetch(apiUrl, { cache: 'no-store' }); // Disable caching for fresh data

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`Finage API request failed for ${symbol} with status ${response.status}: ${errorBody}`);
      // More specific error message based on response status
      let errorMessage = `Failed to fetch data for ${symbol}. Finage API returned status ${response.status}.`;
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
    
    // Validate the structure of the response based on Finage documentation
    // Example: {"symbol":"EURUSD","ask":1.08389,"bid":1.08387,"asize":1000000,"bsize":2000000,"timestamp":1675328400000}
    // Note: Finage API might return `price` directly for some endpoints, but "last/forex" returns "ask" and "bid".
    // We will calculate the price as the midpoint if "price" is not directly available.
    if (!data || typeof data.ask !== 'number' || typeof data.bid !== 'number' || typeof data.timestamp !== 'number') {
      console.error('Invalid API response structure from Finage for symbol ' + symbol + ':', data);
      throw new Error(`Invalid or incomplete data received from Finage API for symbol ${symbol}. Expected 'ask', 'bid', and 'timestamp' to be numbers.`);
    }
    
    const ask = parseFloat(data.ask.toFixed(5));
    const bid = parseFloat(data.bid.toFixed(5));
    // Calculate price as the midpoint of bid and ask
    const price = parseFloat(((ask + bid) / 2).toFixed(5)); 
    
    // Finage timestamp is in milliseconds since epoch
    const timestamp = new Date(data.timestamp).toISOString();

    return {
      timestamp,
      price,
      bid,
      ask,
    };
  } catch (error) {
    console.error(`Error fetching Forex data for ${symbol} from Finage:`, error);
    // Re-throw the error to be handled by the UI, which can show a specific error toast.
    // If the error is not an instance of Error, wrap it
    if (error instanceof Error) {
      throw error;
    } else {
      throw new Error(`An unknown error occurred while fetching data for ${symbol} from Finage.`);
    }
  }
}
