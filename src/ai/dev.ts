import { config } from 'dotenv';
config(); // Load environment variables from .env file

// Ensure flows are registered with Genkit
import '@/ai/flows/analyze-forex-pairs';
import '@/ai/flows/llm-chat-feature';

// The historical data fetching logic is now integrated within 'analyze-forex-pairs.ts'
// as a tool, so no separate import is needed for a distinct historical data flow file.
// If getHistoricalForexData were in its own flow file (e.g., get-historical-data-flow.ts),
// you would import it like: import '@/ai/flows/get-historical-data-flow';

// For UUID generation in use-strategy-manager.ts
import { v4 as uuidv4 } from 'uuid';
if (typeof global !== 'undefined' && !(global as any).crypto) {
  (global as any).crypto = {
    getRandomValues: (arr: Uint8Array) => require('crypto').randomBytes(arr.length)
  };
}
