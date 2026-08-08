import type { Metadata } from 'next';
import PostRedirect from './PostRedirect';

export const dynamic = 'force-dynamic';

export async function generateStaticParams() {
  return [{ id: '_' }];
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  if (!id || id === '_') return {};
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) return {};
    const res = await fetch(
      `${supabaseUrl}/rest/v1/posts?id=eq.${id}&select=image_url,image_urls,caption,users(name)&limit=1`,
      {
        headers: {
          'apikey': serviceKey,
          'Authorization': `Bearer ${serviceKey}`,
        },
        cache: 'no-store',
      }
    );
    if (!res.ok) return {};
    const posts = await res.json();
    const post = posts?.[0];
    if (!post) return {};
    const name = post.users?.name || 'JES';
    const description = post.caption || `${name} su JES Social`;
    const imageUrl = post.image_url || post.image_urls?.[0] || 'https://jessocial.com/logo.png';
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
    return {};
  }
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PostRedirect id={id} />;
}
