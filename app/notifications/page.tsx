'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import NotificationsModal from '@/components/NotificationsModal';

export default function NotificationsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { router.replace('/'); return; }
      setReady(true);
    });
  }, [router]);

  if (!ready) return <div style={{ minHeight: '100dvh', background: '#fff' }} />;

  return <NotificationsModal visible onClose={() => router.back()} />;
}
