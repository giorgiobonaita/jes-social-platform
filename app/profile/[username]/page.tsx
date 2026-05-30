import { Suspense } from 'react';
import ProfilePageClient from './ProfilePageClient';

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  // Pre-generate only jes_official; all other profiles load client-side via SPA fallback
  return [{ username: 'jes_official' }];
}

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
