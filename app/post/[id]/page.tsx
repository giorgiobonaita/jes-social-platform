import { Suspense } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { Metadata } from 'next';
import PostClient from './PostClient';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cunftokrdqvprepcnlum.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1bmZ0b2tyZHF2cHJlcGNubHVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MDY0ODIsImV4cCI6MjA5MDk4MjQ4Mn0.MbzysRQTEvNXWQKgE84ThglSZSnOlDu_vyD1JF8WdC4'
);

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const { data } = await supabaseAdmin
    .from('posts')
    .select('caption, image_url, image_urls, users:user_id(name, username)')
    .eq('id', id)
    .single();

  if (!data) return { title: 'Post · JES Social' };

  const user = data.users as any;
  const title = user?.name ? `${user.name} su JES Social` : 'JES Social';
  const description = data.caption || 'Guarda questo post su JES Social';
  let image = 'https://jessocial.com/logo.png';
  if (Array.isArray(data.image_urls) && data.image_urls.length > 0) image = data.image_urls[0];
  else if (data.image_url) image = data.image_url;

  return {
    title,
    description,
    openGraph: { title, description, images: [image], url: `https://jessocial.com/post/${id}`, siteName: 'JES Social', type: 'article' },
    twitter: { card: 'summary_large_image', title, description, images: [image] },
  };
}

export default async function PostPage({ params }: Props) {
  const { id } = await params;
  return (
    <Suspense fallback={<div style={{ minHeight: '100dvh', background: '#fff' }} />}>
      <PostClient id={id} />
    </Suspense>
  );
}
