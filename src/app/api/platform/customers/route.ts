import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const merchant = searchParams.get('merchant');
  const apiKey = request.headers.get('authorization')?.replace('Bearer ', '');

  if (!apiKey || !email) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  const baseUrl = process.env.PAYRIX_ENVIRONMENT === 'live'
    ? 'https://api.payrix.com'
    : 'https://test-api.payrix.com';

  try {
    const url = `${baseUrl}/v1/query/customers?search[email]=${encodeURIComponent(email)}`;
    const response = await fetch(url, { 
      headers: { 'APIKEY': apiKey },
      cache: 'no-store'
    });
    
    if (!response.ok) {
      return NextResponse.json({ error: 'Platform API error', status: response.status }, { status: 502 });
    }
    
    const data = await response.json();
    const customers = data?.response?.data ?? [];
    return NextResponse.json({ customers });
  } catch (error) {
    console.error('Customer lookup error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
