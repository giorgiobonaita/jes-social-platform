'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

function formatAgo(d: string): string {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'ora'; if (m < 60) return `${m} min`; const h = Math.floor(m / 60);
  if (h < 24) return `${h} h`; return `${Math.floor(h / 24)} g`;
}

interface Props { visible: boolean; onClose: () => void; }

export default function NotificationsModal({ visible, onClose }: Props) {
  const [notifs, setNotifs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible) return;
    (async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }
      const { data: dbUser } = await supabase.from('users').select('id').eq('auth_id', user.id).single();
      if (!dbUser) { setLoading(false); return; }
      const { data } = await supabase.from('notifications')
        .select('*').eq('user_id', dbUser.id).order('created_at', { ascending: false }).limit(50);
      setNotifs(data || []);
      await supabase.from('notifications').update({ read: true }).eq('user_id', dbUser.id).eq('read', false);
      setLoading(false);
    })();
  }, [visible]);

  const typeLabel: Record<string, string> = {
    like: 'ha messo Mi piace al tuo post',
    comment: 'ha commentato il tuo post',
    follow: 'ha iniziato a seguirti',
    mention: 'ti ha menzionato',
  };

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" style={{ maxHeight: '85dvh', display: 'flex', flexDirection: 'column', paddingBottom: 0 }} onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-header" style={{ padding: '0 20px 12px', borderBottom: '1px solid #EEE' }}>
          <span className="modal-title">Notifiche</span>
          <button className="modal-close" onClick={onClose}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 32px' }}>
          {loading ? (
            <div className="spinner"><div className="spin" /></div>
          ) : notifs.length === 0 ? (
            <p className="empty-text">Nessuna notifica</p>
          ) : (
            notifs.map(n => (
              <div key={n.id} className="notif-row" style={{ background: n.read ? 'transparent' : '#FFF4EB', borderRadius: 12, padding: '10px 8px', marginBottom: 4 }}>
                <div className="avatar" style={{ width: 40, height: 40, flexShrink: 0 }}>
                  <svg width="20" height="20" fill="#CCC" viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
                </div>
                <div className="notif-text">
                  <div style={{ fontWeight: 700, color: '#111' }}>{typeLabel[n.type] || n.type}</div>
                  <div className="notif-time">{formatAgo(n.created_at)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
