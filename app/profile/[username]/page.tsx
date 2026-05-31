import { Suspense } from 'react';
import ProfilePageClient from './ProfilePageClient';


interface Props {
  params: Promise<{ username: string }>;
}

export default async function ProfilePage({ params }: Props) {
  const { username } = await params;
  return (
    <Suspense fallback={<div style={{ minHeight: '100dvh', background: '#fff' }} />}>
      <ProfilePageClient username={username} />
    </Suspense>
  );
}
