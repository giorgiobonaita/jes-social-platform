'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useLang } from '@/lib/i18n';

export default function SignupPage() {
  const router = useRouter();
  const { t } = useLang();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isReady = firstName.trim().length > 0 && lastName.trim().length > 0 &&
    email.trim().length > 0 && password.trim().length > 0 && termsAccepted;

  const handleSignUp = async () => {
    if (!isReady || loading) return;
    setLoading(true);
    setError('');
    try {
      const { data, error: authError } = await supabase.auth.signUp({ email: email.trim(), password });
      if (authError) { setError(authError.message); return; }
      if (!data.user) { setError(t('error_generic')); return; }

      const baseName = `${firstName.trim().toLowerCase()}${lastName.trim().toLowerCase()}`;
      const username = `${baseName}${Math.floor(Math.random() * 900) + 100}`;
      await supabase.from('users').insert({
        auth_id: data.user.id,
        name: `${firstName.trim()} ${lastName.trim()}`,
        username,
      });

      const params = new URLSearchParams({ firstName: firstName.trim(), lastName: lastName.trim() });
      router.push(`/onboarding/username?${params.toString()}`);
    } catch {
      setError(t('error_generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shell form-page">
      <div className="form-top">
        <button className="back-btn" onClick={() => router.back()}>
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
      </div>

      <div className="form-scroll">
        <h1 className="form-title">{t('signup_title')}</h1>
        <p className="form-subtitle">{t('signup_subtitle')}</p>

        <div className="row-group">
          <div className="input-group half-group">
            <label className="input-label">{t('first_name')}</label>
            <input className="input-field" type="text" placeholder="Mario" value={firstName} onChange={e => setFirstName(e.target.value)} autoCapitalize="words" />
          </div>
          <div className="input-group half-group">
            <label className="input-label">{t('last_name')}</label>
            <input className="input-field" type="text" placeholder="Rossi" value={lastName} onChange={e => setLastName(e.target.value)} autoCapitalize="words" />
          </div>
        </div>

        <div className="input-group">
          <label className="input-label">{t('email_label')}</label>
          <input className="input-field" type="email" placeholder="name@example.com" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" />
        </div>

        <div className="input-group">
          <label className="input-label">{t('password_label')}</label>
          <input className="input-field" type="password" placeholder={t('password_placeholder')} value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
        </div>

        <label className="checkbox-row" onClick={() => setTermsAccepted(p => !p)}>
          <div className={`checkbox-box${termsAccepted ? ' checked' : ''}`}>
            {termsAccepted && <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2.5"><path d="M2 7l4 4 6-6"/></svg>}
          </div>
          <span className="checkbox-label">
            {t('accept_terms')}{' '}
            <Link href="/legal/termini" target="_blank" onClick={e => e.stopPropagation()}>{t('terms_service')}</Link>
            {' '}{t('and_the')}{' '}
            <Link href="/legal/privacy" target="_blank" onClick={e => e.stopPropagation()}>{t('terms_privacy')}</Link>
          </span>
        </label>

        {error && <p className="error-text" style={{ marginBottom: 16 }}>{error}</p>}

        <button className="btn-primary" onClick={handleSignUp} disabled={!isReady || loading} style={{ marginTop: 8 }}>
          {loading ? <span className="spin" /> : t('signup_title')}
        </button>
      </div>
    </div>
  );
}
