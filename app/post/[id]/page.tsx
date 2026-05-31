import { Suspense } from 'react';
import PostClient from './PostClient';


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
