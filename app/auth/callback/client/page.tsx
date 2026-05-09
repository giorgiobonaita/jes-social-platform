'use client';
import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const access_token  = params.get('access_token');
    const refresh_token = params.get('refresh_token');
    const next          = params.get('next') || '/home';

    if (access_token && refresh_token) {
      // Caso: code exchange fatto dal route.ts
      supabase.auth.setSession({ access_token, refresh_token }).then(({ error }) => {
        if (error) { router.replace('/login'); return; }
        router.replace(next);
      });
    } else {
      // Caso: token nel fragment (#access_token=...) — Supabase lo detecta da solo
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (!session) { router.replace('/login'); return; }
        const { data: user } = await supabase
          .from('users')
          .select('username')
          .eq('auth_id', session.user.id)
          .maybeSingle();
        router.replace(user?.username ? '/home' : '/onboarding/name');
      });
    }
  }, []);

  return <div style={{ minHeight: '100dvh', background: '#fff' }} />;
}

export default function CallbackClient() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100dvh', background: '#fff' }} />}>
      <CallbackInner />
    </Suspense>
  );
}
