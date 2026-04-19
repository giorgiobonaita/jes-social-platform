'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLang } from '@/lib/i18n';

export default function OnboardingNamePage() {
  const router = useRouter();
  const { t } = useLang();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const isEnabled = firstName.trim().length > 0 && lastName.trim().length > 0;

  const handleNext = () => {
    if (!isEnabled) return;
    const params = new URLSearchParams({ firstName: firstName.trim(), lastName: lastName.trim() });
    router.push(`/onboarding/username?${params.toString()}`);
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
          <h1 className="onb-title">{t('onb_name_title')}</h1>
          <div style={{ display: 'flex', gap: 12, width: '100%', marginBottom: 16 }}>
            <input className="input-field" style={{ textAlign: 'center', flex: 1 }} type="text" placeholder={t('first_name')} value={firstName} onChange={e => setFirstName(e.target.value)} autoCapitalize="words" autoFocus />
            <input className="input-field" style={{ textAlign: 'center', flex: 1 }} type="text" placeholder={t('last_name')} value={lastName} onChange={e => setLastName(e.target.value)} autoCapitalize="words" onKeyDown={e => e.key === 'Enter' && handleNext()} />
          </div>
          <p className="onb-subtitle">{t('onb_name_hint')}</p>
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
