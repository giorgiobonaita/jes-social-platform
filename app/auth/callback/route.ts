import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { origin, searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  if (code) {
    return NextResponse.redirect(`${origin}/auth/callback/client?code=${code}`);
  }
  return NextResponse.redirect(`${origin}/auth/callback/client`);
}
