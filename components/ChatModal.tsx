'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface Message {
  id: string; text: string; sender_id: string; created_at: string;
}

function formatAgo(d: string): string {
  const m = Math.floor((Date.now() - new Date(d).getTime()) / 60000);
  if (m < 1) return 'ora'; if (m < 60) return `${m} min`; const h = Math.floor(m / 60);
  if (h < 24) return `${h} h`; return `${Math.floor(h / 24)} g`;
}

interface Props {
  visible: boolean; onClose: () => void;
  openWithUserId?: string; openWithName?: string; openWithAvatar?: string | null;
}

export default function ChatModal({ visible, onClose, openWithUserId, openWithName, openWithAvatar }: Props) {
  const [conversations, setConversations] = useState<any[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [currentDbUserId, setCurrentDbUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'chat'>('list');
  const [chatWith, setChatWith] = useState<{ id: string; name: string; avatar: string | null } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('users').select('id').eq('auth_id', user.id).single();
      if (data) setCurrentDbUserId(data.id);
    })();
  }, []);

  useEffect(() => {
    if (!visible || !currentDbUserId) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from('conversations')
        .select('*, participants:conversation_participants(user_id, users(id,name,username,avatar_url))')
        .contains('participant_ids', [currentDbUserId])
        .order('updated_at', { ascending: false }).limit(30);
      setConversations(data || []);
      setLoading(false);

      if (openWithUserId && openWithName) {
        openConversationWith(openWithUserId, openWithName, openWithAvatar || null);
      }
    })();
  }, [visible, currentDbUserId, openWithUserId]);

  const openConversationWith = async (userId: string, name: string, avatar: string | null) => {
    setChatWith({ id: userId, name, avatar });
    setView('chat');
    if (!currentDbUserId) return;
    const { data } = await supabase.from('messages')
      .select('*').or(`and(sender_id.eq.${currentDbUserId},recipient_id.eq.${userId}),and(sender_id.eq.${userId},recipient_id.eq.${currentDbUserId})`)
      .order('created_at', { ascending: true }).limit(100);
    setMessages(data || []);
    setTimeout(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, 100);
  };

  const sendMessage = async () => {
    const t = inputText.trim();
    if (!t || !currentDbUserId || !chatWith) return;
    setInputText('');
    const msg: Message = { id: `temp_${Date.now()}`, text: t, sender_id: currentDbUserId, created_at: new Date().toISOString() };
    setMessages(prev => [...prev, msg]);
    await supabase.from('messages').insert({ sender_id: currentDbUserId, recipient_id: chatWith.id, text: t });
    setTimeout(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, 50);
  };

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" style={{ maxHeight: '90dvh', display: 'flex', flexDirection: 'column', paddingBottom: 0, padding: 0, borderRadius: '24px 24px 0 0' }} onClick={e => e.stopPropagation()}>
        {view === 'list' ? (
          <>
            <div className="modal-handle" style={{ margin: '14px auto 0' }} />
            <div className="modal-header" style={{ padding: '8px 20px 12px' }}>
              <span className="modal-title">Messaggi</span>
              <button className="modal-close" onClick={onClose}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 32px' }}>
              {loading ? (
                <div className="spinner"><div className="spin" /></div>
              ) : conversations.length === 0 ? (
                <p className="empty-text">Nessun messaggio</p>
              ) : (
                conversations.map(conv => (
                  <div key={conv.id} className="user-row" onClick={() => openConversationWith('', '', null)}>
                    <div className="avatar" style={{ width: 44, height: 44 }}>
                      <svg width="22" height="22" fill="#CCC" viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
                    </div>
                    <div style={{ flex: 1, fontFamily: 'var(--font-body)', fontSize: 14, color: '#111' }}>Conversazione</div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            {/* Chat view */}
            <div className="chat-header">
              <button onClick={() => setView('list')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#EEE', overflow: 'hidden' }}>
                {chatWith?.avatar && <img src={chatWith.avatar} alt="" width={36} height={36} style={{ objectFit: 'cover', borderRadius: '50%' }} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: '#111' }}>{chatWith?.name}</div>
              </div>
              <button className="modal-close" onClick={onClose}>
                <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            </div>

            <div ref={scrollRef} className="chat-messages">
              {messages.map(m => (
                <div key={m.id} className={`msg-bubble${m.sender_id === currentDbUserId ? ' mine' : ' theirs'}`}>
                  {m.text}
                </div>
              ))}
            </div>

            <div className="chat-input-row">
              <input
                className="comment-input"
                placeholder="Scrivi un messaggio..."
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && sendMessage()}
                style={{ flex: 1 }}
              />
              <button className="comment-send-btn" onClick={sendMessage} disabled={!inputText.trim()} style={{ opacity: inputText.trim() ? 1 : 0.4 }}>
                <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
