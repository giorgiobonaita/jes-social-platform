import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'no id' });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return NextResponse.json({ error: 'missing env vars' });

  const supabase = createClient(url, key);

  const { data: post, error: postError } = await supabase
    .from('posts')
    .select('caption, image_url, image_urls, user_id')
    .eq('id', id)
    .single();

  if (!post) return NextResponse.json({ error: 'post not found', postError });

  const { data: user } = await supabase
    .from('users')
    .select('name, username')
    .eq('id', (post as any).user_id)
    .single();

  const imageUrl =
    ((post as any).image_urls as string[] | null)?.[0] ||
    (post as any).image_url ||
    null;

  return NextResponse.json({
    og_title: user ? `${user.name} su JES Social` : 'JES Social',
    og_description: (post as any).caption || '',
    og_image: imageUrl,
    og_url: `https://jessocial.com/post/${id}`,
  });
}
