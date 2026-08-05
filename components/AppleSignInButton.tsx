'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function AppleSignInButton({ label = 'Accedi con Apple' }: { label?: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleApple = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const { SocialLogin } = await import('@capgo/capacitor-social-login');

      await SocialLogin.initialize({ apple: {} });

      const result = await SocialLogin.login({
        provider: 'apple',
        options: { scopes: ['email', 'name'] },
      });

      const appleResult = result.result;
      const idToken = appleResult?.idToken;
      if (!idToken) throw new Error('Nessun token Apple ricevuto');

      const { data: sd, error: se } = await supabase.auth.signInWithIdToken({
        provider: 'apple',
        token: idToken,
      });
      if (se || !sd?.session) throw se || new Error('Login fallito');

      const session = sd.session;

      const givenName = appleResult?.profile?.givenName;
      const familyName = appleResult?.profile?.familyName;
      if (givenName || familyName) {
        const fullName = [givenName, familyName].filter(Boolean).join(' ');
        if (fullName) {
          supabase.from('users').update({ name: fullName }).eq('auth_id', session.user.id).then(() => {});
        }
      }

      const { data: user } = await supabase
        .from('users').select('username, nationality').eq('auth_id', session.user.id).maybeSingle();

      setLoading(false);
      if (user?.username && user?.nationality) {
        router.replace('/home');
      } else if (user?.username) {
        router.replace('/onboarding/age');
      } else {
        router.replace('/onboarding/name');
      }

    } catch (e: any) {
      setLoading(false);
      const msg = e?.message || '';
      if (!msg.includes('cancel') && !msg.includes('Cancel') && e?.code !== 1001) {
        alert('Errore Apple: ' + msg);
      }
    }
  };

  return (
    <button onClick={handleApple} disabled={loading} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
      height: 58, borderRadius: 14, width: '100%', border: '2px solid #000',
      background: '#000', cursor: loading ? 'not-allowed' : 'pointer',
      fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700, color: '#fff',
      transition: 'opacity .15s, transform .1s', opacity: loading ? 0.6 : 1,
    }}
    onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
    onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
    >
      <svg width="18" height="22" viewBox="0 0 814 1000" fill="white">
        <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-37.5-155.5-127.4C46 790.7 0 663 0 541.8c0-207.5 135.4-317.3 269-317.3 70.1 0 128.4 46.4 172.5 46.4 42.8 0 109.6-49 192.5-49 31 0 108.2 2.6 168.6 80.6zM558.3 57.6c25.8-30.8 44.4-73.7 44.4-116.6 0-5.8-.6-11.7-1.9-16.3C535 4.4 460.8 51.9 414.3 103.2c-23.8 26.5-46.4 69.4-46.4 113 0 6.4 1.3 12.8 1.9 14.8 2.6.6 6.5 1.3 10.4 1.3 49.1 0 119.6-45.1 178.1-174.7z"/>
      </svg>
      {loading ? 'Caricamento...' : label}
    </button>
  );
}
