import { Suspense } from 'react';
import ProfilePageClient from './ProfilePageClient';

export async function generateStaticParams() { return [{ username: '_' }]; }

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  if (username === '_') return null;
  return (
    <Suspense fallback={null}>
      <ProfilePageClient username={username} />
    </Suspense>
  );
}
