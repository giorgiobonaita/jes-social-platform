'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useLang } from '@/lib/i18n';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import AppleSignInButton from '@/components/AppleSignInButton';

export default function AuthPage() {
  const router = useRouter();
  const { t } = useLang();
  const [isIOS, setIsIOS] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  useEffect(() => {
    import('@capacitor/core').then(({ Capacitor }) => {
      setIsIOS(Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'ios');
    }).catch(() => {});
  }, []);

  return (
    <div className="shell auth-page">
      <div className="auth-header">
        <button className="back-btn" onClick={() => router.back()}>
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
      </div>

      <div className="auth-main">
        <div className="auth-logo-container">
          <div className="logo-row">
            <Image src="/logo.png" alt="JES" width={52} height={52} style={{ objectFit: 'contain' }} />
            <span className="logo-text">JES</span>
          </div>
          <span className="subtitle-text">{t('tagline')}</span>
        </div>

        <div className="auth-buttons">
          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 16, cursor: 'pointer' }} onClick={() => setTermsAccepted(p => !p)}>
            <div style={{ flexShrink: 0, width: 22, height: 22, borderRadius: 6, border: `2px solid ${termsAccepted ? '#F07B1D' : '#CCC'}`, background: termsAccepted ? '#F07B1D' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1, transition: 'all .15s' }}>
              {termsAccepted && <svg width="13" height="13" fill="none" stroke="white" strokeWidth="2.5"><path d="M2 6.5l3.5 3.5 6-6"/></svg>}
            </div>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#555', lineHeight: 1.5 }}>
              {t('accept_terms')}{' '}
              <a href="https://jessocial.com/legal/termini" target="_blank" rel="noopener noreferrer" onClick={e => { e.stopPropagation(); window.open('https://jessocial.com/legal/termini', '_system'); e.preventDefault(); }} style={{ color: '#F07B1D' }}>{t('terms_service')}</a>
              {' '}{t('and_the')}{' '}
              <a href="https://jessocial.com/legal/privacy" target="_blank" rel="noopener noreferrer" onClick={e => { e.stopPropagation(); window.open('https://jessocial.com/legal/privacy', '_system'); e.preventDefault(); }} style={{ color: '#F07B1D' }}>{t('terms_privacy')}</a>
            </span>
          </label>
          <div style={{ pointerEvents: termsAccepted ? 'auto' : 'none', opacity: termsAccepted ? 1 : 0.4, transition: 'opacity .2s' }}>
          <GoogleSignInButton label="Registrati con Google" />
          {isIOS && <AppleSignInButton label="Registrati con Apple" />}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
            <div style={{ flex: 1, height: 1, background: '#E8E8E8' }} />
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#AAA' }}>{t('or')}</span>
            <div style={{ flex: 1, height: 1, background: '#E8E8E8' }} />
          </div>
          <button onClick={() => router.push('/signup')} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
            height: 56, borderRadius: 14, width: '100%', cursor: 'pointer',
            background: '#F0F0F0', color: '#111', border: 'none',
            fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700,
            transition: 'opacity .15s, transform .1s',
          }}
          onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
          onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <svg width="20" height="20" fill="none" stroke="#111" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            Registrati con email
          </button>
          </div>
        </div>

        <div className="auth-hint" style={{ marginTop: 16 }}>
          <span className="auth-hint-text">{t('already_account')}</span>
          <button className="ghost-btn" style={{ paddingLeft: 6 }} onClick={() => router.push('/login')}>
            {t('login')}
          </button>
        </div>
      </div>

    </div>
  );
}
