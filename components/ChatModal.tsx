'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import AvatarImg from './AvatarImg';
import { useLang, T } from '@/lib/i18n';

const ORANGE = '#F07B1D';

interface Conversation {
  otherId:     string;
  name:        string;
  avatarUrl:   string | null;
  lastMessage: string;
  time:        string;
  unread:      number;
}

interface Message {
  id:         string;
  text:       string;
  mine:       boolean;
  time:       string;
  created_at: string;
  edited?:    boolean;
}

function fmtTime(iso: string, locale: string, yesterdayLabel: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000) return d.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  if (diff < 172800000) return yesterdayLabel;
  return d.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' });
}

interface Props {
  visible: boolean;
  onClose: () => void;
  openWithUserId?: string | null;
  openWithName?: string;
  openWithAvatar?: string | null;
}

export default function ChatModal({ visible, onClose, openWithUserId, openWithName, openWithAvatar }: Props) {
  const { t, lang } = useLang();
  const tl = (k: string) => T[lang][k] ?? T['en'][k] ?? k;
  const fmt = (iso: string) => fmtTime(iso, lang.replace('_', '-'), tl('yesterday'));
  const [myId, setMyId]                     = useState<string | null>(null);
  const [isAdmin, setIsAdmin]               = useState(false);
  const [conversations, setConversations]   = useState<Conversation[]>([]);
  const [activeId, setActiveId]             = useState<string | null>(null);
  const [activeName, setActiveName]         = useState('');
  const [activeAvatar, setActiveAvatar]     = useState<string | null>(null);
  const [messages, setMessages]             = useState<Message[]>([]);
  const [inputText, setInputText]           = useState('');
  const [loadingConvs, setLoadingConvs]     = useState(false);
  const [loadingMsgs, setLoadingMsgs]       = useState(false);
  const [isSending, setIsSending]           = useState(false);
  const [selectedMsgId, setSelectedMsgId]   = useState<string | null>(null);
  const [editingMsgId, setEditingMsgId]     = useState<string | null>(null);
  const [editMsgText, setEditMsgText]       = useState('');
  const editMsgRef = useRef<HTMLTextAreaElement>(null);
  const [suggested, setSuggested]           = useState<{ id: string; name: string; username: string; avatarUrl: string | null }[]>([]);
  const [newMsgMode, setNewMsgMode]         = useState(false);
  const [newMsgQuery, setNewMsgQuery]       = useState('');
  const [newMsgResults, setNewMsgResults]   = useState<{ id: string; name: string; username: string; avatarUrl: string | null }[]>([]);
  const [loadingNewMsg, setLoadingNewMsg]   = useState(false);
  const listRef  = useRef<HTMLDivElement>(null);

  const scrollToBottom = (animated = false) => {
    setTimeout(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    }, 80);
  };

  // Carica utente corrente + seguiti (suggeriti per nuovo messaggio)
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('users').select('id').eq('auth_id', user.id).single();
      if (!data) return;
      setMyId(data.id);
      const { data: follows } = await supabase.from('follows').select('followed_id').eq('follower_id', data.id).limit(20);
      const fIds = (follows || []).map((f: any) => f.followed_id);
      if (fIds.length > 0) {
        const { data: su } = await supabase.from('users').select('id, name, username, avatar_url').in('id', fIds);
        setSuggested((su || []).map((u: any) => ({ id: u.id, name: u.name || tl('user_fallback'), username: u.username || '', avatarUrl: u.avatar_url || null })));
      }
    })();
  }, []);

  const loadConversations = useCallback(async () => {
    if (!myId) return;
    setLoadingConvs(true);
    const { data: msgs } = await supabase
      .from('messages')
      .select('id, sender_id, receiver_id, content, read, created_at')
      .or(`sender_id.eq.${myId},receiver_id.eq.${myId}`)
      .order('created_at', { ascending: false });
    if (!msgs || msgs.length === 0) { setLoadingConvs(false); return; }

    const convMap: Record<string, { msg: any; unread: number }> = {};
    for (const m of msgs) {
      const otherId = m.sender_id === myId ? m.receiver_id : m.sender_id;
      if (!convMap[otherId]) {
        convMap[otherId] = { msg: m, unread: (!m.read && m.receiver_id === myId) ? 1 : 0 };
      } else if (!m.read && m.receiver_id === myId) {
        convMap[otherId].unread++;
      }
    }
    const otherIds = Object.keys(convMap);
    const { data: users } = await supabase.from('users').select('id, name, username, avatar_url').in('id', otherIds);
    const userMap: Record<string, any> = {};
    (users || []).forEach((u: any) => { userMap[u.id] = u; });

    setConversations(otherIds.map(otherId => {
      const u = userMap[otherId] || {};
      return {
        otherId, name: u.name || u.username || tl('user_fallback'), avatarUrl: u.avatar_url || null,
        lastMessage: convMap[otherId].msg.content || '', time: fmt(convMap[otherId].msg.created_at),
        unread: convMap[otherId].unread,
      };
    }));
    setLoadingConvs(false);
  }, [myId]);

  useEffect(() => { if (visible && myId) loadConversations(); }, [visible, myId, loadConversations]);

  // Auto-apri conversazione se passato utente
  useEffect(() => {
    if (!visible || !myId || !openWithUserId) return;
    openConversation(openWithUserId, openWithName || tl('user_fallback'), openWithAvatar || null);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, myId, openWithUserId]);

  // Realtime: aggiorna lista quando arriva messaggio
  useEffect(() => {
    if (!myId || !visible) return;
    const ch = supabase.channel(`convs_${myId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const m = payload.new as any;
        if (m.receiver_id !== myId) return;
        if (!activeId) loadConversations();
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [myId, visible, activeId, loadConversations]);

  const openConversation = async (otherId: string, name: string, avatarUrl: string | null) => {
    setActiveId(otherId);
    setActiveName(name);
    setActiveAvatar(avatarUrl);
    setSelectedMsgId(null);
    setEditingMsgId(null);
    setLoadingMsgs(true);
    if (!myId) return;
    const { data: msgs } = await supabase
      .from('messages')
      .select('id, sender_id, content, created_at, read')
      .or(`and(sender_id.eq.${myId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${myId})`)
      .order('created_at', { ascending: true });
    setMessages((msgs || []).map((m: any) => ({
      id: m.id, text: m.content, mine: m.sender_id === myId, time: fmt(m.created_at), created_at: m.created_at,
    })));
    await supabase.from('messages').update({ read: true }).eq('sender_id', otherId).eq('receiver_id', myId).eq('read', false);
    setConversations(prev => prev.map(c => c.otherId === otherId ? { ...c, unread: 0 } : c));
    setLoadingMsgs(false);
    scrollToBottom();
  };

  // Realtime: messaggi nella conversazione attiva
  useEffect(() => {
    if (!activeId || !myId) return;
    const ch = supabase.channel(`msgs_${myId}_${activeId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const m = payload.new as any;
        if (m.receiver_id !== myId || m.sender_id !== activeId) return;
        setMessages(prev => [...prev, { id: m.id, text: m.content, mine: false, time: fmt(m.created_at), created_at: m.created_at }]);
        supabase.from('messages').update({ read: true }).eq('id', m.id).then(() => {});
        scrollToBottom(true);
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeId, myId]);

  const startEditMsg = (item: Message) => {
    setEditingMsgId(item.id);
    setEditMsgText(item.text);
    setSelectedMsgId(null);
    setTimeout(() => editMsgRef.current?.focus(), 50);
  };

  const saveEditMsg = async () => {
    if (!editingMsgId || !editMsgText.trim()) return;
    await supabase.from('messages').update({ content: editMsgText.trim() }).eq('id', editingMsgId);
    setMessages(prev => prev.map(m => m.id === editingMsgId ? { ...m, text: editMsgText.trim(), edited: true } : m));
    setEditingMsgId(null);
  };

  const deleteMsg = async (id: string) => {
    if (!confirm(tl('delete_chat_msg_confirm'))) return;
    await supabase.from('messages').delete().eq('id', id);
    setMessages(prev => prev.filter(m => m.id !== id));
    setSelectedMsgId(null);
  };

  const sendMessage = async () => {
    if (!inputText.trim() || !myId || !activeId || isSending) return;
    setIsSending(true);
    const text = inputText.trim();
    setInputText('');
    try {
      const { data: newMsg } = await supabase.from('messages').insert({
        sender_id: myId, receiver_id: activeId, content: text,
      }).select('id, sender_id, content, created_at').single();
      if (newMsg) {
        const msg: Message = { id: newMsg.id, text: newMsg.content, mine: true, time: fmt(newMsg.created_at), created_at: newMsg.created_at };
        setMessages(prev => [...prev, msg]);
        setConversations(prev => prev.map(c => c.otherId === activeId ? { ...c, lastMessage: text, time: fmt(newMsg.created_at) } : c));
        scrollToBottom(true);
      }
    } finally { setIsSending(false); }
  };

  const handleBack = () => {
    if (activeId) { setActiveId(null); setMessages([]); }
    else if (newMsgMode) { setNewMsgMode(false); setNewMsgQuery(''); }
    else onClose();
  };

  // Ricerca utenti per nuovo messaggio (seguiti prima)
  const newMsgDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!newMsgMode) return;
    if (!newMsgQuery.trim()) { setNewMsgResults(suggested); return; }
    if (newMsgDebounce.current) clearTimeout(newMsgDebounce.current);
    newMsgDebounce.current = setTimeout(async () => {
      if (!myId) return;
      setLoadingNewMsg(true);
      const pattern = `%${newMsgQuery}%`;
      const { data } = await supabase.from('users').select('id, name, username, avatar_url').neq('id', myId).or(`username.ilike.${pattern},name.ilike.${pattern}`).limit(30);
      const all = (data || []).map((u: any) => ({ id: u.id, name: u.name || tl('user_fallback'), username: u.username || '', avatarUrl: u.avatar_url || null }));
      const fIds = new Set(suggested.map(s => s.id));
      setNewMsgResults([...all.filter(u => fIds.has(u.id)), ...all.filter(u => !fIds.has(u.id))]);
      setLoadingNewMsg(false);
    }, 350);
    return () => { if (newMsgDebounce.current) clearTimeout(newMsgDebounce.current); };
  }, [newMsgQuery, newMsgMode, suggested, myId]);

  if (!visible) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, backgroundColor: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #F0F0F0' }}>
        <button onClick={handleBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
          <svg width="24" height="24" fill="none" stroke="#111" strokeWidth="2.2" viewBox="0 0 24 24">
            {(activeId || newMsgMode) ? <polyline points="15 18 9 12 15 6"/> : <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}
          </svg>
        </button>
        {activeId ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AvatarImg uri={activeAvatar} size={32} seed={activeName} />
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 17, color: '#111' }}>{activeName}</span>
          </div>
        ) : newMsgMode ? (
          <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 17, color: '#111' }}>{t('chat_new')}</span>
        ) : (
          <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 17, color: '#111' }}>{t('chat_title')}</span>
        )}
        {!activeId && !newMsgMode ? (
          <button onClick={() => { setNewMsgQuery(''); setNewMsgResults(suggested); setNewMsgMode(true); }} title={t('chat_new')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: '#111' }}>
            <svg width="22" height="22" fill="none" stroke="#111" strokeWidth="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        ) : (
          <div style={{ width: 24 }} />
        )}
      </div>

      {/* Body */}
      {newMsgMode && !activeId ? (
        /* ── Pannello Nuovo Messaggio ── */
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#F5F5F5', margin: '12px 16px 4px', padding: '10px 14px', borderRadius: 14, gap: 8 }}>
            <svg width="17" height="17" fill="none" stroke="#AAAAAA" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontFamily: 'var(--font-body)', fontSize: 14, color: '#111' }}
              placeholder={t('chat_search_user')}
              value={newMsgQuery}
              onChange={e => setNewMsgQuery(e.target.value)}
              autoFocus
            />
            {newMsgQuery && <button onClick={() => setNewMsgQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#AAAAAA', display: 'flex' }}>
              <svg width="17" height="17" fill="#AAAAAA" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/></svg>
            </button>}
          </div>
          {!newMsgQuery && suggested.length > 0 && (
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: '0.8px', padding: '10px 20px 6px' }}>{t('chat_suggested')}</span>
          )}
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {loadingNewMsg ? (
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 24 }}><div className="spin" /></div>
            ) : newMsgResults.length === 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}><span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#AAAAAA' }}>{t('search_no_users')}</span></div>
            ) : newMsgResults.map(item => {
              const isFollowed = suggested.some(s => s.id === item.id);
              return (
                <div key={item.id} onClick={() => { setNewMsgMode(false); openConversation(item.id, item.name, item.avatarUrl); }}
                  style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #F8F8F8', cursor: 'pointer' }}>
                  <div style={{ position: 'relative', marginRight: 14 }}>
                    <AvatarImg uri={item.avatarUrl} size={48} seed={item.name} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15, color: '#111' }}>{item.name}</span>
                      {isFollowed && <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 11, color: ORANGE, backgroundColor: ORANGE + '20', borderRadius: 10, padding: '2px 8px' }}>{t('following_btn')}</span>}
                    </div>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#888' }}>@{item.username}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : activeId ? (
        /* Chat thread */
        <>
          <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px' }}>
            {loadingMsgs ? (
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}><div className="spin" /></div>
            ) : messages.length === 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#AAAAAA' }}>{t('chat_start')}</span>
              </div>
            ) : (
              messages.map((item, index) => {
                const next = messages[index + 1];
                const isLastInGroup = !next || next.mine !== item.mine;
                const isSelected = selectedMsgId === item.id;
                const isEditing = editingMsgId === item.id;
                return (
                  <div key={item.id} style={{ display: 'flex', flexDirection: 'column', alignItems: item.mine ? 'flex-end' : 'flex-start', marginBottom: isLastInGroup ? 12 : 3 }}>
                    {/* Action bar for own messages */}
                    {isSelected && item.mine && (
                      <div style={{ display: 'flex', gap: 8, marginBottom: 4, paddingRight: 4 }}>
                        <button onClick={() => startEditMsg(item)} style={{ background: '#F0F0F0', border: 'none', borderRadius: 12, padding: '4px 12px', fontFamily: 'var(--font-body)', fontSize: 12, color: '#333', cursor: 'pointer' }}>{tl('edit_msg')}</button>
                        <button onClick={() => deleteMsg(item.id)} style={{ background: '#FFE8E8', border: 'none', borderRadius: 12, padding: '4px 12px', fontFamily: 'var(--font-body)', fontSize: 12, color: '#E53935', cursor: 'pointer' }}>{tl('delete_msg')}</button>
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', gap: 8, justifyContent: item.mine ? 'flex-end' : 'flex-start' }}>
                      {!item.mine && (
                        isLastInGroup
                          ? <AvatarImg uri={activeAvatar} size={28} seed={activeName} />
                          : <div style={{ width: 28, flexShrink: 0 }} />
                      )}
                      <div>
                        {isEditing ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxWidth: '72vw' }}>
                            <textarea
                              ref={editMsgRef}
                              value={editMsgText}
                              onChange={e => setEditMsgText(e.target.value)}
                              style={{ borderRadius: 14, border: '1.5px solid ' + ORANGE, padding: '8px 12px', fontFamily: 'var(--font-body)', fontSize: 14, color: '#111', resize: 'none', outline: 'none', maxHeight: 120 }}
                              rows={2}
                              maxLength={500}
                            />
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                              <button onClick={() => setEditingMsgId(null)} style={{ background: '#F0F0F0', border: 'none', borderRadius: 12, padding: '4px 12px', fontFamily: 'var(--font-body)', fontSize: 12, color: '#555', cursor: 'pointer' }}>{tl('cancel')}</button>
                              <button onClick={saveEditMsg} style={{ background: ORANGE, border: 'none', borderRadius: 12, padding: '4px 12px', fontFamily: 'var(--font-body)', fontSize: 12, color: '#fff', cursor: 'pointer' }}>{tl('save')}</button>
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => { if (item.mine) setSelectedMsgId(prev => prev === item.id ? null : item.id); }}
                            style={{ maxWidth: '72vw', borderRadius: 18, borderBottomRightRadius: item.mine ? 4 : 18, borderBottomLeftRadius: item.mine ? 18 : 4, padding: '10px 14px', backgroundColor: item.mine ? ORANGE : '#F2F2F2', cursor: item.mine ? 'pointer' : 'default' }}>
                            <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: item.mine ? '#fff' : '#111', lineHeight: '20px' }}>{item.text}</span>
                          </div>
                        )}
                        {isLastInGroup && !isEditing && (
                          <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: '#AAAAAA', marginTop: 3, paddingLeft: item.mine ? 0 : 4, paddingRight: item.mine ? 4 : 0, textAlign: item.mine ? 'right' : 'left' }}>
                            {item.edited && <span style={{ marginRight: 4 }}>{tl('edited_label')}</span>}
                            {item.time}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
          {/* Input bar */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, padding: '8px 16px 16px', borderTop: '1px solid #F0F0F0' }}>
            <textarea
              style={{ flex: 1, backgroundColor: '#F5F5F5', borderRadius: 22, padding: '10px 16px', fontFamily: 'var(--font-body)', fontSize: 14, color: '#111', border: 'none', outline: 'none', resize: 'none', maxHeight: 100, lineHeight: '20px' }}
              placeholder={t('write_message')}
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              rows={1}
              maxLength={500}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            />
            <button
              onClick={sendMessage}
              disabled={!inputText.trim() || isSending}
              style={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: inputText.trim() && !isSending ? ORANGE : '#D0D0D0', border: 'none', cursor: inputText.trim() && !isSending ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .15s' }}>
              <svg width="18" height="18" fill="white" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
            </button>
          </div>
        </>
      ) : (
        /* Conversation list */
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {loadingConvs ? (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}><div className="spin" /></div>
          ) : (
            <>
              {/* Persone che segui — scroll orizzontale in cima */}
              {suggested.length > 0 && (
                <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid #F5F5F5' }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 11, color: '#AAAAAA', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: 12 }}>{t('chat_suggested')}</span>
                  <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 4 }}>
                    {suggested.map(item => (
                      <div key={item.id} onClick={() => openConversation(item.id, item.name, item.avatarUrl)}
                        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 64, cursor: 'pointer', flexShrink: 0 }}>
                        <AvatarImg uri={item.avatarUrl} size={48} seed={item.name} />
                        <span style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 11, color: '#333', marginTop: 5, textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name.split(' ')[0]}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {conversations.length === 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 40, gap: 8 }}>
                  <svg width="40" height="40" fill="none" stroke="#DDD" strokeWidth="1.5" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#AAAAAA' }}>{t('chat_no_messages')}</span>
                  {suggested.length > 0 && <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#AAAAAA', marginTop: 4 }}>{t('chat_touch_to_start')}</span>}
                </div>
              )}
              {conversations.map(item => (
                <div key={item.otherId} onClick={() => openConversation(item.otherId, item.name, item.avatarUrl)}
                  style={{ display: 'flex', alignItems: 'center', padding: '14px 20px', borderBottom: '1px solid #F8F8F8', cursor: 'pointer' }}>
                  <div style={{ position: 'relative', marginRight: 14 }}>
                    <AvatarImg uri={item.avatarUrl} size={52} seed={item.name} />
                    {item.unread > 0 && (
                      <div style={{ position: 'absolute', top: -2, right: -2, backgroundColor: ORANGE, borderRadius: 9, minWidth: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>
                        <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 10, color: '#fff' }}>{item.unread}</span>
                      </div>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontWeight: item.unread > 0 ? 700 : 600, fontSize: 15, color: '#111' }}>{item.name}</span>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#AAAAAA' }}>{item.time}</span>
                    </div>
                    <span style={{ fontFamily: 'var(--font-body)', fontWeight: item.unread > 0 ? 600 : 400, fontSize: 13, color: item.unread > 0 ? '#111' : '#888', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80%' }}>{item.lastMessage}</span>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
