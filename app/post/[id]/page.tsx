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
      .select('caption, image_url, image_urls, user_id')
      .eq('id', id)
      .single();

    if (!post) return {};

    let authorName = 'JES Social';
    if ((post as any).user_id) {
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('name, username')
        .eq('id', (post as any).user_id)
        .single();
      if (user) authorName = `${user.name} su JES Social`;
    }

    const imageUrl: string | null =
      ((post as any).image_urls as string[] | null)?.[0] ||
      (post as any).image_url ||
      null;

    const title = authorName;
    const description = (post as any).caption || 'Scopri questo post su JES Social';

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `https://jessocial.com/post/${id}`,
        siteName: 'JES Social',
        images: imageUrl
          ? [{ url: imageUrl, width: 1200, height: 630 }]
          : [{ url: '/logo.png', width: 512, height: 512 }],
        type: 'article',
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: imageUrl ? [imageUrl] : ['/logo.png'],
      },
    };
  } catch {
    return {};
  }
}

export default function PostPage({ params }: Props) {
  return <PostClient id={params.id} />;
}
