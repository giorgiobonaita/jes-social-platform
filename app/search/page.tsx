'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import SearchModal from '@/components/SearchModal';

export default function SearchPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/'); return; }
      setReady(true);
    });
  }, [router]);

  if (!ready) return <div style={{ minHeight: '100dvh', background: '#fff' }} />;

  return (
    <SearchModal
      visible
      onClose={() => router.back()}
      onUserPress={async (uid) => {
        const { data } = await supabase.from('users').select('username').eq('id', uid).single();
        if (data?.username) router.push(`/profile/${data.username}`);
      }}
      onPostPress={(postId) => router.push(`/post/${postId}`)}
    />
  );
}
