'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface Comment {
  id: string; username: string; avatarUrl: string | null;
  text: string; timeAgo: string; userId: string;
}

function formatTimeAgo(d: string): string {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'ora';
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} h`;
  return `${Math.floor(h / 24)} g`;
}

interface Props {
  visible: boolean; onClose: () => void;
  postId: string | null; postAuthorId?: string | null;
}

export default function CommentsModal({ visible, onClose, postId, postAuthorId }: Props) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentDbUserId, setCurrentDbUserId] = useState<string | null>(null);
  const [currentAvatar, setCurrentAvatar] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState('tu');
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('users').select('id, avatar_url, username').eq('auth_id', user.id).single();
      if (data) { setCurrentDbUserId(data.id); setCurrentAvatar(data.avatar_url ?? null); setCurrentUsername(data.username || 'tu'); }
    })();
  }, []);

  useEffect(() => {
    if (!postId || !visible) return;
    setLoading(true);
    (async () => {
      try {
        const { data: rows, error } = await supabase.from('comments').select('id, text, created_at, user_id').eq('post_id', postId).order('created_at', { ascending: true }).limit(80);
        if (error || !rows) return;
        const userIds = [...new Set(rows.map((c: any) => c.user_id).filter(Boolean))];
        const userMap: Record<string, any> = {};
        if (userIds.length > 0) {
          const { data: users } = await supabase.from('users').select('id, username, avatar_url').in('id', userIds);
          (users || []).forEach((u: any) => { userMap[u.id] = u; });
        }
        setComments(rows.map((c: any) => ({
          id: c.id, username: userMap[c.user_id]?.username || 'utente',
          avatarUrl: userMap[c.user_id]?.avatar_url ?? null,
          text: c.text || '', timeAgo: formatTimeAgo(c.created_at), userId: c.user_id,
        })));
      } finally { setLoading(false); }
    })();
  }, [postId, visible]);

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [comments]);

  const sendComment = async () => {
    const t = text.trim();
    if (!t || !postId || !currentDbUserId) return;
    setText('');
    const tempId = `temp_${Date.now()}`;
    setComments(prev => [...prev, { id: tempId, username: currentUsername, avatarUrl: currentAvatar, text: t, timeAgo: 'ora', userId: currentDbUserId }]);
    const { error } = await supabase.from('comments').insert({ post_id: postId, user_id: currentDbUserId, text: t });
    if (error) { setComments(prev => prev.filter(c => c.id !== tempId)); return; }
    if (postAuthorId && postAuthorId !== currentDbUserId) {
      supabase.from('notifications').insert({ user_id: postAuthorId, actor_id: currentDbUserId, type: 'comment', post_id: postId }).then(() => {});
    }
  };

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" style={{ maxHeight: '80dvh', display: 'flex', flexDirection: 'column', paddingBottom: 0 }}
        onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-header" style={{ padding: '0 20px 12px', borderBottom: '1px solid #EEEEEE' }}>
          <span className="modal-title" style={{ fontSize: 17 }}>Commenti</span>
          <button className="modal-close" onClick={onClose}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 4, background: '#F7F7F7', minHeight: 200 }}>
          {loading ? (
            <div className="spinner"><div className="spin" /></div>
          ) : comments.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 15, color: '#111', fontWeight: 700, marginBottom: 6 }}>Nessun commento</p>
              <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#AAAAAA' }}>Sii il primo a condividere il tuo pensiero.</p>
            </div>
          ) : (
            comments.map((c, i) => {
              const mine = c.userId === currentDbUserId;
              const prev = comments[i - 1];
              const showName = !mine && (!prev || prev.userId !== c.userId);
              return (
                <div key={c.id} style={{ display: 'flex', justifyContent: mine ? 'flex-end' : 'flex-start', alignItems: 'flex-end', gap: 6, marginBottom: 4 }}>
                  {!mine && (
                    <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', background: '#EEE', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {c.avatarUrl
                        ? <img src={c.avatarUrl} alt={c.username} width={32} height={32} style={{ objectFit: 'cover', borderRadius: '50%' }} />
                        : <svg width="16" height="16" fill="#CCC" viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
                      }
                    </div>
                  )}
                  <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start' }}>
                    {showName && <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#888', marginBottom: 3, marginLeft: 4 }}>{c.username}</span>}
                    <div style={{ background: mine ? '#F07B1D' : '#FFFFFF', color: mine ? '#FFF' : '#111', borderRadius: 18, borderBottomRightRadius: mine ? 4 : 18, borderBottomLeftRadius: mine ? 18 : 4, padding: '9px 14px', fontFamily: 'var(--font-body)', fontSize: 14, lineHeight: '20px' }}>
                      {c.text}
                    </div>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: '#AAAAAA', marginTop: 3, marginLeft: 4, marginRight: 4 }}>{c.timeAgo}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="comment-input-row">
          <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#EEE', overflow: 'hidden', flexShrink: 0 }}>
            {currentAvatar && <img src={currentAvatar} alt="" width={34} height={34} style={{ objectFit: 'cover', borderRadius: '50%' }} />}
          </div>
          <input
            className="comment-input"
            placeholder="Scrivi un commento…"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendComment(); } }}
            maxLength={500}
          />
          <button className="comment-send-btn" onClick={sendComment} disabled={!text.trim()} style={{ opacity: text.trim() ? 1 : 0.4 }}>
            <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
