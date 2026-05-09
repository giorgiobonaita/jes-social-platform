'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { useLang } from '@/lib/i18n';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function LandingPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const { t } = useLang();

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
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px 20px 0' }}>
        <LanguageSwitcher />
      </div>

      <div className="auth-main" style={{ gap: 0, justifyContent: 'center', alignItems: 'center', flex: 1 }}>
        <div className="auth-logo-container" style={{ marginBottom: 0 }}>
          <div className="logo-row">
            <Image src="/logo.png" alt="JES" width={72} height={72} style={{ objectFit: 'contain' }} />
            <span className="logo-text lg">JES</span>
          </div>
          <span className="subtitle-text">{t('tagline')}</span>
        </div>
      </div>

      <div style={{ padding: '0 20px 48px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <button onClick={() => router.push('/auth')} style={{
          height: 56, borderRadius: 14, cursor: 'pointer', width: '100%',
          background: '#F07B1D', color: '#fff', border: 'none',
          fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 700,
          transition: 'opacity .15s, transform .1s',
        }}
        onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
        onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          {t('sign_up')}
        </button>
        <button onClick={() => router.push('/login')} style={{
          height: 56, borderRadius: 14, cursor: 'pointer', width: '100%',
          background: '#F0F0F0', color: '#111', border: 'none',
          fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 700,
          transition: 'opacity .15s, transform .1s',
        }}
        onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
        onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
        onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          {t('login')}
        </button>
      </div>
    </div>
  );
}
