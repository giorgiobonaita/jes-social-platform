'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { containsBlacklistedWord } from '@/lib/blacklist';
import AvatarImg from './AvatarImg';
import { useLang, T } from '@/lib/i18n';

const ORANGE = '#F07B1D';

interface Comment {
  id: string; username: string; avatarUrl: string | null;
  text: string; timeAgo: string; userId: string; parentId: string | null;
}

interface Props {
  visible: boolean; onClose: () => void;
  postId: string | null; postAuthorId?: string | null;
  isAdmin?: boolean;
}

export default function CommentsModal({ visible, onClose, postId, postAuthorId, isAdmin }: Props) {
  const { t, lang } = useLang();
  const tl = (k: string) => T[lang][k] ?? T['en'][k] ?? k;

  const [comments, setComments]               = useState<Comment[]>([]);
  const [inputText, setInputText]             = useState('');
  const [loading, setLoading]                 = useState(false);
  const [currentAvatar, setCurrentAvatar]     = useState<string | null>(null);
  const [currentDbUserId, setCurrentDbUserId] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState('');

  // edit / delete / reply state
  const [selectedId, setSelectedId]     = useState<string | null>(null);
  const [editingId, setEditingId]       = useState<string | null>(null);
  const [editText, setEditText]         = useState('');
  const [replyingTo, setReplyingTo]     = useState<{ id: string; username: string } | null>(null);

  const listRef    = useRef<HTMLDivElement>(null);
  const editRef    = useRef<HTMLTextAreaElement>(null);
  const inputRef   = useRef<HTMLTextAreaElement>(null);

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
    setSelectedId(null);
    setEditingId(null);
    (async () => {
      try {
        const { data: rows, error } = await supabase
          .from('comments').select('id, text, created_at, user_id, parent_id')
          .eq('post_id', postId).order('created_at', { ascending: true }).limit(200);
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
          parentId: c.parent_id ?? null,
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
          setComments(prev => [...prev, { id: c.id, username: u?.username || t('role_user_title'), avatarUrl: u?.avatar_url ?? null, text: c.text || '', timeAgo: t('notif_now'), userId: c.user_id, parentId: c.parent_id ?? null }]);
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
    const parentId = replyingTo?.id ?? null;
    setInputText('');
    setReplyingTo(null);
    const tempId = `temp_${Date.now()}`;
    setComments(prev => [...prev, { id: tempId, username: currentUsername, avatarUrl: currentAvatar, text, timeAgo: t('notif_now'), userId: currentDbUserId, parentId }]);
    scrollToBottom();
    const { error } = await supabase.from('comments').insert({ post_id: postId, user_id: currentDbUserId, text, parent_id: parentId });
    if (error) { setComments(prev => prev.filter(c => c.id !== tempId)); return; }
    if (postAuthorId && postAuthorId !== currentDbUserId) {
      supabase.from('notifications').insert({ user_id: postAuthorId, actor_id: currentDbUserId, type: 'comment', post_id: postId }).then(() => {});
    }
  };

  const handleBubbleClick = (item: Comment) => {
    const canAct = item.userId === currentDbUserId || isAdmin || postAuthorId === currentDbUserId;
    if (!canAct) return;
    setSelectedId(prev => prev === item.id ? null : item.id);
    setEditingId(null);
  };

  const startEdit = (item: Comment) => {
    setEditingId(item.id);
    setEditText(item.text);
    setSelectedId(null);
    setTimeout(() => editRef.current?.focus(), 80);
  };

  const saveEdit = async () => {
    if (!editingId || !editText.trim()) return;
    const blocked = await containsBlacklistedWord(editText.trim());
    if (blocked) { alert(`${t('word_not_allowed')}: "${blocked}".`); return; }
    await supabase.from('comments').update({ text: editText.trim() }).eq('id', editingId);
    setComments(prev => prev.map(c => c.id === editingId ? { ...c, text: editText.trim() } : c));
    setEditingId(null);
  };

  const deleteComment = async (id: string) => {
    if (!confirm(tl('delete_comment_confirm'))) return;
    await supabase.from('comments').delete().eq('id', id);
    setComments(prev => prev.filter(c => c.id !== id));
    setSelectedId(null);
  };

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={() => { onClose(); setSelectedId(null); setEditingId(null); }}>
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
        <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: 12, backgroundColor: '#F7F7F7' }}
          onClick={() => { setSelectedId(null); setEditingId(null); }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}><div className="spin" /></div>
          ) : comments.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 60, gap: 10 }}>
              <svg width="36" height="36" fill="none" stroke="#DDD" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
              <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: '#111' }}>{t('no_comments')}</span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#AAAAAA' }}>{t('no_comments_sub')}</span>
            </div>
          ) : (() => {
            const topLevel = comments.filter(c => !c.parentId);
            const repliesMap: Record<string, Comment[]> = {};
            comments.filter(c => c.parentId).forEach(c => {
              if (!repliesMap[c.parentId!]) repliesMap[c.parentId!] = [];
              repliesMap[c.parentId!].push(c);
            });

            const commentById: Record<string, Comment> = {};
            comments.forEach(c => { commentById[c.id] = c; });

            const renderBubble = (item: Comment, isReply = false) => {
              const parentUsername = isReply && item.parentId ? commentById[item.parentId]?.username : null;
              const mine = item.userId === currentDbUserId;
              const canAct = mine || isAdmin || postAuthorId === currentDbUserId;
              const isSelected = selectedId === item.id;
              const isEditing  = editingId === item.id;
              return (
                <div key={item.id} style={{ display: 'flex', flexDirection: 'row', marginBottom: isReply ? 2 : 4, alignItems: 'flex-end', justifyContent: mine ? 'flex-end' : 'flex-start', marginLeft: isReply ? 38 : 0 }}
                  onClick={e => { e.stopPropagation(); if (canAct) handleBubbleClick(item); }}>
                  {!mine && (
                    <div style={{ marginRight: 6, marginBottom: 2, alignSelf: 'flex-end' }}>
                      <AvatarImg uri={item.avatarUrl} size={isReply ? 26 : 32} seed={item.username} />
                    </div>
                  )}
                  <div style={{ maxWidth: '72%', display: 'flex', flexDirection: 'column', alignItems: mine ? 'flex-end' : 'flex-start' }}>
                    {!mine && (
                      <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: isReply ? 10 : 11, color: '#888', marginBottom: 2, marginLeft: 4 }}>{item.username}</span>
                    )}
                    {/* Action bar — modifica/elimina al click */}
                    {isSelected && !isEditing && (
                      <div style={{ display: 'flex', gap: 6, marginBottom: 4, justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                        {mine && (
                          <button onClick={e => { e.stopPropagation(); startEdit(item); }}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fff', border: '1px solid #EEE', borderRadius: 20, padding: '4px 12px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, color: '#111', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            {tl('edit_msg')}
                          </button>
                        )}
                        {canAct && (
                          <button onClick={e => { e.stopPropagation(); deleteComment(item.id); }}
                            style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fff', border: '1px solid #FFD0D0', borderRadius: 20, padding: '4px 12px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, color: '#E53935', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
                            {tl('delete_msg')}
                          </button>
                        )}
                      </div>
                    )}
                    {isEditing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, width: '100%' }} onClick={e => e.stopPropagation()}>
                        <textarea ref={editRef} value={editText} onChange={e => setEditText(e.target.value)} rows={2} maxLength={500}
                          style={{ width: '100%', borderRadius: 14, border: `1.5px solid ${ORANGE}`, padding: '8px 12px', fontFamily: 'var(--font-body)', fontSize: 14, color: '#111', outline: 'none', resize: 'none', boxSizing: 'border-box' }}
                          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); saveEdit(); } if (e.key === 'Escape') setEditingId(null); }} />
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button onClick={() => setEditingId(null)} style={{ background: 'none', border: '1px solid #EEE', borderRadius: 20, padding: '4px 12px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 12, color: '#888' }}>{t('cancel')}</button>
                          <button onClick={saveEdit} style={{ background: ORANGE, border: 'none', borderRadius: 20, padding: '4px 14px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, color: '#fff' }}>{t('save')}</button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ borderRadius: 18, borderBottomRightRadius: mine ? 4 : 18, borderBottomLeftRadius: mine ? 18 : 4, paddingLeft: isReply ? 11 : 14, paddingRight: isReply ? 11 : 14, paddingTop: isReply ? 7 : 9, paddingBottom: isReply ? 7 : 9, backgroundColor: mine ? ORANGE : '#fff', boxShadow: mine ? 'none' : '0 1px 3px rgba(0,0,0,0.05)', cursor: 'pointer' }}>
                        {parentUsername && (
                          <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, color: mine ? 'rgba(255,255,255,0.85)' : ORANGE, marginRight: 4 }}>@{parentUsername}</span>
                        )}
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: isReply ? 13 : 14, color: mine ? '#fff' : '#111', lineHeight: '20px' }}>{item.text}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2, justifyContent: mine ? 'flex-end' : 'flex-start' }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: '#AAAAAA', marginLeft: mine ? 0 : 4, marginRight: mine ? 4 : 0 }}>{item.timeAgo}</span>
                      {!isEditing && (
                        <button onClick={e => { e.stopPropagation(); setReplyingTo({ id: item.parentId ?? item.id, username: item.username }); setSelectedId(null); setTimeout(() => inputRef.current?.focus(), 80); }}
                          style={{ display: 'flex', alignItems: 'center', gap: 3, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                          <svg width="11" height="11" fill="none" stroke={ORANGE} strokeWidth="2.2" viewBox="0 0 24 24"><polyline points="9 17 4 12 9 7"/><path d="M20 18v-2a4 4 0 00-4-4H4"/></svg>
                          <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11, color: ORANGE }}>{t('comment_reply')}</span>
                        </button>
                      )}
                      {canAct && !isEditing && (
                        <button onClick={e => { e.stopPropagation(); handleBubbleClick(item); }}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                          <svg width="13" height="13" fill="none" stroke="#BBBBBB" strokeWidth="2" viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            };

            return topLevel.map(item => (
              <div key={item.id}>
                {renderBubble(item, false)}
                {(repliesMap[item.id] || []).map(reply => renderBubble(reply, true))}
              </div>
            ));
          })()}
        </div>

        {/* Reply indicator */}
        {replyingTo && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 16px', backgroundColor: '#FFF8F2', borderTop: '1px solid #FFE0C0' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: ORANGE }}>
              {t('comment_replying_to')} <strong>@{replyingTo.username}</strong>
            </span>
            <button onClick={() => setReplyingTo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: '#AAA' }}>
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
        )}
        {/* Input bar */}
        <div style={{ display: 'flex', alignItems: 'flex-end', padding: '10px 12px 16px', gap: 8, borderTop: '1px solid #EFEFEF', backgroundColor: '#fff' }}>
          <AvatarImg uri={currentAvatar} size={34} seed={currentUsername} />
          <textarea
            ref={inputRef}
            style={{ flex: 1, backgroundColor: '#F5F5F5', borderRadius: 22, padding: '9px 14px', fontFamily: 'var(--font-body)', fontSize: 14, color: '#111', border: 'none', outline: 'none', resize: 'none', maxHeight: 100, lineHeight: '20px' }}
            placeholder={replyingTo ? `${t('comment_replying_to')} @${replyingTo.username}...` : t('write_comment')}
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
