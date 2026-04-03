import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const apiKey = request.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!apiKey || !email) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }

  const baseUrl = process.env.PAYRIX_ENVIRONMENT === 'live'
    ? 'https://api.payrix.com' 
    : 'https://test-api.payrix.com';

  // Bug 3 fix: use search header instead of query param
  const res = await fetch(`${baseUrl}/v1/query/customers`, {
    headers: { 
      'APIKEY': apiKey,
      'search': `email[equals]=${encodeURIComponent(email)}`,
    },
    cache: 'no-store',
  });
  
  const data = await res.json();
  return NextResponse.json({ customers: data?.response?.data ?? [] });
}
