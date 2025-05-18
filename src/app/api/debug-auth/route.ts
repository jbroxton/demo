import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    // 1. Check if session can be retrieved
    const session = await getServerSession(authOptions);
    
    // 2. Check request headers
    const headersList = headers();
    const cookieHeader = headersList.get('cookie');
    
    // 3. Check specific cookies
    const cookies = request.cookies.getAll();
    const sessionCookie = cookies.find(c => c.name.includes('next-auth'));
    
    // 4. Check environment variables
    const env = {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
      NODE_ENV: process.env.NODE_ENV,
    };
    
    return NextResponse.json({
      timestamp: new Date().toISOString(),
      session: {
        exists: !!session,
        user: session?.user || null,
      },
      cookies: {
        all: cookies.map(c => ({ name: c.name, value: c.value.substring(0, 20) + '...' })),
        sessionCookie: sessionCookie ? {
          name: sessionCookie.name,
          value: sessionCookie.value.substring(0, 20) + '...'
        } : null,
      },
      headers: {
        cookie: cookieHeader ? cookieHeader.substring(0, 50) + '...' : null,
      },
      environment: env,
      requestUrl: request.url,
    });
  } catch (error) {
    return NextResponse.json({
      error: 'Debug endpoint error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}