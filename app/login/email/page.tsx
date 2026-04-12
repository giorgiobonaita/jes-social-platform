'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/lib/i18n';

export default function EmailLoginPage() {
  const router = useRouter();
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isReady = email.trim().length > 0 && password.trim().length > 0;

  const handleLogin = async () => {
    if (!isReady || loading) return;
    setLoading(true);
    setError('');
    try {
      const { error: authError, data } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) { setError(t('wrong_credentials')); return; }

      const { data: userData } = await supabase
        .from('users').select('is_banned').eq('auth_id', data.user.id).maybeSingle();
      if (userData?.is_banned) {
        await supabase.auth.signOut();
        setError(t('account_suspended'));
        return;
      }
      router.replace('/home');
    } catch {
      setError(t('error_generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shell form-page">
      <div className="form-top">
        <button className="back-btn" onClick={() => router.back()}>
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
      </div>

      <div className="form-scroll">
        <h1 className="form-title">{t('login_title')}</h1>

        <div className="input-group">
          <label className="input-label">{t('email_label')}</label>
          <input
            className="input-field"
            type="email" placeholder={t('email_placeholder')}
            value={email} onChange={e => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>

        <div className="input-group">
          <label className="input-label">{t('password_label')}</label>
          <input
            className="input-field"
            type="password" placeholder={t('password_placeholder')}
            value={password} onChange={e => setPassword(e.target.value)}
            autoComplete="current-password"
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
          />
        </div>

        <button className="forgot-link" onClick={() => router.push('/forgot-password')}>
          {t('forgot_password')}
        </button>

        {error && <p className="error-text" style={{ marginBottom: 16 }}>{error}</p>}

        <button className="btn-primary" onClick={handleLogin} disabled={!isReady || loading}>
          {loading ? <span className="spin" /> : t('login_title')}
        </button>
      </div>
    </div>
  );
}
