'use client';
import { useState, useEffect } from 'react';
import Image from 'next/image';

const LABELS: Record<string, [string, string]> = {
  it: ['Nessuna connessione', 'Connettiti a una rete Wi-Fi o dati mobili per continuare.'],
  en: ['No Connection',       'Connect to Wi-Fi or mobile data to continue.'],
  es: ['Sin conexión',        'Conéctate a una red Wi-Fi o datos móviles para continuar.'],
  fr: ['Pas de connexion',    'Connecte-toi à un réseau Wi-Fi ou aux données mobiles pour continuer.'],
  de: ['Keine Verbindung',    'Verbinde dich mit WLAN oder mobilen Daten, um fortzufahren.'],
  pt: ['Sem conexão',         'Conecte-se a uma rede Wi-Fi ou dados móveis para continuar.'],
  ja: ['接続なし',              'Wi-Fiまたはモバイルデータに接続してください。'],
  zh: ['无网络连接',             '请连接Wi-Fi或移动数据后继续。'],
  ar: ['لا يوجد اتصال',       'اتصل بشبكة Wi-Fi أو بيانات الجوال للمتابعة.'],
  ru: ['Нет соединения',      'Подключитесь к Wi-Fi или мобильным данным, чтобы продолжить.'],
  ko: ['연결 없음',             'Wi-Fi 또는 모바일 데이터에 연결하세요.'],
};

function getLang(): string {
  try {
    const stored = localStorage.getItem('jes_lang');
    if (stored && LABELS[stored]) return stored;
    const browser = navigator.language.split('-')[0];
    if (LABELS[browser]) return browser;
  } catch {}
  return 'it';
}

export default function OfflineScreen() {
  const [offline, setOffline] = useState(false);
  const [lang, setLang] = useState('it');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setLang(getLang());
    setOffline(!navigator.onLine);

    const goOffline = () => setOffline(true);
    const goOnline  = () => setOffline(false);
    window.addEventListener('offline', goOffline);
    window.addEventListener('online',  goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online',  goOnline);
    };
  }, []);

  if (!mounted || !offline) return null;

  const [title, subtitle] = LABELS[lang] ?? LABELS['it'];
  const isRtl = lang === 'ar';

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 99999,
      background: '#F2F2F7',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '0 32px',
      direction: isRtl ? 'rtl' : 'ltr',
    }}>
      {/* Logo */}
      <Image src="/logo.png" alt="JES" width={64} height={64}
        style={{ objectFit: 'contain', marginBottom: 32, borderRadius: 16 }} />

      {/* Wi-Fi off icon — Apple SF style */}
      <div style={{
        width: 80, height: 80, borderRadius: 20,
        background: '#fff',
        boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 32,
      }}>
        <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
          {/* Wifi arcs, greyed */}
          <path d="M6 19C10.4 14.5 16.4 12 22 12c5.6 0 11.6 2.5 16 7" stroke="#C7C7CC" strokeWidth="2.8" strokeLinecap="round"/>
          <path d="M10.5 23.5C13.8 20.2 17.8 18.5 22 18.5c4.2 0 8.2 1.7 11.5 5" stroke="#C7C7CC" strokeWidth="2.8" strokeLinecap="round"/>
          <path d="M15.5 28C17.4 26.1 19.6 25 22 25c2.4 0 4.6 1.1 6.5 3" stroke="#C7C7CC" strokeWidth="2.8" strokeLinecap="round"/>
          {/* Dot */}
          <circle cx="22" cy="34" r="2.5" fill="#C7C7CC"/>
          {/* Red X slash */}
          <line x1="8" y1="8" x2="36" y2="36" stroke="#FF3B30" strokeWidth="2.8" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Title */}
      <div style={{
        fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
        fontWeight: 700, fontSize: 22, color: '#1C1C1E',
        textAlign: 'center', marginBottom: 10, letterSpacing: -0.3,
      }}>
        {title}
      </div>

      {/* Subtitle */}
      <div style={{
        fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif",
        fontWeight: 400, fontSize: 15, color: '#6E6E73',
        textAlign: 'center', lineHeight: 1.5, maxWidth: 280,
      }}>
        {subtitle}
      </div>
    </div>
  );
}
