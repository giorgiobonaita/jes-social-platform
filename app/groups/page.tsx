'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import GroupsModal from '@/components/GroupsModal';
import { Suspense } from 'react';

function GroupsPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const groupId = searchParams.get('id') ?? undefined;

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/'); return; }
      setReady(true);
    });
  }, [router]);

  if (!ready) return <div style={{ minHeight: '100dvh', background: '#fff' }} />;

  return (
    <GroupsModal
      visible
      onClose={() => router.back()}
      initialGroupId={groupId}
      onPostPublished={() => {}}
    />
  );
}

export default function GroupsPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100dvh', background: '#fff' }} />}>
      <GroupsPageInner />
    </Suspense>
  );
}
