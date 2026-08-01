'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PostRedirect({ id }: { id: string }) {
  const router = useRouter();
  useEffect(() => {
    router.replace(`/post?id=${id}`);
  }, [id, router]);
  return null;
}
