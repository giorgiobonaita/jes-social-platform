'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ProfileModal from '@/components/ProfileModal';

interface Props {
  username: string;
}

export default function ProfilePageClient({ username }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const [targetUserId, setTargetUserId] = useState<string | undefined>(undefined);
  const editMode = searchParams.get('edit') === '1';

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace('/'); return; }

      const { data: profileUser } = await supabase
        .from('users')
        .select('id, auth_id')
        .eq('username', username)
        .single();

      if (!profileUser) { router.replace('/home'); return; }

      // If viewing own profile, pass no targetUserId
      if (profileUser.auth_id === user.id) {
        setTargetUserId(undefined);
      } else {
        setTargetUserId(profileUser.id);
      }
      setReady(true);
    })();
  }, [username, router]);

  if (!ready) return <div style={{ minHeight: '100dvh', background: '#fff' }} />;

  return (
    <ProfileModal
      visible
      onClose={() => router.back()}
      targetUserId={targetUserId}
      onMessagePress={(userId, name, avatar) => {
        router.push(`/chat?with=${userId}&name=${encodeURIComponent(name)}&avatar=${encodeURIComponent(avatar ?? '')}`);
      }}
      onRequestViewUser={(userId) => {
        supabase.from('users').select('username').eq('id', userId).single().then(({ data }) => {
          if (data?.username) router.push(`/profile/${data.username}`);
        });
      }}
      onPostAsJes={(jesUserId, type) => {}}
    />
  );
}
