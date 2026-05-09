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

      let session = null;

      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error) session = data.session;
      } else if (accessToken && refreshToken) {
        const { data, error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
        if (!error) session = data.session;
      }

      // Se non abbiamo ancora la sessione, aspetta e riprova (fino a 3 secondi)
      if (!session) {
        for (let i = 0; i < 6; i++) {
          await new Promise(r => setTimeout(r, 500));
          const { data } = await supabase.auth.getSession();
          if (data.session) { session = data.session; break; }
        }
      }

      if (!session) { router.replace('/login'); return; }

      // Aspetta che il trigger DB crei la riga utente
      await new Promise(r => setTimeout(r, 1000));

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

  return (
    <div style={{ minHeight: '100dvh', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 40, height: 40, border: '3px solid #F07B1D', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
