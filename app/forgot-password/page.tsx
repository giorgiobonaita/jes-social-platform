'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/lib/i18n';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const { t } = useLang();
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
    if (err) { setError(t('fp_error_prefix') + err.message); } else { setSent(true); }
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
        <h1 className="form-title">{sent ? t('fp_title_sent') : t('fp_title')}</h1>
        <p className="form-subtitle">
          {sent ? t('fp_sent_msg') : t('fp_intro')}
        </p>

        {!sent && (
          <>
            <div className="input-group" style={{ marginBottom: 32 }}>
              <label className="input-label">{t('email_label')}</label>
              <input
                className="input-field"
                type="email" placeholder={t('email_placeholder')}
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
              {loading ? <span className="spin" /> : t('fp_send_link')}
            </button>
          </>
        )}

        {sent && (
          <button className="btn-primary" style={{ background: '#4CD964' }} onClick={() => router.push('/login')}>
            {t('fp_back_login')}
          </button>
        )}
      </div>
    </div>
  );
}
