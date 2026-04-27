'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/lib/i18n';

export default function ResetPasswordPage() {
  const router = useRouter();
  const { t } = useLang();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    // Supabase invia il token nell'URL hash — aspettiamo che venga rilevato
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      }
    });

    // Controlla se c'è già una sessione attiva (utente già autenticato via link)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleUpdate = async () => {
    if (loading) return;
    if (password.length < 6) { setError(t('rp_err_short')); return; }
    if (password !== confirm) { setError(t('rp_err_mismatch')); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) { setError(err.message); }
    else { setDone(true); setTimeout(() => router.replace('/home'), 2000); }
  };

  if (!ready) return (
    <div className="shell form-page" style={{ justifyContent: 'center', alignItems: 'center' }}>
      <div className="spin" />
      <p style={{ fontFamily: 'var(--font-body)', color: '#888', marginTop: 16, fontSize: 14 }}>
        Verifica del link in corso…
      </p>
    </div>
  );

  if (done) return (
    <div className="shell form-page" style={{ justifyContent: 'center', alignItems: 'center', textAlign: 'center', padding: '0 32px' }}>
      <svg width="56" height="56" fill="none" stroke="#34C759" strokeWidth="2" viewBox="0 0 24 24" style={{ marginBottom: 16 }}>
        <circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-5"/>
      </svg>
      <h2 style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 800, fontSize: 22, color: '#111', marginBottom: 8 }}>
        Password aggiornata!
      </h2>
      <p style={{ fontFamily: 'var(--font-body)', color: '#666', fontSize: 15 }}>
        Stai per essere reindirizzato…
      </p>
    </div>
  );

  return (
    <div className="shell form-page">
      <div className="form-top">
        <button className="back-btn" onClick={() => router.back()}>
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
      </div>

      <div className="form-scroll">
        <h1 className="form-title">{t('rp_title')}</h1>
        <p className="form-subtitle">{t('rp_subtitle')}</p>

        <div className="input-group">
          <label className="input-label">{t('rp_new_password')}</label>
          <input className="input-field" type="password" placeholder={t('rp_placeholder_new')} value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
        </div>

        <div className="input-group" style={{ marginBottom: 32 }}>
          <label className="input-label">{t('rp_confirm_password')}</label>
          <input className="input-field" type="password" placeholder={t('rp_placeholder_confirm')} value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" onKeyDown={e => e.key === 'Enter' && handleUpdate()} />
        </div>

        {error && <p className="error-text" style={{ marginBottom: 16 }}>{error}</p>}

        <button className="btn-primary" onClick={handleUpdate} disabled={loading}>
          {loading ? <span className="spin" /> : t('rp_update_btn')}
        </button>
      </div>
    </div>
  );
}
