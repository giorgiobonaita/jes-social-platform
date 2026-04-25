import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'no id' });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.json({ error: 'missing env vars', url: !!url, key: !!key });

  const supabase = createClient(url, key);
  const { data, error } = await supabase
    .from('posts')
    .select('id, caption, image_url, image_urls, user_id')
    .eq('id', id)
    .single();

  return NextResponse.json({ data, error });
}
