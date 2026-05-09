'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { updateUser } from '@/lib/updateUser';
import { useLang } from '@/lib/i18n';
import { COUNTRIES } from '@/lib/countries';

export default function OnboardingNationalityPage() {
  const router = useRouter();
  const { t } = useLang();
  const [selected, setSelected] = useState('');
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = COUNTRIES.filter(c =>
    c.name.toLowerCase().includes(query.toLowerCase()) ||
    c.native.toLowerCase().includes(query.toLowerCase())
  );

  const handleNext = async () => {
    if (!selected || saving) return;
    setSaving(true);
    await updateUser({ nationality: selected });
    router.push('/onboarding/photo');
  };

  return (
    <div className="shell onb-page" style={{ display: 'flex', flexDirection: 'column', height: '100dvh', overflow: 'hidden' }}>
      {/* Header */}
      <div className="onb-header" style={{ flexShrink: 0 }}>
        <button className="back-btn" onClick={() => router.back()}>
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
      </div>

      {/* Title */}
      <div style={{ flexShrink: 0, padding: '0 24px 16px' }}>
        <h1 className="onb-title">{t('onb_nationality_title')}</h1>
        <p className="hint-text" style={{ marginTop: 4 }}>{t('onb_nationality_hint')}</p>
      </div>

      {/* Search */}
      <div style={{ flexShrink: 0, padding: '0 24px 10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, backgroundColor: '#F5F5F5', borderRadius: 14, padding: '11px 14px' }}>
          <svg width="16" height="16" fill="none" stroke="#AAAAAA" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input
            style={{ flex: 1, border: 'none', outline: 'none', fontFamily: 'var(--font-body)', fontSize: 15, color: '#111', background: 'transparent' }}
            placeholder={t('nationality_search')}
            value={query}
            onChange={e => setQuery(e.target.value)}
            autoFocus
          />
          {query && (
            <button onClick={() => setQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#AAAAAA', display: 'flex' }}>
              <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>
            </button>
          )}
        </div>
      </div>

      {/* Scrollable list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px' }}>
        <div style={{ borderRadius: 16, border: '1.5px solid #F0F0F0', overflow: 'hidden', backgroundColor: '#fff' }}>
          {filtered.map(c => {
            const isSelected = selected === c.name;
            return (
              <div key={c.name} onClick={() => setSelected(c.name)}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 16px', borderBottom: '1px solid #F8F8F8', cursor: 'pointer', backgroundColor: isSelected ? '#FFF5EE' : 'transparent' }}>
                <span style={{ fontSize: 24, lineHeight: 1, flexShrink: 0 }}>{c.flag}</span>
                <span style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: isSelected ? 700 : 400, color: isSelected ? '#F07B1D' : '#111' }}>
                  {c.name}{c.native !== c.name ? <span style={{ color: isSelected ? '#F07B1D99' : '#AAAAAA', fontWeight: 400 }}> — {c.native}</span> : null}
                </span>
                {isSelected && (
                  <svg width="18" height="18" fill="none" stroke="#F07B1D" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky button */}
      <div style={{ flexShrink: 0, padding: '16px 24px 32px', backgroundColor: '#fff', borderTop: '1px solid #F0F0F0' }}>
        <button className="btn-primary" onClick={handleNext} disabled={!selected || saving}
          style={{ width: '100%', opacity: selected ? 1 : 0.4 }}>
          {t('onb_next')}
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
        </button>
      </div>
    </div>
  );
}
