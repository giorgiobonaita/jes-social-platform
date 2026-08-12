import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-static';

export function generateStaticParams() {
  return [{ id: '_' }];
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const key = serviceKey || anonKey;

  if (!supabaseUrl || !key) {
    return NextResponse.json({ error: 'Missing env vars' });
  }

  const supabase = createClient(supabaseUrl, key, { auth: { persistSession: false } });

  const { data: post, error: postError } = await supabase
    .from('posts')
    .select('image_url, image_urls, caption, user_id')
    .eq('id', id)
    .single();

  if (postError || !post) {
    return NextResponse.json({ error: 'Post not found' });
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('name')
    .eq('id', post.user_id)
    .single();

  return NextResponse.json({
    ok: true,
    post: { caption: post.caption, image_url: post.image_url, image_urls: post.image_urls },
    user: { name: user?.name, error: userError?.message },
    ogImage: post.image_url || post.image_urls?.[0] || 'https://jessocial.com/logo.png',
  });
}
