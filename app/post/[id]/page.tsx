import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import PostClient from './PostClient';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cunftokrdqvprepcnlum.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1bmZ0b2tyZHF2cHJlcGNubHVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MDY0ODIsImV4cCI6MjA5MDk4MjQ4Mn0.MbzysRQTEvNXWQKgE84ThglSZSnOlDu_vyD1JF8WdC4'
);

async function getPostMeta(id: string) {
  const { data: post } = await supabase
    .from('posts')
    .select('id, caption, image_url, user_id')
    .eq('id', id)
    .single();
  if (!post) return null;
  const { data: user } = await supabase
    .from('users')
    .select('name, username')
    .eq('id', post.user_id)
    .single();
  return { ...post, users: user || null };
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const post = await getPostMeta(id);

  if (!post) {
    return {
      title: 'Post — JES',
      description: 'JES — Il Social delle Emozioni',
    };
  }

  const author = (post as any).users;
  const authorName: string = author?.name || 'Un artista';
  const authorUsername: string = author?.username || 'jes';
  const caption: string = post.caption || '';

  const title = `${authorName} su JES`;
  const description = caption
    ? `${caption.slice(0, 140)}${caption.length > 140 ? '…' : ''}`
    : `Guarda il post di @${authorUsername} su JES — Il Social delle Emozioni`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      siteName: 'JES — Il Social delle Emozioni',
      url: `https://jesocial.com/post/${id}`,
      images: post.image_url
        ? [{ url: post.image_url, width: 1200, height: 630, alt: title }]
        : [{ url: '/logo.png', width: 512, height: 512, alt: 'JES' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: post.image_url ? [post.image_url] : ['/logo.png'],
    },
  };
}

export default async function PostPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  return <PostClient id={id} />;
}
