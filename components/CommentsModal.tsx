'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { containsBlacklistedWord } from '@/lib/blacklist';
import AvatarImg from './AvatarImg';
import { useLang } from '@/lib/i18n';

const ORANGE = '#F07B1D';

interface Comment {
  id: string; username: string; avatarUrl: string | null;
  text: string; timeAgo: string; userId: string;
}

interface Props {
  visible: boolean; onClose: () => void;
  postId: string | null; postAuthorId?: string | null;
}

export default function CommentsModal({ visible, onClose, postId, postAuthorId }: Props) {
  const { t } = useLang();
  const [comments, setComments]               = useState<Comment[]>([]);
  const [inputText, setInputText]             = useState('');
  const [loading, setLoading]                 = useState(false);
  const [currentAvatar, setCurrentAvatar]     = useState<string | null>(null);
  const [currentDbUserId, setCurrentDbUserId] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState('');
  const listRef  = useRef<HTMLDivElement>(null);

  const formatTimeAgo = useCallback((isoDate: string): string => {
    const diff = Date.now() - new Date(isoDate).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return t('notif_now');
    if (m < 60) return `${m} min`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} h`;
    return `${Math.floor(h / 24)} g`;
  }, [t]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => { if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight; }, 80);
  }, []);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('users').select('id, avatar_url, username').eq('auth_id', user.id).single();
      if (data) { setCurrentDbUserId(data.id); setCurrentAvatar(data.avatar_url ?? null); setCurrentUsername(data.username || t('me_label')); }
    })();
  }, [t]);

  useEffect(() => {
    if (!postId || !visible) return;
    setLoading(true);
    (async () => {
      try {
        const { data: rows, error } = await supabase
          .from('comments').select('id, text, created_at, user_id')
          .eq('post_id', postId).order('created_at', { ascending: true }).limit(80);
        if (error || !rows) return;
        const userIds = [...new Set(rows.map((c: any) => c.user_id).filter(Boolean))];
        const userMap: Record<string, any> = {};
        if (userIds.length > 0) {
          const { data: users } = await supabase.from('users').select('id, username, avatar_url').in('id', userIds);
          (users || []).forEach((u: any) => { userMap[u.id] = u; });
        }
        setComments(rows.map((c: any) => ({
          id: c.id, username: userMap[c.user_id]?.username || t('role_user_title'),
          avatarUrl: userMap[c.user_id]?.avatar_url ?? null,
          text: c.text || '', timeAgo: formatTimeAgo(c.created_at), userId: c.user_id,
        })));
      } finally { setLoading(false); scrollToBottom(); }
    })();
  }, [postId, visible, scrollToBottom, t, formatTimeAgo]);

  useEffect(() => { if (!loading && comments.length > 0) scrollToBottom(); }, [loading, comments.length, scrollToBottom]);

  useEffect(() => {
    if (!postId || !visible) return;
    const channel = supabase.channel(`comments_post_${postId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` },
        async (payload) => {
          const c = payload.new as any;
          if (c.user_id === currentDbUserId) return;
          const { data: u } = await supabase.from('users').select('username, avatar_url').eq('id', c.user_id).single();
          setComments(prev => [...prev, { id: c.id, username: u?.username || t('role_user_title'), avatarUrl: u?.avatar_url ?? null, text: c.text || '', timeAgo: t('notif_now'), userId: c.user_id }]);
          scrollToBottom();
        })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [postId, visible, currentDbUserId, scrollToBottom, t]);

  const sendComment = async () => {
    const text = inputText.trim();
    if (!text || !postId || !currentDbUserId) return;
    const blocked = await containsBlacklistedWord(text);
    if (blocked) { alert(`${t('word_not_allowed')}: "${blocked}".`); return; }
    setInputText('');
    const tempId = `temp_${Date.now()}`;
    setComments(prev => [...prev, { id: tempId, username: currentUsername, avatarUrl: currentAvatar, text, timeAgo: t('notif_now'), userId: currentDbUserId }]);
    scrollToBottom();
    const { error } = await supabase.from('comments').insert({ post_id: postId, user_id: currentDbUserId, text });
    if (error) { setComments(prev => prev.filter(c => c.id !== tempId)); return; }
    if (postAuthorId && postAuthorId !== currentDbUserId) {
      supabase.from('notifications').insert({ user_id: postAuthorId, actor_id: currentDbUserId, type: 'comment', post_id: postId }).then(() => {});
    }
  };

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet"
        style={{ height: '75dvh', display: 'flex', flexDirection: 'column', padding: 0, borderRadius: '24px 24px 0 0' }}
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '8px 16px 12px', borderBottom: '1px solid #EFEFEF', backgroundColor: '#fff', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '24px 24px 0 0' }}>
          <div style={{ position: 'absolute', top: 8, left: '50%', transform: 'translateX(-50%)', width: 36, height: 4, borderRadius: 2, background: '#D8D8D8' }} />
          <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15, color: '#111', marginTop: 14 }}>{t('comments_title')}</span>
          <button onClick={onClose} style={{ position: 'absolute', right: 16, bottom: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#111', display: 'flex', alignItems: 'center' }}>
            <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Comment list */}
        <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: 12, backgroundColor: '#F7F7F7' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}><div className="spin" /></div>
          ) : comments.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 60, gap: 10 }}>
              <svg width="36" height="36" fill="none" stroke="#DDD" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: '#111' }}>{t('no_comments')}</span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#AAAAAA' }}>{t('no_comments_sub')}</span>
            </div>
          ) : (
            comments.map((item, index) => {
              const mine = item.userId === currentDbUserId;
              const prev = comments[index - 1];
              const showAvatar = !mine && (!prev || prev.userId !== item.userId);
              const showName   = !mine && (!prev || prev.userId !== item.userId);
              return (
                <div key={item.id} style={{ display: 'flex', flexDirection: 'row', marginBottom: 4, alignItems: 'flex-end', justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                  {!mine && (
                    <div style={{ marginRight: 6, marginBottom: 2, alignSelf: 'flex-end' }}>
                      {showAvatar ? <AvatarImg uri={item.avatarUrl} size={32} seed={item.username} /> : <div style={{ width: 32 }} />}
                    </div>
                  )}
                  <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start' }}>
                    {showName && (
                      <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11, color: '#888', marginBottom: 3, marginLeft: 4 }}>{item.username}</span>
                    )}
                    <div style={{ borderRadius: 18, borderBottomRightRadius: mine ? 4 : 18, borderBottomLeftRadius: mine ? 18 : 4, paddingLeft: 14, paddingRight: 14, paddingTop: 9, paddingBottom: 9, backgroundColor: mine ? ORANGE : '#fff', boxShadow: mine ? 'none' : '0 1px 3px rgba(0,0,0,0.05)' }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: mine ? '#fff' : '#111', lineHeight: '20px' }}>{item.text}</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: '#AAAAAA', marginTop: 3, marginLeft: mine ? 0 : 4, marginRight: mine ? 4 : 0, textAlign: mine ? 'right' : 'left' }}>{item.timeAgo}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Input bar */}
        <div style={{ display: 'flex', alignItems: 'flex-end', padding: '10px 12px 16px', gap: 8, borderTop: '1px solid #EFEFEF', backgroundColor: '#fff' }}>
          <AvatarImg uri={currentAvatar} size={34} seed={currentUsername} />
          <textarea
            style={{ flex: 1, backgroundColor: '#F5F5F5', borderRadius: 22, padding: '9px 14px', fontFamily: 'var(--font-body)', fontSize: 14, color: '#111', border: 'none', outline: 'none', resize: 'none', maxHeight: 100, lineHeight: '20px' }}
            placeholder={t('write_comment')}
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            rows={1}
            maxLength={500}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendComment(); } }}
          />
          <button onClick={sendComment} disabled={!inputText.trim()}
            style={{ width: 38, height: 38, borderRadius: '50%', backgroundColor: inputText.trim() ? ORANGE : '#D0D0D0', border: 'none', cursor: inputText.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .15s' }}>
            <svg width="20" height="20" fill="white" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
