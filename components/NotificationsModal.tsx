'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '@/lib/supabase';
import { useLang, T } from '@/lib/i18n';
import AvatarImg from './AvatarImg';

type NotifType = 'like' | 'comment' | 'follow' | 'mention';

interface Notification {
  id: string;
  type: NotifType;
  username: string;
  avatarUrl: string | null;
  text: string;
  timeAgo: string;
  postThumb?: string;
}

function formatTimeAgo(isoDate: string, tFn: (k: string) => string): string {
  const diff = Date.now() - new Date(isoDate).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1)  return tFn('notif_now');
  if (m < 60) return `${m} ${tFn('notif_mins_ago')}`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ${tFn('notif_hours_ago')}`;
  const d = Math.floor(h / 24);
  if (d === 1) return tFn('notif_yesterday');
  return `${d} ${tFn('notif_days_ago')}`;
}

function notifText(type: NotifType, tFn: (k: string) => string): string {
  switch (type) {
    case 'like':    return tFn('notif_like');
    case 'comment': return tFn('notif_comment');
    case 'follow':  return tFn('notif_follow');
    case 'mention': return tFn('notif_mention');
  }
}

const NOTIF_ICONS: Record<string, { icon: React.ReactElement; color: string; bg: string }> = {
  like: {
    icon: <svg width="11" height="11" fill="#F07B1D" viewBox="0 0 24 24"><path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/></svg>,
    color: '#F07B1D', bg: '#FFF0E6',
  },
  comment: {
    icon: <svg width="11" height="11" fill="#2196F3" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
    color: '#2196F3', bg: '#E8F4FD',
  },
  follow: {
    icon: <svg width="11" height="11" fill="#4CAF50" viewBox="0 0 24 24"><path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z"/></svg>,
    color: '#4CAF50', bg: '#E8F5E9',
  },
  mention: {
    icon: <svg width="11" height="11" fill="#9C27B0" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10h5v-2h-5c-4.34 0-8-3.66-8-8s3.66-8 8-8 8 3.66 8 8v1.43c0 .79-.71 1.57-1.5 1.57s-1.5-.78-1.5-1.57V12c0-2.76-2.24-5-5-5s-5 2.24-5 5 2.24 5 5 5c1.38 0 2.64-.56 3.54-1.47.65.89 1.77 1.47 2.96 1.47 1.97 0 3.5-1.6 3.5-3.57V12c0-5.52-4.48-10-10-10zm0 13c-1.66 0-3-1.34-3-3s1.34-3 3-3 3 1.34 3 3-1.34 3-3 3z"/></svg>,
    color: '#9C27B0', bg: '#F3E5F5',
  },
};
const NOTIF_ICON_FALLBACK: { icon: React.ReactElement; color: string; bg: string } = {
  icon: <svg width="11" height="11" fill="#888" viewBox="0 0 24 24"><path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/></svg>,
  color: '#888', bg: '#F0F0F0',
};

interface Props { visible: boolean; onClose: () => void; }

export default function NotificationsModal({ visible, onClose }: Props) {
  const { t, lang } = useLang();
  const tl = (k: string) => T[lang][k] ?? T['en'][k] ?? k;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading]             = useState(false);
  const [myDbId, setMyDbId]               = useState<string | null>(null);
  const [mounted, setMounted]             = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const loadNotifications = useCallback(async (dbUserId: string) => {
    const { data: notifs, error } = await supabase
      .from('notifications')
      .select('id, type, actor_id, post_id, created_at, read')
      .eq('user_id', dbUserId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error || !notifs || notifs.length === 0) return;

    const senderIds = [...new Set(notifs.map((n: any) => n.actor_id).filter(Boolean))];
    const { data: senders } = await supabase.from('users').select('id, username, avatar_url').in('id', senderIds as string[]);
    const senderMap: Record<string, any> = {};
    (senders || []).forEach((s: any) => { senderMap[s.id] = s; });

    const postIds = [...new Set(notifs.map((n: any) => n.post_id).filter(Boolean))];
    const postMap: Record<string, string> = {};
    if (postIds.length > 0) {
      const { data: posts } = await supabase.from('posts').select('id, image_url, image_urls').in('id', postIds as string[]);
      (posts || []).forEach((p: any) => {
        postMap[p.id] = (Array.isArray(p.image_urls) && p.image_urls[0]) || p.image_url || '';
      });
    }

    setNotifications(notifs.map((n: any) => {
      const sender = senderMap[n.actor_id] || {};
      return {
        id: n.id, type: n.type as NotifType,
        username: sender.username || tl('user_fallback'), avatarUrl: sender.avatar_url || null,
        text: notifText(n.type as NotifType, t),
        timeAgo: n.created_at ? formatTimeAgo(n.created_at, t) : '',
        postThumb: n.post_id ? postMap[n.post_id] : undefined,
      };
    }));

    const unreadIds = notifs.filter((n: any) => !n.read).map((n: any) => n.id);
    if (unreadIds.length > 0) {
      supabase.from('notifications').update({ read: true }).in('id', unreadIds).then(() => {});
    }
  }, []);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        let dbId = myDbId;
        if (!dbId) {
          const { data: dbUser } = await supabase.from('users').select('id').eq('auth_id', user.id).single();
          if (!dbUser) return;
          dbId = dbUser.id;
          setMyDbId(dbId);
        }
        await loadNotifications(dbId!);
      } finally { setLoading(false); }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  // Realtime
  useEffect(() => {
    if (!visible || !myDbId) return;
    const ch = supabase.channel(`notifs_modal_${myDbId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${myDbId}` },
        () => { loadNotifications(myDbId!); })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [visible, myDbId, loadNotifications]);

  if (!mounted || !visible) return null;

  const modal = (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 9999, backgroundColor: '#fff',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 20px', borderBottom: '1px solid #F0F0F0',
      }}>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: '#111' }}>
          {t('notifications')}
        </span>
        <button onClick={onClose} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          width: 36, height: 36, display: 'flex', alignItems: 'center',
          justifyContent: 'center', color: '#555', borderRadius: '50%',
        }}>
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', paddingTop: 8, paddingBottom: 32 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
            <div className="spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 60, gap: 10 }}>
            <svg width="48" height="48" fill="none" stroke="#DDD" strokeWidth="1.5" viewBox="0 0 24 24">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#AAAAAA' }}>{t('no_notifications')}</span>
          </div>
        ) : (
          notifications.map(item => {
            const ic = NOTIF_ICONS[item.type] ?? NOTIF_ICON_FALLBACK;
            return (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'flex-start',
                padding: '14px 20px', borderBottom: '1px solid #F8F8F8', gap: 12,
              }}>
                {/* Avatar + badge */}
                <div style={{ position: 'relative', width: 48, height: 48, flexShrink: 0 }}>
                  <AvatarImg uri={item.avatarUrl} size={48} seed={item.username} />
                  <div style={{
                    position: 'absolute', bottom: -2, right: -2,
                    width: 20, height: 20, borderRadius: 10,
                    backgroundColor: ic.bg, border: '1.5px solid #fff',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {ic.icon}
                  </div>
                </div>
                {/* Testo */}
                <div style={{ flex: 1 }}>
                  <span style={{
                    fontFamily: 'var(--font-body)', fontSize: 13,
                    color: '#333', lineHeight: '19px', display: 'block', marginBottom: 4,
                  }}>
                    <strong style={{ fontWeight: 600, color: '#111' }}>{item.username} </strong>
                    {item.text}
                  </span>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#AAAAAA' }}>
                    {item.timeAgo}
                  </span>
                </div>
                {/* Miniatura post */}
                {item.postThumb ? (
                  <img
                    src={item.postThumb}
                    style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover', flexShrink: 0, backgroundColor: '#EEE' }}
                    alt=""
                  />
                ) : (
                  <div style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: '#EEE', flexShrink: 0 }} />
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}
