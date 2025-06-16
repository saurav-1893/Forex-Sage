export const OANDA_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_OANDA_ENV === 'live' 
    ? 'https://api-fxtrade.oanda.com/v3'
    : 'https://api-fxpractice.oanda.com/v3',
  API_KEY: process.env.NEXT_PUBLIC_OANDA_API_KEY,
  ACCOUNT_ID: process.env.NEXT_PUBLIC_OANDA_ACCOUNT_ID
}