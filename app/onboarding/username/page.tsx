'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Suspense } from 'react';
import { useLang } from '@/lib/i18n';

function UsernameContent() {
  const router = useRouter();
  const { t } = useLang();
  const params = useSearchParams();
  const firstName = params.get('firstName') || 'user';
  const lastName = params.get('lastName') || 'name';

  const f = firstName.toLowerCase().replace(/\s/g, '');
  const l = lastName.toLowerCase().replace(/\s/g, '');

  const suggestions = [
    `${f}.${l}`, `${f}_${l}`,
    `${f}${l}${Math.floor(Math.random() * 90) + 10}`,
    `the.${f}`,
  ];

  const [username, setUsername] = useState(`${f}${l}`);
  const [focused, setFocused] = useState(false);

  const handleChange = (val: string) => {
    setUsername(val.replace(/[@\s]/g, '').replace(/[^a-zA-Z0-9._]/g, ''));
  };

  const isValid = username.length >= 3;
  const tooShort = username.length > 0 && username.length < 3;

  const handleContinue = async () => {
    if (!isValid) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('users')
          .update({ username, name: `${firstName} ${lastName}`.trim() })
          .eq('auth_id', user.id);
      }
    } catch {}
    router.push('/onboarding/age');
  };

  return (
    <div className="shell onb-page">
      <div className="onb-header">
        <button className="back-btn" onClick={() => router.back()}>
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
      </div>
      <div className="onb-body">
        <div className="onb-top" style={{ justifyContent: 'center' }}>
          <h1 className="onb-title lg" style={{ marginBottom: 8 }}>{t('onb_username_title')}</h1>
          <p className="onb-subtitle" style={{ marginBottom: 32 }}>{t('onb_username_subtitle')}</p>

          <input
            className="username-input"
            value={`@${username}`}
            onChange={e => handleChange(e.target.value.replace(/^@/, ''))}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            autoCapitalize="none"
            autoCorrect="off"
            autoFocus
          />
          <div className={`underline${focused ? ' focused' : ''}`} />

          {tooShort && (
            <div className="warning-row">
              <svg width="15" height="15" fill="#E74C3C" viewBox="0 0 24 24"><circle cx="12" cy="12" r="11"/><path d="M12 7v5M12 16h.01" stroke="white" strokeWidth="2" strokeLinecap="round"/></svg>
              <span className="warning-text">{t('onb_username_min')}</span>
            </div>
          )}

          <p className="suggestions-label" style={{ marginTop: tooShort ? 0 : 40 }}>{t('onb_username_suggestions')}</p>
          <div className="pills-grid">
            {suggestions.map((s, i) => (
              <button key={i} className={`pill${username === s ? ' active' : ''}`} onClick={() => setUsername(s)}>
                {username === s && <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M2 7l4 4 6-6"/></svg>}
                @{s}
              </button>
            ))}
          </div>
        </div>
        <div className="onb-bottom">
          <button className="btn-primary" onClick={handleContinue} disabled={!isValid}>
            {t('onb_continue')}
            {isValid && <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingUsernamePage() {
  return <Suspense><UsernameContent /></Suspense>;
}
