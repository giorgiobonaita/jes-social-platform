'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useLang, LANGUAGES } from '@/lib/i18n';

const ORANGE = '#F07B1D';

export default function SettingsPage() {
  const router = useRouter();
  const { t, lang, setLang } = useLang();
  const [screen, setScreen] = useState<null | 'lingua' | 'notifiche'>(null);
  const [myRole, setMyRole] = useState<string | null>(null);
  const [myUsername, setMyUsername] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  // Notification toggles
  const [notifLike,      setNotifLike]      = useState(true);
  const [notifFollower,  setNotifFollower]  = useState(true);
  const [notifMessaggi,  setNotifMessaggi]  = useState(true);
  const [notifStorie,    setNotifStorie]    = useState(true);
  const [notifMenzioni,  setNotifMenzioni]  = useState(true);

  // Delete account modal
  const [deleteModal,   setDeleteModal]   = useState(false);
  const [deleting,      setDeleting]      = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) { router.replace('/'); return; }
      const { data } = await supabase.from('users').select('role, username').eq('auth_id', user.id).single();
      setMyRole(data?.role ?? null);
      setMyUsername(data?.username ?? null);
      setReady(true);
    });
  }, [router]);

  const handleSignOut = async () => {
    if (!confirm(t('profile_logout_confirm'))) return;
    await supabase.auth.signOut();
    router.replace('/');
  };

  const handleDeleteAccount = () => setDeleteModal(true);

  const confirmDelete = async () => {
    setDeleting(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await fetch('https://jessocial.com/api/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
    }
    await supabase.auth.signOut();
    setDeleting(false);
    setDeleteModal(false);
    router.replace('/');
  };

  if (!ready) return <div style={{ minHeight: '100dvh', background: '#fff' }} />;

  const backBtn = (
    <button onClick={() => { if (screen) { setScreen(null); } else { router.back(); } }}
      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#111', display: 'flex', alignItems: 'center', padding: 0 }}>
      <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
    </button>
  );

  const title = screen === 'notifiche' ? t('notifications') : screen === 'lingua' ? t('language') : t('settings');

  return (
    <div style={{ minHeight: '100dvh', background: '#fff', display: 'flex', flexDirection: 'column', fontFamily: 'var(--font-body)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #F0F0F0', position: 'sticky', top: 0, background: '#fff', zIndex: 10 }}>
        {backBtn}
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: '#111' }}>{title}</span>
        <div style={{ width: 26 }} />
      </div>

      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 40 }}>
        {screen === 'lingua' ? (
          LANGUAGES.map(l => (
            <div key={l.code} onClick={() => setLang(l.code)}
              style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #F8F8F8', cursor: 'pointer', background: lang === l.code ? '#FFF8F2' : '#fff' }}>
              <span style={{ fontSize: 28, marginRight: 14 }}>{l.flag}</span>
              <span style={{ flex: 1, fontWeight: 500, fontSize: 15, color: lang === l.code ? ORANGE : '#111' }}>{l.name}</span>
              {lang === l.code && <svg width="20" height="20" fill="none" stroke={ORANGE} strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12l5 5L19 7"/></svg>}
            </div>
          ))
        ) : screen === 'notifiche' ? (
          <>
            <p style={{ fontWeight: 600, fontSize: 11, color: '#AAA', letterSpacing: '0.8px', padding: '20px 20px 6px', textTransform: 'uppercase' }}>{t('push_notif_label')}</p>
            {[
              { label: t('setting_notif_likes'),     value: notifLike,      setter: setNotifLike },
              { label: t('setting_notif_followers'),  value: notifFollower,  setter: setNotifFollower },
              { label: t('setting_notif_messages'),   value: notifMessaggi,  setter: setNotifMessaggi },
              { label: t('setting_notif_stories'),    value: notifStorie,    setter: setNotifStorie },
              { label: t('setting_notif_mentions'),   value: notifMenzioni,  setter: setNotifMenzioni },
            ].map(row => (
              <div key={row.label} style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #F8F8F8' }}>
                <span style={{ flex: 1, fontWeight: 500, fontSize: 15, color: '#111' }}>{row.label}</span>
                <div onClick={() => row.setter(v => !v)}
                  style={{ width: 50, height: 28, borderRadius: 14, background: row.value ? ORANGE : '#E0E0E0', cursor: 'pointer', position: 'relative', transition: 'background .2s', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 3, left: row.value ? 24 : 3, width: 22, height: 22, borderRadius: '50%', background: '#fff', transition: 'left .2s', boxShadow: '0 1px 4px rgba(0,0,0,.2)' }} />
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            {/* Main settings items */}
            {[
              { icon: <svg width="20" height="20" fill="none" stroke={ORANGE} strokeWidth="1.8" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>, label: t('edit_profile'), action: () => router.push(myUsername ? `/profile/${myUsername}?edit=1` : '/home') },
              { icon: <svg width="20" height="20" fill="none" stroke={ORANGE} strokeWidth="1.8" viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>, label: t('notifications'), action: () => setScreen('notifiche') },
              { icon: <svg width="20" height="20" fill="none" stroke={ORANGE} strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>, label: t('language'), action: () => setScreen('lingua'), right: LANGUAGES.find(l => l.code === lang)?.flag },
              { icon: <svg width="20" height="20" fill="none" stroke={ORANGE} strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>, label: t('support'), action: () => { window.location.href = 'mailto:jes.socialdellemozioni@gmail.com'; } },
              { icon: <svg width="20" height="20" fill="none" stroke={ORANGE} strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>, label: `${t('terms_service')} & ${t('terms_privacy')}`, action: () => router.push('/legal/termini') },
            ].map(item => (
              <div key={item.label} onClick={item.action}
                style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #F8F8F8', cursor: 'pointer' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: '#FFF0E6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>{item.icon}</div>
                <span style={{ flex: 1, fontWeight: 500, fontSize: 15, color: '#111' }}>{item.label}</span>
                {item.right && <span style={{ fontSize: 20, marginRight: 8 }}>{item.right}</span>}
                <svg width="18" height="18" fill="none" stroke="#CCC" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            ))}

            {/* Admin */}
            {myRole === 'admin' && (
              <div onClick={() => router.push('/admin')}
                style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #F8F8F8', cursor: 'pointer' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: '#FFF0E6', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                  <svg width="20" height="20" fill="none" stroke={ORANGE} strokeWidth="1.8" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <span style={{ flex: 1, fontWeight: 500, fontSize: 15, color: '#111' }}>{t('admin_panel')}</span>
                <svg width="18" height="18" fill="none" stroke="#CCC" strokeWidth="2" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            )}

            {/* Logout / Delete */}
            <div style={{ marginTop: 20 }}>
              <div onClick={handleSignOut}
                style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #F8F8F8', cursor: 'pointer' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: '#FFF0EE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                  <svg width="20" height="20" fill="none" stroke="#FF3B30" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                </div>
                <span style={{ flex: 1, fontWeight: 500, fontSize: 15, color: '#FF3B30' }}>{t('logout')}</span>
              </div>
              <div onClick={handleDeleteAccount}
                style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', cursor: 'pointer' }}>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: '#FFF0EE', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 14 }}>
                  <svg width="20" height="20" fill="none" stroke="#FF3B30" strokeWidth="1.8" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                </div>
                <span style={{ flex: 1, fontWeight: 500, fontSize: 15, color: '#FF3B30' }}>{t('delete_account')}</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delete account modal */}
      {deleteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setDeleteModal(false)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 400 }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 800, color: '#111' }}>Elimina account</h3>
            <p style={{ margin: '0 0 20px', fontSize: 13, color: '#888' }}>Questa azione è irreversibile. Tutti i tuoi dati, post e follower verranno cancellati permanentemente.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeleteModal(false)}
                style={{ flex: 1, background: '#F5F5F5', color: '#888', border: 'none', borderRadius: 12, padding: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                Annulla
              </button>
              <button onClick={confirmDelete} disabled={deleting}
                style={{ flex: 1, background: '#FF3B30', color: '#fff', border: 'none', borderRadius: 12, padding: 12, fontWeight: 700, fontSize: 14, cursor: deleting ? 'not-allowed' : 'pointer' }}>
                {deleting ? 'Eliminazione…' : 'Elimina account'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
