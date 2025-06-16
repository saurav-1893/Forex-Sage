export function validateOandaConfig() {
  const errors: string[] = []

  // Detailed environment variable checks
  if (!process.env.NEXT_PUBLIC_OANDA_API_KEY) {
    errors.push('Oanda API Key is missing')
  } else {
    console.log('API Key Present (first 5 chars):', 
      process.env.NEXT_PUBLIC_OANDA_API_KEY.substring(0, 5)
    )
  }

  if (!process.env.NEXT_PUBLIC_OANDA_ACCOUNT_ID) {
    errors.push('Oanda Account ID is missing')
  }

  return {
    isValid: errors.length === 0,
    errors
  }
}