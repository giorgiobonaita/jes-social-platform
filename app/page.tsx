'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';
import { useLang, LANGUAGES } from '@/lib/i18n';

const LANG_CHOSEN_KEY = 'jes_lang_chosen';

export default function LandingPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const { t, lang, setLang } = useLang();
  const [pendingLang, setPendingLang] = useState(lang);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
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
      } else {
        setReady(true);
        // Show lang picker only if user never chose a language
        if (!localStorage.getItem(LANG_CHOSEN_KEY)) {
          setShowLangPicker(true);
        }
      }
    });
  }, [router]);

  const confirmLang = () => {
    setLang(pendingLang);
    localStorage.setItem(LANG_CHOSEN_KEY, '1');
    setShowLangPicker(false);
  };

  if (!ready) return <div style={{ minHeight: '100dvh', background: '#FFFFFF' }} />;

  return (
    <div className="shell auth-page">

      {/* Language picker popup */}
      {showLangPicker && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 480, padding: '28px 20px 40px', display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 20, color: '#111', marginBottom: 6, textAlign: 'center' }}>
              Choose your language
            </div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 20 }}>
              You can change it later in your profile settings.
            </div>
            <div style={{ overflowY: 'auto', maxHeight: '40vh', display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {LANGUAGES.map(l => (
                <button key={l.code} onClick={() => setPendingLang(l.code)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14,
                    padding: '13px 16px', borderRadius: 14, cursor: 'pointer',
                    border: pendingLang === l.code ? '2px solid #F07B1D' : '2px solid #EEE',
                    background: pendingLang === l.code ? '#FFF3E0' : '#FAFAFA',
                    fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600, fontSize: 15,
                    color: pendingLang === l.code ? '#F07B1D' : '#111',
                    transition: 'all .15s',
                  }}>
                  <span style={{ fontSize: 24 }}>{l.flag}</span>
                  <span style={{ flex: 1, textAlign: 'left' }}>{l.name}</span>
                  {pendingLang === l.code && (
                    <svg width="18" height="18" fill="none" stroke="#F07B1D" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                  )}
                </button>
              ))}
            </div>
            <button onClick={confirmLang}
              style={{ width: '100%', height: 54, borderRadius: 14, background: '#F07B1D', color: '#fff', border: 'none', fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
              Choose
            </button>
          </div>
        </div>
      )}

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
