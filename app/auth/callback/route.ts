import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const SUPABASE_URL  = process.env.NEXT_PUBLIC_SUPABASE_URL  || 'https://cunftokrdqvprepcnlum.supabase.co';
const SUPABASE_ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1bmZ0b2tyZHF2cHJlcGNubHVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MDY0ODIsImV4cCI6MjA5MDk4MjQ4Mn0.MbzysRQTEvNXWQKgE84ThglSZSnOlDu_vyD1JF8WdC4';

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (code) {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
      auth: { persistSession: false },
    });
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.session) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, username')
        .eq('auth_id', data.session.user.id)
        .maybeSingle();

      const next = existingUser?.username ? '/home' : '/onboarding/name';

      return NextResponse.redirect(
        `${origin}/auth/callback/client?access_token=${data.session.access_token}&refresh_token=${data.session.refresh_token}&next=${encodeURIComponent(next)}`
      );
    }
  }

  // Nessun code — Supabase ha già messo i token nel fragment (#), gestito dal client
  return NextResponse.redirect(`${origin}/auth/callback/client`);
}
