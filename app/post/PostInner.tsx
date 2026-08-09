'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';

const PostClient = dynamic(() => import('./[id]/PostClient'), { ssr: false });

function PostPageInner() {
  const params = useSearchParams();
  const id = params.get('id') || '';
  if (!id) return null;
  return <PostClient id={id} />;
}

export default function PostInner() {
  return (
    <Suspense>
      <PostPageInner />
    </Suspense>
  );
}
