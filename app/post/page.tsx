'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import PostClient from './[id]/PostClient';

function PostPageInner() {
  const params = useSearchParams();
  const id = params.get('id') || '';
  if (!id) return null;
  return <PostClient id={id} />;
}

export default function PostPage() {
  return (
    <Suspense>
      <PostPageInner />
    </Suspense>
  );
}
