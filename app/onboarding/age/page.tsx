'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/lib/i18n';

export default function OnboardingAgePage() {
  const router = useRouter();
  const { t } = useLang();
  const [age, setAge] = useState('');
  const [focused, setFocused] = useState(false);

  const ageNum = parseInt(age);
  const tooYoung = age.trim().length > 0 && !isNaN(ageNum) && ageNum < 16;
  const isEnabled = age.trim().length > 0 && !isNaN(ageNum) && ageNum >= 16;

  const handleNext = async () => {
    if (!isEnabled) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const birthYear = new Date().getFullYear() - ageNum;
        await supabase.from('users').update({ birth_date: `${birthYear}-01-01` }).eq('auth_id', user.id);
      }
    } catch {}
    router.push('/onboarding/nationality');
  };

  return (
    <div className="shell onb-page">
      <div className="onb-header">
        <button className="back-btn" onClick={() => router.back()}>
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
      </div>
      <div className="onb-body">
        <div className="onb-top">
          <h1 className="onb-title">{t('onb_age_title')}</h1>
          <div className={`age-input-box${focused && !tooYoung ? ' focused' : ''}${tooYoung ? ' error' : ''}`}>
            <input
              className="age-input-field"
              type="number" placeholder="25" maxLength={3}
              value={age} onChange={e => setAge(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={e => e.key === 'Enter' && handleNext()}
              autoFocus
            />
          </div>
          {tooYoung
            ? <p className="error-text">{t('onb_age_error')}</p>
            : <p className="hint-text">{t('onb_age_hint')}</p>
          }
        </div>
        <div className="onb-bottom">
          <button className="btn-primary" onClick={handleNext} disabled={!isEnabled}>
            {t('onb_next')}
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
