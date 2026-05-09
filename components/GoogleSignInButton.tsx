'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function GoogleSignInButton({ label = 'Accedi con Google' }: { label?: string }) {
  const [loading, setLoading] = useState(false);

  const handleGoogle = async () => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { alert('Errore Google: ' + error.message); setLoading(false); return; }
    if (data?.url) window.location.href = data.url;
    setLoading(false);
  };

  return (
    <button onClick={handleGoogle} disabled={loading} style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
      height: 58, borderRadius: 14, width: '100%', border: '2px solid #F07B1D',
      background: '#F07B1D', cursor: loading ? 'not-allowed' : 'pointer',
      fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700, color: '#fff',
      transition: 'opacity .15s, transform .1s', opacity: loading ? 0.6 : 1,
    }}
    onMouseDown={e => (e.currentTarget.style.transform = 'scale(0.97)')}
    onMouseUp={e => (e.currentTarget.style.transform = 'scale(1)')}
    onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
    >
      <svg width="20" height="20" viewBox="0 0 48 48">
        <path fill="#fff" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
        <path fill="#fff" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
        <path fill="#fff" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
        <path fill="#fff" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      </svg>
      {loading ? 'Caricamento...' : label}
    </button>
  );
}
