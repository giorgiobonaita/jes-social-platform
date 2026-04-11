'use client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function AuthPage() {
  const router = useRouter();

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
          <span className="subtitle-text">IL SOCIAL DELLE EMOZIONI</span>
        </div>

        <div className="auth-buttons">
          <button className="btn-primary" onClick={() => router.push('/signup')}>
            <svg width="22" height="22" fill="none" stroke="white" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
              <polyline points="22,6 12,13 2,6"/>
            </svg>
            Registrati con email
          </button>
        </div>

        <div className="auth-hint" style={{ marginTop: 16 }}>
          <span className="auth-hint-text">Hai già un account?</span>
          <button className="ghost-btn" style={{ paddingLeft: 6 }} onClick={() => router.push('/login')}>
            Accedi
          </button>
        </div>
      </div>

      <p className="terms-text">
        Continuando, accetti i{' '}
        <a href="/termini.html" target="_blank">Termini di Servizio</a> di JES.
        Gestiamo le tue informazioni come descritto nella nostra{' '}
        <a href="/privacy.html" target="_blank">Privacy Policy</a>.
      </p>
    </div>
  );
}
