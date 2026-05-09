'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      // Leggi il code dall'URL
      const params = new URLSearchParams(window.location.search);
      const code = params.get('code');

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) { router.replace('/login'); return; }
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/login'); return; }

      const authId = session.user.id;
      const email  = session.user.email || '';
      const name   = session.user.user_metadata?.full_name || session.user.user_metadata?.name || '';
      const avatar = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || null;

      // Controlla se esiste già nel DB
      const { data: existing } = await supabase
        .from('users')
        .select('id, username')
        .eq('auth_id', authId)
        .maybeSingle();

      if (existing?.username) {
        // Utente già registrato → home
        router.replace('/home');
      } else if (existing) {
        // Esiste ma senza username → continua onboarding
        router.replace('/onboarding/name');
      } else {
        // Nuovo utente Google → crea riga nel DB e vai in onboarding
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
