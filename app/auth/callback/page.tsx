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

      // Caso 1: PKCE flow — c'è un code nel query string
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) { router.replace('/login'); return; }
      }
      // Caso 2: Implicit flow — token nel fragment, li settiamo manualmente
      else if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (error) { router.replace('/login'); return; }
      }
      // Nessun token — prova a leggere sessione esistente (detectSessionInUrl già attivo)
      // aspetta un attimo che Supabase la processi
      else {
        await new Promise(r => setTimeout(r, 800));
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { router.replace('/login'); return; }

      const authId = session.user.id;
      const email  = session.user.email || '';
      const name   = session.user.user_metadata?.full_name || session.user.user_metadata?.name || '';
      const avatar = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || null;

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
        const { error: insertError } = await supabase.from('users').insert({
          auth_id:    authId,
          name:       name || null,
          avatar_url: avatar || null,
        });
        if (insertError) console.error('Insert error:', insertError.message);
        router.replace('/onboarding/name');
      }
    })();
  }, []);

  return <div style={{ minHeight: '100dvh', background: '#fff' }} />;
}
