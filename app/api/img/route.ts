import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url || !url.startsWith('https://cunftokrdqvprepcnlum.supabase.co/storage/')) {
    return new NextResponse('Invalid URL', { status: 400 });
  }
  const res = await fetch(url);
  if (!res.ok) return new NextResponse('Not found', { status: 404 });
  const buffer = Buffer.from(await res.arrayBuffer());
  const compressed = await sharp(buffer)
    .resize({ width: 800, height: 600, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 60 })
    .toBuffer();
  return new NextResponse(compressed, {
    headers: {
      'Content-Type': 'image/jpeg',
      'Cache-Control': 'public, max-age=86400',
    },
  });
}
