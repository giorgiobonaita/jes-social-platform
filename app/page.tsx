'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

export default function LandingPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        router.replace('/home');
      } else {
        setReady(true);
      }
    });
  }, [router]);

  if (!ready) return <div style={{ minHeight: '100dvh', background: '#FFFFFF' }} />;

  return (
    <div className="shell auth-page">
      <div className="auth-main" style={{ gap: 0, justifyContent: 'center', alignItems: 'center', flex: 1 }}>
        <div className="auth-logo-container" style={{ marginBottom: 0 }}>
          <div className="logo-row">
            <Image src="/logo.png" alt="JES" width={72} height={72} style={{ objectFit: 'contain' }} />
            <span className="logo-text lg">JES</span>
          </div>
          <span className="subtitle-text">IL SOCIAL DELLE EMOZIONI</span>
        </div>
      </div>

      <div style={{ padding: '0 20px 48px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <button className="btn-primary" onClick={() => router.push('/signup')}>
          Registrati
        </button>
        <button className="btn-secondary" onClick={() => router.push('/login/email')}>
          Accedi
        </button>
      </div>
    </div>
  );
}
