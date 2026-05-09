'use client';
import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function CallbackClient() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const access_token  = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    const next          = params.get('next') || '/home';

    if (access_token && refresh_token) {
      supabase.auth.setSession({ access_token, refresh_token }).then(() => {
        router.replace(next);
      });
    } else {
      router.replace('/login');
    }
  }, []);

  return <div style={{ minHeight: '100dvh', background: '#fff' }} />;
}
