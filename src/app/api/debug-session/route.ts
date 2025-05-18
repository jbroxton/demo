import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  const headersList = headers();
  
  // Get all cookies from the request
  const cookies = request.cookies.getAll();
  
  return NextResponse.json({
    session,
    headers: {
      cookie: headersList.get('cookie'),
      authorization: headersList.get('authorization'),
    },
    cookies: cookies.map(c => ({ name: c.name, value: c.value })),
    url: request.url,
  });
}