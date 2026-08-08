import type { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import PostRedirect from './PostRedirect';

export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  return [{ id: '_' }];
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  if (id === '_') return { title: 'JES — Il Social delle Emozioni' };
  try {
    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: post } = await sb
      .from('posts')
      .select('image_url, image_urls, caption, users(name)')
      .eq('id', id)
      .maybeSingle();
    if (!post) return { title: 'JES — Il Social delle Emozioni' };
    const name = (post.users as any)?.name || 'JES';
    const description = post.caption || `${name} su JES Social`;
    const imageUrl = post.image_url || (post.image_urls as string[])?.[0] || 'https://jessocial.com/logo.png';
    return {
      title: `${name} su JES Social`,
      description,
      openGraph: {
        title: `${name} su JES Social`,
        description,
        siteName: 'JES',
        images: [{ url: imageUrl, width: 1200, height: 630, alt: name }],
      },
      twitter: {
        card: 'summary_large_image',
        title: `${name} su JES Social`,
        description,
        images: [imageUrl],
      },
    };
  } catch {
    return { title: 'JES — Il Social delle Emozioni' };
  }
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PostRedirect id={id} />;
}
