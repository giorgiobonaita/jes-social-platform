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
          <button className="btn-social apple" onClick={() => router.replace('/home')}>
            <span className="icon">
              <svg width="22" height="22" viewBox="0 0 814 1000" fill="white">
                <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.5-57-155.2-127.9C46 490.6 31.3 337.3 31.3 253.4c0-136.6 87.3-208.8 173.6-208.8 46.5 0 85.4 30.5 114.8 30.5 28.2 0 72.3-32.2 126.1-32.2 20.3 0 84.4 1.9 130.9 67.1zm-203.3-130.3c26.2-30.8 45.9-73.9 45.9-116.9 0-6.4-.6-12.4-1.9-17.3-43.3 1.3-96.5 28.5-128.3 64.9-24.6 27.6-48.5 70-48.5 113.7 0 6.8 1.3 13.9 1.9 16.5 2.6.6 6.4 1.3 10.3 1.3 38.6 0 87.5-25.3 120.6-61.9z"/>
              </svg>
            </span>
            Continue with Apple
          </button>

          <button className="btn-social facebook" onClick={() => router.replace('/home')}>
            <span className="icon">
              <svg width="20" height="20" fill="white" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </span>
            Continue with Facebook
          </button>

          <button className="btn-social neutral" onClick={() => router.replace('/home')}>
            <span className="icon">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/c1/Google_%22G%22_logo.svg/120px-Google_%22G%22_logo.svg.png" width="22" height="22" alt="G" />
            </span>
            Continue with Google
          </button>

          <button className="btn-social neutral" onClick={() => router.push('/signup')}>
            <span className="icon">
              <svg width="22" height="22" fill="none" stroke="#111" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>
              </svg>
            </span>
            Continue with email
          </button>
        </div>

        <button className="ghost-btn" onClick={() => router.push('/forgot-password')}>
          Forgot password?
        </button>

        <div className="auth-hint">
          <span className="auth-hint-text">Already have an account?</span>
          <button className="ghost-btn" style={{ paddingLeft: 6 }} onClick={() => router.push('/login')}>Log in</button>
        </div>
      </div>

      <p className="terms-text">
        By continuing, you agree to JES&apos;s{' '}
        <a href="/termini.html" target="_blank">Terms of Service</a>. We will manage information about you as described in our{' '}
        <a href="/privacy.html" target="_blank">Privacy Policy</a>.
      </p>
    </div>
  );
}
