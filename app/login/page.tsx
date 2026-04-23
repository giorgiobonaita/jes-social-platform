'use client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useLang } from '@/lib/i18n';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLang();

  return (
    <div className="shell auth-page">
      <div className="auth-header">
        <button className="back-btn" onClick={() => router.back()}>
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
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
          <button className="btn-primary" onClick={() => router.push('/login/email')}>
            <svg width="22" height="22" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            {t('login_with_email')}
          </button>
        </div>

        <button className="ghost-btn" onClick={() => router.push('/forgot-password')}>
          {t('forgot_password')}
        </button>

        <div className="auth-hint" style={{ marginTop: 8 }}>
          <span className="auth-hint-text">{t('no_account')}</span>
          <button className="ghost-btn" style={{ paddingLeft: 6 }} onClick={() => router.push('/auth')}>
            {t('sign_up')}
          </button>
        </div>
      </div>

      <p className="terms-text">
        {t('terms_text').split(t('terms_service')).map((part, i, arr) =>
          i < arr.length - 1
            ? <span key={i}>{part}<a href="https://jesocial.com/legal/termini" onClick={e => { window.open('https://jesocial.com/legal/termini', '_system'); e.preventDefault(); }}>{t('terms_service')}</a></span>
            : <span key={i}>{part.split(t('terms_privacy')).map((p2, j, arr2) =>
                j < arr2.length - 1
                  ? <span key={j}>{p2}<a href="https://jesocial.com/legal/privacy" onClick={e => { window.open('https://jesocial.com/legal/privacy', '_system'); e.preventDefault(); }}>{t('terms_privacy')}</a></span>
                  : <span key={j}>{p2}</span>
              )}</span>
        )}
      </p>
    </div>
  );
}
