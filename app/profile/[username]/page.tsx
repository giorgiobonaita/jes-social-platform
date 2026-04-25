import { Metadata } from 'next';
import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Props {
  params: { username: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = params;
  try {
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('name, username, bio, avatar_url, discipline')
      .eq('username', username)
      .single();

    if (!user) return { title: 'JES Social' };

    const title = `${user.name} (@${user.username}) su JES Social`;
    const description = user.bio || user.discipline || 'Scopri il profilo su JES Social';

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url: `https://jessocial.com/profile/${username}`,
        siteName: 'JES Social',
        ...(user.avatar_url ? { images: [{ url: user.avatar_url, width: 400, height: 400 }] } : {}),
        type: 'profile',
      },
      twitter: {
        card: user.avatar_url ? 'summary' : 'summary',
        title,
        description,
        ...(user.avatar_url ? { images: [user.avatar_url] } : {}),
      },
    };
  } catch {
    return { title: 'JES Social' };
  }
}

export default function ProfilePage({ params }: Props) {
  // Redirect all'app home — il profilo si apre come modal nell'app
  redirect(`/?profile=${params.username}`);
}
