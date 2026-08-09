import type { Metadata } from 'next';
import PostInner from './PostInner';

export const dynamic = 'force-dynamic';

async function fetchPostOg(id: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const apiKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !apiKey || !id) return null;
  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/posts?id=eq.${id}&select=image_url,image_urls,caption,users(name)&limit=1`,
      {
        headers: { 'apikey': apiKey, 'Authorization': `Bearer ${apiKey}` },
        cache: 'no-store',
      }
    );
    if (!res.ok) return null;
    const posts = await res.json();
    return posts?.[0] ?? null;
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { searchParams }: { searchParams: Promise<{ id?: string }> }
): Promise<Metadata> {
  const { id } = await searchParams;
  if (!id) return {};
  const post = await fetchPostOg(id);
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
}

export default function PostPage() {
  return <PostInner />;
}
