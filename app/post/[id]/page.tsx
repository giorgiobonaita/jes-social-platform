import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import PostClient from './PostClient';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = params;
  try {
    const { data: post } = await supabaseAdmin
      .from('posts')
      .select('caption, image_url, image_urls, users(name, username)')
      .eq('id', id)
      .single();

    if (!post) return { title: 'JES Social' };

    const author = (post as any).users;
    const imageUrl = (post as any).image_urls?.[0] || (post as any).image_url || null;
    const title = author ? `${author.name} su JES Social` : 'JES Social';
    const description = (post as any).caption || 'Scopri questo post su JES Social';

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `https://jessocial.com/post/${id}`,
        siteName: 'JES Social',
        ...(imageUrl ? { images: [{ url: imageUrl, width: 1200, height: 630 }] } : {}),
        type: 'article',
      },
      twitter: {
        card: imageUrl ? 'summary_large_image' : 'summary',
        title,
        description,
        ...(imageUrl ? { images: [imageUrl] } : {}),
      },
    };
  } catch {
    return { title: 'JES Social' };
  }
}

export default function PostPage({ params }: Props) {
  return <PostClient id={params.id} />;
}
