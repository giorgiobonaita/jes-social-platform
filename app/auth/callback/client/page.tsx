'use client';
import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

function CallbackInner() {
  const router = useRouter();
  const params = useSearchParams();

  useEffect(() => {
    const code = params.get('code');

    (async () => {
      if (code) {
        await supabase.auth.exchangeCodeForSession(code);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
        return;
      }

      const { data: user } = await supabase
        .from('users')
        .select('username')
        .eq('auth_id', session.user.id)
        .maybeSingle();

      router.replace(user?.username ? '/home' : '/onboarding/name');
    })();
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
