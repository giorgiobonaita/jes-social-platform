import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import PostRedirect from './PostRedirect';

export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  return [{ id: '_' }];
}

async function getPostOg(id: string) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  const supabase = createClient(url, key, { auth: { persistSession: false } });

  const { data: post } = await supabase
    .from('posts')
    .select('image_url, image_urls, caption, user_id')
    .eq('id', id)
    .single();
  if (!post) return null;

  const { data: user } = await supabase
    .from('users')
    .select('name')
    .eq('id', post.user_id)
    .single();

  return { post, userName: user?.name || 'JES' };
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  if (!id || id === '_') return {};
  try {
    const result = await getPostOg(id);
    if (!result) return {};
    const { post, userName } = result;
    const description = post.caption || `${userName} su JES Social`;
    const imageUrl: string = post.image_url || post.image_urls?.[0] || 'https://jessocial.com/logo.png';
    return {
      title: `${userName} su JES Social`,
      description,
      openGraph: {
        title: `${userName} su JES Social`,
        description,
        siteName: 'JES',
        images: [{ url: imageUrl, width: 1200, height: 630, alt: userName }],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${userName} su JES Social`,
        description,
        images: [imageUrl],
      },
    };
  } catch {
    return {};
  }
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PostRedirect id={id} />;
}
