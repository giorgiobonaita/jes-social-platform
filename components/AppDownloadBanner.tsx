'use client';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'jes_app_banner_dismissed';

export default function AppDownloadBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Non mostrare se già chiuso
    if (localStorage.getItem(STORAGE_KEY)) return;

    // Non mostrare se siamo nell'app nativa Capacitor
    const isNative = typeof (window as any).Capacitor !== 'undefined' && (window as any).Capacitor?.isNativePlatform?.();
    if (isNative) return;

    // Mostra solo su dispositivi mobile (touch)
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (!isMobile) return;

    setVisible(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  if (!visible) return null;

  // Solo Android per ora
  const isAndroid = /Android/i.test(navigator.userAgent);
  if (!isAndroid) return null;
  const storeUrl = 'https://play.google.com/store/apps/details?id=com.jes.social&hl=it';

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
      background: '#fff', borderTop: '1px solid #F0F0F0',
      boxShadow: '0 -4px 20px rgba(0,0,0,0.10)',
      padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12,
    }}>
      {/* App icon */}
      <img src="/icon.png" alt="JES" style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0 }} />

      {/* Testo */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: '#111', lineHeight: 1.3 }}>
          Scarica l&apos;app JES Social
        </div>
        <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#888', marginTop: 2 }}>
          L&apos;esperienza migliore è sull&apos;app
        </div>
      </div>

      {/* Bottone scarica */}
      <a href={storeUrl} target="_blank" rel="noopener noreferrer"
        style={{
          background: '#F07B1D', color: '#fff', borderRadius: 20,
          padding: '8px 16px', fontFamily: 'var(--font-body)', fontWeight: 700,
          fontSize: 13, textDecoration: 'none', flexShrink: 0, whiteSpace: 'nowrap',
        }}>
        Scarica
      </a>

      {/* X chiudi */}
      <button onClick={dismiss} style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: 4,
        color: '#AAAAAA', flexShrink: 0, display: 'flex', alignItems: 'center',
      }}>
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M18 6L6 18M6 6l12 12"/>
        </svg>
      </button>
    </div>
  );
}
