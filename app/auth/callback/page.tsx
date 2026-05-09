'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function CallbackPage() {
  const router = useRouter();

  useEffect(() => {
    (async () => {
      // Supabase con detectSessionInUrl:true gestisce automaticamente il code/token nell'URL
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // Aspetta un momento che Supabase elabori il token dall'URL
        await new Promise(r => setTimeout(r, 1000));
        const { data: { session: s2 } } = await supabase.auth.getSession();
        if (!s2) { router.replace('/login'); return; }
        checkUser(s2.user.id);
      } else {
        checkUser(session.user.id);
      }
    })();

    async function checkUser(authId: string) {
      const { data: user } = await supabase
        .from('users')
        .select('username')
        .eq('auth_id', authId)
        .maybeSingle();
      router.replace(user?.username ? '/home' : '/onboarding/name');
    }
  }, []);

  return <div style={{ minHeight: '100dvh', background: '#fff' }} />;
}
