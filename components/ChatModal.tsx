'use client';
import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import AvatarImg from './AvatarImg';

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
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  if (diff < 86400000) return d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  if (diff < 172800000) return 'Ieri';
  return d.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit' });
}

interface Props {
  visible: boolean;
  onClose: () => void;
  openWithUserId?: string | null;
  openWithName?: string;
  openWithAvatar?: string | null;
}

export default function ChatModal({ visible, onClose, openWithUserId, openWithName, openWithAvatar }: Props) {
  const [myId, setMyId]                     = useState<string | null>(null);
  const [conversations, setConversations]   = useState<Conversation[]>([]);
  const [activeId, setActiveId]             = useState<string | null>(null);
  const [activeName, setActiveName]         = useState('');
  const [activeAvatar, setActiveAvatar]     = useState<string | null>(null);
  const [messages, setMessages]             = useState<Message[]>([]);
  const [inputText, setInputText]           = useState('');
  const [loadingConvs, setLoadingConvs]     = useState(false);
  const [loadingMsgs, setLoadingMsgs]       = useState(false);
  const [isSending, setIsSending]           = useState(false);
  const listRef  = useRef<HTMLDivElement>(null);

  const scrollToBottom = (animated = false) => {
    setTimeout(() => {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    }, 80);
  };

  // Carica utente corrente
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('users').select('id').eq('auth_id', user.id).single();
      if (data) setMyId(data.id);
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
        otherId, name: u.name || u.username || 'Utente', avatarUrl: u.avatar_url || null,
        lastMessage: convMap[otherId].msg.content || '', time: fmtTime(convMap[otherId].msg.created_at),
        unread: convMap[otherId].unread,
      };
    }));
    setLoadingConvs(false);
  }, [myId]);

  useEffect(() => { if (visible && myId) loadConversations(); }, [visible, myId, loadConversations]);

  // Auto-apri conversazione se passato utente
  useEffect(() => {
    if (!visible || !myId || !openWithUserId) return;
    openConversation(openWithUserId, openWithName || 'Utente', openWithAvatar || null);
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
    setLoadingMsgs(true);
    if (!myId) return;
    const { data: msgs } = await supabase
      .from('messages')
      .select('id, sender_id, content, created_at, read')
      .or(`and(sender_id.eq.${myId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${myId})`)
      .order('created_at', { ascending: true });
    setMessages((msgs || []).map((m: any) => ({
      id: m.id, text: m.content, mine: m.sender_id === myId, time: fmtTime(m.created_at), created_at: m.created_at,
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
        setMessages(prev => [...prev, { id: m.id, text: m.content, mine: false, time: fmtTime(m.created_at), created_at: m.created_at }]);
        supabase.from('messages').update({ read: true }).eq('id', m.id).then(() => {});
        scrollToBottom(true);
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeId, myId]);

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
        const msg: Message = { id: newMsg.id, text: newMsg.content, mine: true, time: fmtTime(newMsg.created_at), created_at: newMsg.created_at };
        setMessages(prev => [...prev, msg]);
        setConversations(prev => prev.map(c => c.otherId === activeId ? { ...c, lastMessage: text, time: fmtTime(newMsg.created_at) } : c));
        scrollToBottom(true);
      }
    } finally { setIsSending(false); }
  };

  const handleBack = () => {
    if (activeId) { setActiveId(null); setMessages([]); }
    else onClose();
  };

  if (!visible) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, backgroundColor: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #F0F0F0' }}>
        <button onClick={handleBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
          <svg width="24" height="24" fill="none" stroke="#111" strokeWidth="2.2" viewBox="0 0 24 24">
            {activeId ? <polyline points="15 18 9 12 15 6"/> : <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}
          </svg>
        </button>
        {activeId ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <AvatarImg uri={activeAvatar} size={32} seed={activeName} />
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 17, color: '#111' }}>{activeName}</span>
          </div>
        ) : (
          <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 17, color: '#111' }}>Messaggi</span>
        )}
        <div style={{ width: 24 }} />
      </div>

      {/* Body */}
      {activeId ? (
        /* Chat thread */
        <>
          <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 8px' }}>
            {loadingMsgs ? (
              <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 40 }}><div className="spin" /></div>
            ) : messages.length === 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#AAAAAA' }}>Inizia la conversazione</span>
              </div>
            ) : (
              messages.map((item, index) => {
                const next = messages[index + 1];
                const isLastInGroup = !next || next.mine !== item.mine;
                return (
                  <div key={item.id} style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: isLastInGroup ? 12 : 3, justifyContent: item.mine ? 'flex-end' : 'flex-start' }}>
                    {!item.mine && (
                      isLastInGroup
                        ? <AvatarImg uri={activeAvatar} size={28} seed={activeName} />
                        : <div style={{ width: 28, flexShrink: 0 }} />
                    )}
                    <div>
                      <div style={{ maxWidth: '72vw', borderRadius: 18, borderBottomRightRadius: item.mine ? 4 : 18, borderBottomLeftRadius: item.mine ? 18 : 4, padding: '10px 14px', backgroundColor: item.mine ? ORANGE : '#F2F2F2' }}>
                        <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: item.mine ? '#fff' : '#111', lineHeight: '20px' }}>{item.text}</span>
                      </div>
                      {isLastInGroup && (
                        <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: '#AAAAAA', marginTop: 3, paddingLeft: item.mine ? 0 : 4, paddingRight: item.mine ? 4 : 0, textAlign: item.mine ? 'right' : 'left' }}>{item.time}</div>
                      )}
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
              placeholder="Scrivi un messaggio…"
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
          ) : conversations.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 60, gap: 10 }}>
              <svg width="48" height="48" fill="none" stroke="#DDD" strokeWidth="1.5" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#AAAAAA' }}>Nessun messaggio ancora</span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#AAAAAA', marginTop: 4 }}>Cerca un utente e inizia a chattare</span>
            </div>
          ) : (
            conversations.map(item => (
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
            ))
          )}
        </div>
      )}
    </div>
  );
}
