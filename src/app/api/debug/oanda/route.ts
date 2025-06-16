import { NextResponse } from 'next/server'
import axios from 'axios'

export async function GET() {
  try {
    const response = await axios({
      method: 'get',
      url: 'https://api-fxpractice.oanda.com/v3/accounts',
      headers: {
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_OANDA_API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    return NextResponse.json({
      status: 'success',
      accounts: response.data
    })
  } catch (error) {
    console.error('Debugging Endpoint Error:', error)
    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}