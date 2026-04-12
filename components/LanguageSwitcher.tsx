'use client';
import { useState } from 'react';
import { LANGUAGES, useLang } from '@/lib/i18n';

export default function LanguageSwitcher() {
  const { lang, setLang } = useLang();
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find(l => l.code === lang) ?? LANGUAGES[0];

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: 44, height: 44, display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: 'none', border: 'none',
          cursor: 'pointer', borderRadius: '50%', fontSize: 22,
          transition: 'background .15s',
        }}
        title={current.name}
      >
        {current.flag}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 998 }}
          />
          {/* Dropdown */}
          <div style={{
            position: 'absolute', top: 48, left: 0, zIndex: 999,
            backgroundColor: '#fff', borderRadius: 16,
            boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
            padding: '8px 0', minWidth: 170,
            border: '1px solid #F0F0F0',
          }}>
            {LANGUAGES.map(l => (
              <button
                key={l.code}
                onClick={() => { setLang(l.code); setOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  width: '100%', padding: '10px 16px',
                  background: lang === l.code ? '#FFF4EB' : 'none',
                  border: 'none', cursor: 'pointer', textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 20 }}>{l.flag}</span>
                <span style={{
                  fontFamily: 'var(--font-body)', fontSize: 14,
                  fontWeight: lang === l.code ? 700 : 400,
                  color: lang === l.code ? '#F07B1D' : '#111',
                }}>
                  {l.name}
                </span>
                {lang === l.code && (
                  <svg style={{ marginLeft: 'auto' }} width="14" height="14" fill="#F07B1D" viewBox="0 0 24 24">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
