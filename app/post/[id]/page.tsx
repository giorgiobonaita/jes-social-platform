import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import PostClient from './PostClient';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

const DEFAULT_META: Metadata = {
  title: 'JES — Il Social delle Emozioni',
  openGraph: {
    title: 'JES — Il Social delle Emozioni',
    images: [{ url: 'https://jessocial.com/logo.png' }],
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { id } = await params;
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return DEFAULT_META;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: post } = await supabase
      .from('posts')
      .select('caption, image_url, image_urls, user_id')
      .eq('id', id)
      .single();

    if (!post) return DEFAULT_META;

    let authorName = 'JES Social';
    const { data: user } = await supabase
      .from('users')
      .select('name, username')
      .eq('id', (post as any).user_id)
      .single();
    if (user) authorName = `${user.name} su JES Social`;

    const imageUrl: string | null =
      ((post as any).image_urls as string[] | null)?.[0] ||
      (post as any).image_url ||
      null;

    const title = authorName;
    const description = (post as any).caption || 'Scopri questo post su JES Social';
    const ogImage = imageUrl || 'https://jessocial.com/logo.png';

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `https://jessocial.com/post/${id}`,
        siteName: 'JES Social',
        images: [{ url: ogImage, width: 1200, height: 630 }],
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImage],
      },
    };
  } catch {
    return DEFAULT_META;
  }
}

export default async function PostPage({ params }: Props) {
  const { id } = await params;
  return <PostClient id={id} />;
}
