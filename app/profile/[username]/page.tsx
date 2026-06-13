import { Suspense } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { Metadata } from 'next';
import ProfilePageClient from './ProfilePageClient';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface Props {
  params: Promise<{ username: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { username } = await params;
  const { data } = await supabaseAdmin
    .from('users')
    .select('name, bio, avatar_url')
    .eq('username', username)
    .single();

  if (!data) return { title: `@${username} · JES Social` };

  const title = `${data.name || username} (@${username}) · JES Social`;
  const description = data.bio || `Guarda il profilo di @${username} su JES Social`;
  const image = data.avatar_url || 'https://jessocial.com/logo.png';

  return {
    title,
    description,
    openGraph: { title, description, images: [image], url: `https://jessocial.com/profile/${username}`, siteName: 'JES Social', type: 'profile' },
    twitter: { card: 'summary', title, description, images: [image] },
  };
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  return (
    <Suspense fallback={<div style={{ minHeight: '100dvh', background: '#fff' }} />}>
      <ProfilePageClient username={username} />
    </Suspense>
  );
}
