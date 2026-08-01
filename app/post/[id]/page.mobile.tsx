import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const PostClient = dynamic(() => import('./PostClient'), { ssr: false });

export async function generateStaticParams() { return []; }
export const dynamicParams = false;

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={null}>
      <PostClient id={id} />
    </Suspense>
  );
}
