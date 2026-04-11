'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleReset = async () => {
    if (!email || loading || sent) return;
    setLoading(true);
    const redirectTo = typeof window !== 'undefined'
      ? `${window.location.origin}/reset-password`
      : '/reset-password';
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo });
    if (err) { setError('Errore: ' + err.message); } else { setSent(true); }
    setLoading(false);
  };

  return (
    <div className="shell form-page">
      <div className="form-top">
        <button className="back-btn" onClick={() => router.back()}>
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
      </div>

      <div className="form-scroll">
        <h1 className="form-title">{sent ? 'Email Inviata' : 'Reset password'}</h1>
        <p className="form-subtitle">
          {sent
            ? 'Controlla la tua posta in arrivo. Ti abbiamo inviato un link per ripristinare la password.'
            : "Inserisci l'indirizzo email associato al tuo account e ti invieremo un link per reimpostare la password."}
        </p>

        {!sent && (
          <>
            <div className="input-group" style={{ marginBottom: 32 }}>
              <label className="input-label">Email address</label>
              <input
                className="input-field"
                type="email" placeholder="La tua email"
                value={email} onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleReset()}
                autoComplete="email"
              />
            </div>
            {error && <p className="error-text" style={{ marginBottom: 16 }}>{error}</p>}
            <button
              className="btn-primary"
              onClick={handleReset}
              disabled={!email || loading}
            >
              {loading ? <span className="spin" /> : 'Invia link'}
            </button>
          </>
        )}

        {sent && (
          <button className="btn-primary" style={{ background: '#4CD964' }} onClick={() => router.push('/login')}>
            Torna al login
          </button>
        )}
      </div>
    </div>
  );
}
