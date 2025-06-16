export function logEnvironmentConfig() {
  console.log('Oanda Configuration:', {
    API_KEY: process.env.NEXT_PUBLIC_OANDA_API_KEY 
      ? 'Present (Masked)' 
      : 'Missing',
    ACCOUNT_ID: process.env.NEXT_PUBLIC_OANDA_ACCOUNT_ID 
      ? 'Present (Masked)' 
      : 'Missing',
    NODE_ENV: process.env.NODE_ENV
  })
}