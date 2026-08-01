'use client';
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const PostClient = dynamic(() => import('./PostClient'), { ssr: false });

export default function PostClientWrapper({ id }: { id: string }) {
  return (
    <Suspense fallback={null}>
      <PostClient id={id} />
    </Suspense>
  );
}
