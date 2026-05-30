import { Suspense } from 'react';
import PostClient from './PostClient';

export const dynamic = 'force-static';
export const dynamicParams = false;

export function generateStaticParams() {
  // No posts pre-generated; all load client-side via SPA fallback
  return [{ id: '_' }];
}

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PostPage({ params }: Props) {
  const { id } = await params;
  return (
    <Suspense fallback={<div style={{ minHeight: '100dvh', background: '#fff' }} />}>
      <PostClient id={id} />
    </Suspense>
  );
}
