'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Image from 'next/image';

export default function AccountSuspendedPage() {
  const router = useRouter();
  const [daysLeft, setDaysLeft] = useState<number | null>(null);
  const [reason, setReason] = useState('');
  const [appealText, setAppealText] = useState('');
  const [appealStatus, setAppealStatus] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const checkStatus = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace('/'); return; }
    const { data } = await supabase
      .from('users')
      .select('id, deletion_scheduled_at, deletion_reason, appeal_text, appeal_status')
      .eq('auth_id', user.id)
      .single();
    // Se l'admin ha approvato (deletion_scheduled_at rimosso), reindirizza alla home
    if (!data?.deletion_scheduled_at) { router.replace('/home'); return; }
    setUserId(data.id);
    setReason(data.deletion_reason || '');
    setAppealStatus(data.appeal_status || null);
    setSubmitted(!!data.appeal_text);
    if (!appealText) setAppealText(data.appeal_text || '');
    const days = Math.max(0, Math.ceil((new Date(data.deletion_scheduled_at).getTime() - Date.now()) / 86400000));
    setDaysLeft(days);
  };

  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  }, [router]);

  const submitAppeal = async () => {
    if (!appealText.trim() || !userId) return;
    setSending(true);
    await supabase.from('users').update({ appeal_text: appealText.trim(), appeal_status: 'pending' }).eq('id', userId);
    setSubmitted(true);
    setAppealStatus('pending');
    setSending(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/');
  };

  if (daysLeft === null) return <div style={{ minHeight: '100dvh', background: '#fff' }} />;

  return (
    <div style={{ minHeight: '100dvh', background: '#F5F5F5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 20px' }}>
      <div style={{ background: '#fff', borderRadius: 24, padding: '32px 24px', width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        <Image src="/logo.png" alt="JES" width={48} height={48} style={{ objectFit: 'contain' }} />
        <div style={{ textAlign: 'center' }}>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 800, color: '#111', margin: '0 0 6px' }}>
            Account sospeso
          </h1>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#888', margin: 0 }}>
            Il tuo account sarà cancellato definitivamente tra <strong style={{ color: '#FF3B30' }}>{daysLeft} giorni</strong>.
          </p>
        </div>

        {reason && (
          <div style={{ background: '#FFF3E0', borderRadius: 14, padding: '14px 16px', width: '100%' }}>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, fontWeight: 700, color: '#F07B1D', marginBottom: 6 }}>MOTIVAZIONE</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#444', lineHeight: 1.5 }}>{reason}</div>
          </div>
        )}

        {appealStatus === 'approved' ? (
          <div style={{ background: '#E8F5E9', borderRadius: 14, padding: '14px 16px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, color: '#34C759', fontSize: 14 }}>✓ Ricorso approvato</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#555', marginTop: 4 }}>Il tuo account è stato ripristinato.</div>
            <button onClick={() => router.replace('/home')} style={{ marginTop: 12, background: '#34C759', color: '#fff', border: 'none', borderRadius: 12, padding: '11px 24px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              Vai alla home
            </button>
          </div>
        ) : submitted ? (
          <div style={{ background: '#F0F5FE', borderRadius: 14, padding: '14px 16px', width: '100%', textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, color: '#3B82F6', fontSize: 14 }}>Ricorso inviato</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#555', marginTop: 4 }}>Il team JES esaminerà la tua richiesta entro i {daysLeft} giorni rimasti.</div>
          </div>
        ) : (
          <div style={{ width: '100%' }}>
            <label style={{ fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 8 }}>
              Vuoi fare ricorso? Spiega perché il tuo account dovrebbe essere ripristinato:
            </label>
            <textarea
              value={appealText}
              onChange={e => setAppealText(e.target.value)}
              placeholder="Scrivi qui la tua motivazione…"
              rows={4}
              style={{ width: '100%', border: '1.5px solid #EEE', borderRadius: 12, padding: '10px 14px', fontSize: 13, fontFamily: 'var(--font-body)', resize: 'none', outline: 'none', boxSizing: 'border-box' }}
            />
            <button onClick={submitAppeal} disabled={!appealText.trim() || sending}
              style={{ marginTop: 10, width: '100%', background: appealText.trim() ? '#F07B1D' : '#F0F0F0', color: appealText.trim() ? '#fff' : '#AAA', border: 'none', borderRadius: 12, padding: '13px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, cursor: appealText.trim() ? 'pointer' : 'not-allowed' }}>
              {sending ? 'Invio…' : 'Invia ricorso'}
            </button>
          </div>
        )}

        <button onClick={handleLogout} style={{ background: 'none', border: 'none', fontFamily: 'var(--font-body)', fontSize: 13, color: '#AAA', cursor: 'pointer', marginTop: 4 }}>
          Esci dall&apos;account
        </button>
      </div>
    </div>
  );
}
