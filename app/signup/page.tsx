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
  const [phone, setPhone] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [acceptsPromotions, setAcceptsPromotions] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [emailConfirmed, setEmailConfirmed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isReady = firstName.trim().length > 0 && lastName.trim().length > 0 &&
    email.trim().length > 0 && password.trim().length > 0 && termsAccepted && emailConfirmed;

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
        email: email.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`,
        username,
        phone: phone.trim() || null,
        title: title.trim() || null,
        bio: bio.trim() || null,
        accepts_promotions: acceptsPromotions,
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

        {/* Phone (optional) */}
        <div className="input-group">
          <label className="input-label">{t('phone_label')} <span style={{ fontWeight: 400, color: '#AAAAAA', fontSize: 13 }}>{t('optional_label')}</span></label>
          <input className="input-field" type="tel" placeholder="+39 333 000 0000" value={phone} onChange={e => setPhone(e.target.value)} />
        </div>

        {/* Profile separator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, marginTop: 4 }}>
          <div style={{ flex: 1, height: 1, backgroundColor: '#EEEEEE' }} />
          <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11, color: '#AAAAAA', letterSpacing: '0.8px', textTransform: 'uppercase' }}>{t('profile_section')}</span>
          <div style={{ flex: 1, height: 1, backgroundColor: '#EEEEEE' }} />
        </div>

        {/* Title / Discipline (optional) */}
        <div className="input-group">
          <label className="input-label">{t('title_label')} <span style={{ fontWeight: 400, color: '#AAAAAA', fontSize: 13 }}>{t('optional_label')}</span></label>
          <input className="input-field" type="text" placeholder={t('title_label')} value={title} onChange={e => setTitle(e.target.value)} />
        </div>

        {/* Bio (optional) */}
        <div className="input-group">
          <label className="input-label">{t('bio_label')} <span style={{ fontWeight: 400, color: '#AAAAAA', fontSize: 13 }}>{t('optional_label')}</span></label>
          <textarea
            className="input-field"
            placeholder={t('bio_placeholder')}
            value={bio}
            onChange={e => { if (e.target.value.length <= 160) setBio(e.target.value); }}
            rows={3}
            style={{ resize: 'none', paddingTop: 12, lineHeight: '1.5' }}
          />
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#AAAAAA', display: 'block', textAlign: 'right', marginTop: 4 }}>{bio.length}/160</span>
        </div>


        <label className="checkbox-row" onClick={() => setTermsAccepted(p => !p)}>
          <div className={`checkbox-box${termsAccepted ? ' checked' : ''}`}>
            {termsAccepted && <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2.5"><path d="M2 7l4 4 6-6"/></svg>}
          </div>
          <span className="checkbox-label">
            {t('accept_terms')}{' '}
            <a href="https://jessocial.com/legal/termini" target="_blank" rel="noopener noreferrer" onClick={e => { e.stopPropagation(); window.open('https://jessocial.com/legal/termini', '_system'); e.preventDefault(); }}>{t('terms_service')}</a>
            {' '}{t('and_the')}{' '}
            <a href="https://jessocial.com/legal/privacy" target="_blank" rel="noopener noreferrer" onClick={e => { e.stopPropagation(); window.open('https://jessocial.com/legal/privacy', '_system'); e.preventDefault(); }}>{t('terms_privacy')}</a>
          </span>
        </label>

        <label className="checkbox-row" onClick={() => setEmailConfirmed(p => !p)}>
          <div className={`checkbox-box${emailConfirmed ? ' checked' : ''}`}>
            {emailConfirmed && <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2.5"><path d="M2 7l4 4 6-6"/></svg>}
          </div>
          <span className="checkbox-label">{t('email_ownership_confirm')}</span>
        </label>

        <label className="checkbox-row" onClick={() => setAcceptsPromotions(p => !p)} style={{ marginBottom: 24 }}>
          <div className={`checkbox-box${acceptsPromotions ? ' checked' : ''}`}>
            {acceptsPromotions && <svg width="14" height="14" fill="none" stroke="white" strokeWidth="2.5"><path d="M2 7l4 4 6-6"/></svg>}
          </div>
          <span className="checkbox-label">
            {t('promotions_label')}{' '}
            <span style={{ color: '#AAAAAA', fontSize: 13 }}>{t('optional_label')}</span>
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
