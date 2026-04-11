'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpdate = async () => {
    if (loading) return;
    if (password.length < 6) { setError('La password deve essere di almeno 6 caratteri.'); return; }
    if (password !== confirm) { setError('Le password non corrispondono.'); return; }
    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (err) { setError(err.message); }
    else { router.replace('/home'); }
  };

  return (
    <div className="shell form-page">
      <div className="form-top">
        <button className="back-btn" onClick={() => router.back()}>
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
      </div>

      <div className="form-scroll">
        <h1 className="form-title">Nuova password</h1>
        <p className="form-subtitle">Scegli una nuova password per il tuo account. Deve essere di almeno 6 caratteri.</p>

        <div className="input-group">
          <label className="input-label">Nuova password</label>
          <input className="input-field" type="password" placeholder="Almeno 6 caratteri" value={password} onChange={e => setPassword(e.target.value)} autoComplete="new-password" />
        </div>

        <div className="input-group" style={{ marginBottom: 32 }}>
          <label className="input-label">Conferma password</label>
          <input className="input-field" type="password" placeholder="Ripeti la password" value={confirm} onChange={e => setConfirm(e.target.value)} autoComplete="new-password" onKeyDown={e => e.key === 'Enter' && handleUpdate()} />
        </div>

        {error && <p className="error-text" style={{ marginBottom: 16 }}>{error}</p>}

        <button className="btn-primary" onClick={handleUpdate} disabled={loading}>
          {loading ? <span className="spin" /> : 'Aggiorna password'}
        </button>
      </div>
    </div>
  );
}
