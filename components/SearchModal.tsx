'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Props {
  visible: boolean; onClose: () => void;
  onUserPress: (userId: string) => void;
  onGroupPress: (groupId: string) => void;
  onPostPress: (postId: string, imageUrl: string | null) => void;
}

export default function SearchModal({ visible, onClose, onUserPress, onGroupPress, onPostPress }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim() || !visible) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      const { data } = await supabase.from('users')
        .select('id, name, username, avatar_url, discipline, role')
        .or(`username.ilike.%${query}%,name.ilike.%${query}%`)
        .limit(20);
      setResults(data || []);
      setLoading(false);
    }, 300);
    return () => clearTimeout(t);
  }, [query, visible]);

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" style={{ maxHeight: '85dvh', display: 'flex', flexDirection: 'column', paddingBottom: 0 }} onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-header" style={{ padding: '0 20px 12px' }}>
          <span className="modal-title">Cerca</span>
          <button className="modal-close" onClick={onClose}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        <div style={{ padding: '0 20px 12px' }}>
          <div className="search-input-wrap">
            <svg width="18" height="18" fill="none" stroke="#888" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input className="search-input" placeholder="Cerca artisti, utenti..." value={query} onChange={e => setQuery(e.target.value)} autoFocus />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 32px' }}>
          {loading && <div className="spinner"><div className="spin" /></div>}
          {!loading && results.length === 0 && query.trim() && (
            <p className="empty-text">Nessun risultato per &quot;{query}&quot;</p>
          )}
          {results.map(user => (
            <div key={user.id} className="user-row" onClick={() => { onUserPress(user.id); onClose(); }}>
              <div className="avatar" style={{ width: 44, height: 44 }}>
                {user.avatar_url
                  ? <img src={user.avatar_url} alt={user.name} width={44} height={44} style={{ objectFit: 'cover', borderRadius: '50%' }} />
                  : <svg width="22" height="22" fill="#CCC" viewBox="0 0 24 24"><path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/></svg>
                }
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: '#111', display: 'flex', alignItems: 'center', gap: 4 }}>
                  {user.name || user.username}
                  {(user.role === 'official' || user.role === 'admin') && <span style={{ color: '#007AFF', fontSize: 13 }}>✓</span>}
                </div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#888' }}>@{user.username} · {user.discipline || 'Artista'}</div>
              </div>
              <svg width="18" height="18" fill="none" stroke="#CCC" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
