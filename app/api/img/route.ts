import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url || !url.startsWith('https://cunftokrdqvprepcnlum.supabase.co/storage/')) {
    return new NextResponse('Invalid URL', { status: 400 });
  }
  const res = await fetch(url);
  if (!res.ok) return new NextResponse('Not found', { status: 404 });
  const blob = await res.blob();
  return new NextResponse(blob, {
    headers: {
      'Content-Type': res.headers.get('content-type') || 'image/jpeg',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
