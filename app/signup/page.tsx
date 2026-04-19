'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { useLang } from '@/lib/i18n';

const NATIONALITIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Australia', 'Austria',
  'Bangladesh', 'Belgium', 'Brazil', 'Canada', 'Chile', 'China', 'Colombia',
  'Croatia', 'Czech Republic', 'Denmark', 'Egypt', 'Ethiopia', 'Finland',
  'France', 'Germany', 'Ghana', 'Greece', 'Hungary', 'India', 'Indonesia',
  'Iran', 'Iraq', 'Ireland', 'Israel', 'Italy', 'Japan', 'Jordan', 'Kenya',
  'South Korea', 'Kuwait', 'Lebanon', 'Libya', 'Malaysia', 'Mexico',
  'Morocco', 'Netherlands', 'New Zealand', 'Nigeria', 'Norway', 'Pakistan',
  'Peru', 'Philippines', 'Poland', 'Portugal', 'Romania', 'Russia',
  'Saudi Arabia', 'Senegal', 'Serbia', 'Singapore', 'South Africa', 'Spain',
  'Sweden', 'Switzerland', 'Syria', 'Thailand', 'Tunisia', 'Turkey',
  'UAE', 'Ukraine', 'United Kingdom', 'United States', 'Venezuela', 'Vietnam',
];

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
  const [nationality, setNationality] = useState('');
  const [showNationalityList, setShowNationalityList] = useState(false);
  const [nationalityFilter, setNationalityFilter] = useState('');
  const [acceptsPromotions, setAcceptsPromotions] = useState(false);
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
        email: email.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`,
        username,
        phone: phone.trim() || null,
        title: title.trim() || null,
        bio: bio.trim() || null,
        nationality: nationality || null,
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

        {/* Nationality (optional) */}
        <div className="input-group">
          <label className="input-label">{t('nationality_label')} <span style={{ fontWeight: 400, color: '#AAAAAA', fontSize: 13 }}>{t('optional_label')}</span></label>
          <button type="button" className="input-field" onClick={() => { setShowNationalityList(p => !p); setNationalityFilter(''); }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', height: 52 }}>
            <span style={{ color: nationality ? '#111' : '#AAAAAA' }}>{nationality || t('nationality_placeholder')}</span>
            <svg width="18" height="18" fill="none" stroke="#AAAAAA" strokeWidth="2" viewBox="0 0 24 24">
              {showNationalityList ? <polyline points="18 15 12 9 6 15"/> : <polyline points="6 9 12 15 18 9"/>}
            </svg>
          </button>
          {showNationalityList && (
            <div style={{ marginTop: 4, backgroundColor: '#fff', borderRadius: 12, border: '1.5px solid #F07B1D', overflow: 'hidden', maxHeight: 220 }}>
              <input className="input-field" type="text" placeholder={t('nationality_search')} value={nationalityFilter}
                onChange={e => setNationalityFilter(e.target.value)}
                style={{ borderRadius: 0, borderBottom: '1px solid #EEE', height: 44 }} />
              <div style={{ overflowY: 'auto', maxHeight: 176 }}>
                <div style={{ padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #F5F5F5' }}
                  onClick={() => { setNationality(''); setShowNationalityList(false); }}>
                  <span style={{ color: '#AAAAAA', fontSize: 15 }}>{t('nationality_none')}</span>
                </div>
                {NATIONALITIES.filter(n => n.toLowerCase().includes(nationalityFilter.toLowerCase())).map(n => (
                  <div key={n} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', cursor: 'pointer', borderBottom: '1px solid #F5F5F5' }}
                    onClick={() => { setNationality(n); setShowNationalityList(false); setNationalityFilter(''); }}>
                    <span style={{ fontSize: 15, color: nationality === n ? '#F07B1D' : '#111', fontWeight: nationality === n ? 600 : 400 }}>{n}</span>
                    {nationality === n && <svg width="16" height="16" fill="none" stroke="#F07B1D" strokeWidth="2.5"><path d="M2 8l4 4 8-8"/></svg>}
                  </div>
                ))}
              </div>
            </div>
          )}
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
