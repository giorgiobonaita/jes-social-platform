'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ChatModal from '@/components/ChatModal';
import { Suspense } from 'react';

function ChatPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);

  const openWithUserId = searchParams.get('with') ?? undefined;
  const openWithName   = searchParams.get('name') ?? undefined;
  const openWithAvatar = searchParams.get('avatar') ?? undefined;

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/'); return; }
      setReady(true);
    });
  }, [router]);

  if (!ready) return <div style={{ minHeight: '100dvh', background: '#fff' }} />;

  return (
    <ChatModal
      visible
      onClose={() => router.back()}
      openWithUserId={openWithUserId}
      openWithName={openWithName}
      openWithAvatar={openWithAvatar}
    />
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100dvh', background: '#fff' }} />}>
      <ChatPageInner />
    </Suspense>
  );
}
