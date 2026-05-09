import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { auth_id, name, avatar_url } = await request.json();
    if (!auth_id) return NextResponse.json({ error: 'Missing auth_id' }, { status: 400 });

    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );

    // Controlla se esiste già
    const { data: existing } = await admin
      .from('users')
      .select('id, username')
      .eq('auth_id', auth_id)
      .maybeSingle();

    if (existing) return NextResponse.json({ existing: true, username: existing.username });

    const { data, error } = await admin.from('users').insert({
      auth_id,
      name:       name || null,
      avatar_url: avatar_url || null,
    }).select('id').single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ created: true, id: data.id });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
