import { NextRequest, NextResponse } from 'next/server';

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 30;
const ipCounts = new Map<string, { count: number; resetAt: number }>();

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith('/api/')) {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
    const now = Date.now();
    const entry = ipCounts.get(ip);

    if (!entry || now > entry.resetAt) {
      ipCounts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    } else {
      entry.count++;
      if (entry.count > MAX_REQUESTS) {
        return new NextResponse('Too Many Requests', { status: 429 });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
