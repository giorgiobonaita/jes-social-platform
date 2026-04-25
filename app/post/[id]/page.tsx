import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import PostClient from './PostClient';

export const dynamic = 'force-dynamic';

interface Props {
  params: { id: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = params;
  const defaultMeta: Metadata = {
    title: `JES Post ${id.slice(0, 8)}`,
    openGraph: {
      title: 'JES — Il Social delle Emozioni',
      images: [{ url: 'https://jessocial.com/logo.png' }],
    },
  };

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseKey) return defaultMeta;

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: post } = await supabase
      .from('posts')
      .select('caption, image_url, image_urls, user_id')
      .eq('id', id)
      .single();

    if (!post) return defaultMeta;

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
  } catch (e) {
    return defaultMeta;
  }
}

export default function PostPage({ params }: Props) {
  return <PostClient id={params.id} />;
}
