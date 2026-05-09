'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const hashParams   = new URLSearchParams(window.location.hash.replace('#', ''));
      const code         = searchParams.get('code');
      const accessToken  = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) { router.replace('/login'); return; }
      } else if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (error) { router.replace('/login'); return; }
      } else {
        await new Promise(r => setTimeout(r, 800));
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/login'); return; }

      // Aspetta che il trigger crei la riga (può richiedere un momento)
      await new Promise(r => setTimeout(r, 500));

      const { data: user } = await supabase
        .from('users')
        .select('username')
        .eq('auth_id', session.user.id)
        .maybeSingle();

      if (user?.username) {
        router.replace('/home');
      } else {
        router.replace('/onboarding/name');
      }
    })();
  }, []);

  return <div style={{ minHeight: '100dvh', background: '#fff' }} />;
}
