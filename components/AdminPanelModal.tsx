'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import AvatarImg from './AvatarImg';

const ORANGE = '#F07B1D';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export default function AdminPanelModal({ visible, onClose }: Props) {
  const [users, setUsers]     = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch]   = useState('');

  const loadUsers = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('users')
      .select('id, username, name, role, is_banned, avatar_url')
      .order('created_at', { ascending: false })
      .limit(20);
    if (search.trim()) query = query.ilike('username', `%${search.trim()}%`);
    const { data, error } = await query;
    setLoading(false);
    if (!error && data) setUsers(data);
  }, [search]);

  useEffect(() => { if (visible) loadUsers(); }, [visible, loadUsers]);

  const toggleBan = async (id: string, currentlyBanned: boolean) => {
    if (!confirm(`Vuoi ${currentlyBanned ? 'sbloccare' : 'bannare'} questo utente?`)) return;
    const { error } = await supabase.from('users').update({ is_banned: !currentlyBanned }).eq('id', id);
    if (!error) loadUsers();
  };

  const promoteToAdmin = async (id: string) => {
    if (!confirm('Vuoi far diventare questo utente un amministratore?')) return;
    const { error } = await supabase.from('users').update({ role: 'admin' }).eq('id', id);
    if (!error) loadUsers();
  };

  if (!visible) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, backgroundColor: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #F0F0F0' }}>
        <button onClick={onClose} style={{ width: 40, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}>
          <svg width="24" height="24" fill="none" stroke="#111" strokeWidth="2" viewBox="0 0 24 24">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 18 }}>Pannello Admin</span>
        <div style={{ width: 40 }} />
      </div>

      {/* Search */}
      <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#F5F5F5', margin: 16, padding: '0 12px', borderRadius: 12, height: 44, gap: 8 }}>
        <svg width="18" height="18" fill="none" stroke="#AAA" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <input
          style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontFamily: 'var(--font-body)', fontSize: 14, color: '#111' }}
          placeholder="Cerca utente per username..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 30 }}>
            <div className="spin" />
          </div>
        ) : (
          users.map(item => (
            <div key={item.id} style={{ display: 'flex', alignItems: 'center', paddingTop: 12, paddingBottom: 12, borderBottom: '1px solid #F5F5F5' }}>
              <AvatarImg uri={item.avatar_url} size={40} seed={item.username} />
              <div style={{ flex: 1, marginLeft: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15 }}>{item.username}</span>
                  {item.role === 'admin' && (
                    <svg width="13" height="13" fill={ORANGE} viewBox="0 0 24 24">
                      <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z"/>
                    </svg>
                  )}
                </div>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#AAA' }}>{item.name}</span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {/* Promuovi admin */}
                <button onClick={() => promoteToAdmin(item.id)} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer' }} title="Promuovi admin">
                  <svg width="20" height="20" fill="none" stroke="#111" strokeWidth="1.8" viewBox="0 0 24 24">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </button>
                {/* Ban/Unban */}
                <button onClick={() => toggleBan(item.id, item.is_banned)} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer' }} title={item.is_banned ? 'Sblocca' : 'Banna'}>
                  {item.is_banned ? (
                    <svg width="20" height="20" fill="none" stroke="#FF3B30" strokeWidth="1.8" viewBox="0 0 24 24">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
                    </svg>
                  ) : (
                    <svg width="20" height="20" fill="none" stroke="#111" strokeWidth="1.8" viewBox="0 0 24 24">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 019.9-1"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
