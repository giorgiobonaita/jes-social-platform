'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (!code) {
        router.replace('/login');
        return;
      }

      // Scambia il code con la sessione
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error || !data.session) {
        router.replace('/login');
        return;
      }

      const session  = data.session;
      const authId   = session.user.id;
      const email    = session.user.email || '';
      const name     = session.user.user_metadata?.full_name || session.user.user_metadata?.name || '';
      const avatar   = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || null;

      // Controlla se esiste già nel DB
      const { data: existing } = await supabase
        .from('users')
        .select('id, username')
        .eq('auth_id', authId)
        .maybeSingle();

      if (existing?.username) {
        router.replace('/home');
      } else if (existing) {
        router.replace('/onboarding/name');
      } else {
        // Nuovo utente Google — crea riga e vai in onboarding
        await supabase.from('users').insert({
          auth_id:    authId,
          email,
          name,
          avatar_url: avatar,
          username:   '',
        });
        router.replace('/onboarding/name');
      }
    })();
  }, []);

  return <div style={{ minHeight: '100dvh', background: '#fff' }} />;
}
