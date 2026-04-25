import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

interface Props {
  params: { username: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = params;
  const defaultMeta: Metadata = { title: 'JES — Il Social delle Emozioni' };
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: user } = await supabase
      .from('users')
      .select('name, username, bio, avatar_url, discipline')
      .eq('username', username)
      .single();

    if (!user) return defaultMeta;

    const title = `${user.name} (@${user.username}) su JES Social`;
    const description = user.bio || user.discipline || 'Scopri il profilo su JES Social';
    const ogImage = user.avatar_url || 'https://jessocial.com/logo.png';

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `https://jessocial.com/profile/${username}`,
        siteName: 'JES Social',
        images: [{ url: ogImage, width: 400, height: 400 }],
        type: 'profile',
      },
      twitter: {
        card: 'summary',
        title,
        description,
        images: [ogImage],
      },
    };
  } catch {
    return defaultMeta;
  }
}

export default function ProfilePage({ params }: Props) {
  redirect(`/?profile=${params.username}`);
}
