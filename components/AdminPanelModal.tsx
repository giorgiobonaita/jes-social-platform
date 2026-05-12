'use client';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import AvatarImg from './AvatarImg';

const ORANGE = '#F07B1D';

function fmtDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onUserPress?: (userId: string) => void;
}

type AdminTab = 'users' | 'reports' | 'blacklist' | 'arc';

export default function AdminPanelModal({ visible, onClose, onUserPress }: Props) {
  const [tab, setTab]         = useState<AdminTab>('users');
  const [users, setUsers]     = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch]   = useState('');
  const [reports, setReports]   = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [blacklist, setBlacklist] = useState<any[]>([]);
  const [loadingBlacklist, setLoadingBlacklist] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [myId, setMyId] = useState<string | null>(null);
  const [stats, setStats] = useState<{ users: number; posts: number; comments: number } | null>(null);

  useEffect(() => {
    if (!visible) return;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('users').select('id').eq('auth_id', user.id).single();
      if (data) setMyId(data.id);
    })();
    loadReports();
    loadBlacklist();
    loadStats();
  }, [visible]);

  const loadStats = async () => {
    const [{ count: userCount }, { count: postCount }, { count: commentCount }] = await Promise.all([
      supabase.from('users').select('id', { count: 'exact', head: true }),
      supabase.from('posts').select('id', { count: 'exact', head: true }),
      supabase.from('comments').select('id', { count: 'exact', head: true }),
    ]);
    setStats({ users: userCount || 0, posts: postCount || 0, comments: commentCount || 0 });
  };

  const loadReports = async () => {
    setLoadingReports(true);
    const { data } = await supabase.from('reports').select('id, type, description, status, created_at, post_id, reporter_id, reported_user_id').order('created_at', { ascending: false }).limit(50);
    setLoadingReports(false);
    setReports(data || []);
  };

  const loadBlacklist = async () => {
    setLoadingBlacklist(true);
    const { data } = await supabase.from('blacklist_words').select('id, word, created_at').order('created_at', { ascending: false });
    setLoadingBlacklist(false);
    setBlacklist(data || []);
  };

  const updateReportStatus = async (id: string, status: string) => {
    await supabase.from('reports').update({ status }).eq('id', id);
    loadReports();
  };

  const addWord = async () => {
    const w = newWord.trim().toLowerCase();
    if (!w || !myId) return;
    await supabase.from('blacklist_words').insert({ word: w, added_by: myId });
    setNewWord('');
    loadBlacklist();
  };

  const removeWord = async (id: string) => {
    await supabase.from('blacklist_words').delete().eq('id', id);
    loadBlacklist();
  };

  const loadUsers = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from('users')
      .select('id, username, name, role, is_banned, avatar_url, email, created_at, suspended_at, role_level, discipline, nationality')
      .order('created_at', { ascending: false })
      .limit(40);
    if (search.trim()) query = query.ilike('username', `%${search.trim()}%`);
    const { data, error } = await query;
    setLoading(false);
    if (!error && data) setUsers(data);
  }, [search]);

  useEffect(() => { if (visible) loadUsers(); }, [visible, loadUsers]);

  const toggleBan = async (id: string, currentlyBanned: boolean) => {
    if (!confirm(`Vuoi ${currentlyBanned ? 'sbloccare' : 'bannare'} questo utente?`)) return;
    const { error } = await supabase.from('users').update({ is_banned: !currentlyBanned, suspended_at: currentlyBanned ? null : new Date().toISOString() }).eq('id', id);
    if (!error) loadUsers();
  };

  const promoteToAdmin = async (id: string) => {
    if (!confirm('Vuoi far diventare questo utente un amministratore?')) return;
    const { error } = await supabase.from('users').update({ role: 'admin', role_level: 3 }).eq('id', id);
    if (!error) loadUsers();
  };

  const statusColor = (r: any) => r.status === 'reviewed' ? '#34C759' : r.status === 'dismissed' ? '#AAA' : ORANGE;

  if (!visible) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300, backgroundColor: '#fff', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #F0F0F0' }}>
        <button onClick={onClose} style={{ width: 40, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}>
          <svg width="24" height="24" fill="none" stroke="#111" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 18 }}>Pannello Admin</span>
        <div style={{ width: 40 }} />
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid #F0F0F0' }}>
        {(['users', 'reports', 'blacklist', 'arc'] as AdminTab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: '11px 0', background: 'none', border: 'none', borderBottom: `2px solid ${tab === t ? ORANGE : 'transparent'}`, cursor: 'pointer' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, color: tab === t ? ORANGE : '#888' }}>
              {t === 'users' ? 'Utenti' : t === 'reports' ? 'Segnalaz.' : t === 'blacklist' ? 'Blacklist' : 'JES ARC'}
            </span>
          </button>
        ))}
      </div>

      {/* ── STATS ── */}
      {stats && (
        <div style={{ display: 'flex', gap: 10, padding: '12px 16px 0' }}>
          {[
            { label: 'Utenti', value: stats.users, color: '#3B82F6', icon: <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg> },
            { label: 'Post', value: stats.posts, color: ORANGE, icon: <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg> },
            { label: 'Commenti', value: stats.comments, color: '#34C759', icon: <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg> },
          ].map(s => (
            <div key={s.label} style={{ flex: 1, background: s.color, borderRadius: 14, padding: '12px 10px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              {s.icon}
              <span style={{ fontFamily: 'var(--font-body)', fontWeight: 800, fontSize: 18, color: '#fff', lineHeight: 1 }}>{s.value.toLocaleString('it-IT')}</span>
              <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB UTENTI ── */}
      {tab === 'users' && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#F5F5F5', margin: '12px 16px 4px', padding: '0 12px', borderRadius: 12, height: 44, gap: 8 }}>
            <svg width="18" height="18" fill="none" stroke="#AAA" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontFamily: 'var(--font-body)', fontSize: 14, color: '#111' }} placeholder="Cerca per username…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
            {loading ? <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 30 }}><div className="spin" /></div> : (
              users.map(item => (
                <div key={item.id} style={{ paddingTop: 12, paddingBottom: 12, borderBottom: '1px solid #F5F5F5', display: 'flex', alignItems: 'flex-start', gap: 12, cursor: onUserPress ? 'pointer' : 'default' }} onClick={() => onUserPress && onUserPress(item.id)}>
                  <AvatarImg uri={item.avatar_url} size={44} seed={item.username} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 2 }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14 }}>{item.username}</span>
                      {item.role === 'admin' && <svg width="13" height="13" fill={ORANGE} viewBox="0 0 24 24"><path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2z"/></svg>}
                      {item.is_banned && <svg width="13" height="13" fill="none" stroke="#FF3B30" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>}
                    </div>
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#555', display: 'block' }}>{item.name}{item.discipline ? ` · ${item.discipline}` : ''}</span>
                    {item.email && <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#AAAAAA', display: 'block', marginTop: 1 }}>{item.email}</span>}
                    {item.nationality && <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#AAAAAA', display: 'block', marginTop: 1 }}>🌍 {item.nationality}</span>}
                    <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#AAAAAA', display: 'block', marginTop: 1 }}>
                      Iscritto: {fmtDate(item.created_at)}{item.suspended_at ? ` · Sospeso: ${fmtDate(item.suspended_at)}` : ''}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: item.is_banned ? '#FF3B30' : '#34C759' }} />
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#555' }}>{item.is_banned ? 'Sospeso' : 'Attivo'}</span>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#AAAAAA' }}>Livello {item.role_level ?? 1}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <button onClick={() => promoteToAdmin(item.id)} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer' }} title="Promuovi admin">
                      <svg width="20" height="20" fill="none" stroke="#111" strokeWidth="1.8" viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    </button>
                    <button onClick={() => toggleBan(item.id, item.is_banned)} style={{ padding: 6, background: 'none', border: 'none', cursor: 'pointer' }} title={item.is_banned ? 'Sblocca' : 'Banna'}>
                      {item.is_banned
                        ? <svg width="20" height="20" fill="none" stroke="#34C759" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                        : <svg width="20" height="20" fill="none" stroke="#FF3B30" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 019.9-1"/></svg>
                      }
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* ── TAB SEGNALAZIONI ── */}
      {tab === 'reports' && (
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {loadingReports ? <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 30 }}><div className="spin" /></div> : reports.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#AAAAAA', fontFamily: 'var(--font-body)', marginTop: 40 }}>Nessuna segnalazione</p>
          ) : reports.map(item => (
            <div key={item.id} style={{ backgroundColor: '#F9F9F9', borderRadius: 12, padding: 14, marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <svg width="14" height="14" fill={statusColor(item)} viewBox="0 0 24 24"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
                <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 12, color: statusColor(item) }}>{item.type?.toUpperCase()}</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#AAAAAA', marginLeft: 'auto' }}>{fmtDate(item.created_at)}</span>
              </div>
              {item.description && <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#444', lineHeight: '18px', margin: '0 0 8px' }}>{item.description}</p>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => updateReportStatus(item.id, 'reviewed')} style={{ backgroundColor: ORANGE, border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer' }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, color: '#fff' }}>Revisiona</span>
                </button>
                <button onClick={() => updateReportStatus(item.id, 'dismissed')} style={{ backgroundColor: '#F5F5F5', border: 'none', borderRadius: 8, padding: '7px 14px', cursor: 'pointer' }}>
                  <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 12, color: '#888' }}>Ignora</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TAB BLACKLIST ── */}
      {tab === 'blacklist' && (
        <>
          <div style={{ display: 'flex', gap: 8, margin: '12px 16px 4px' }}>
            <input
              style={{ flex: 1, height: 44, backgroundColor: '#F5F5F5', borderRadius: 12, padding: '0 14px', fontFamily: 'var(--font-body)', fontSize: 14, border: 'none', outline: 'none' }}
              placeholder="Aggiungi parola…"
              value={newWord}
              onChange={e => setNewWord(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addWord(); }}
            />
            <button onClick={addWord} style={{ width: 44, height: 44, backgroundColor: ORANGE, borderRadius: 12, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            </button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
            {loadingBlacklist ? <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 30 }}><div className="spin" /></div> : blacklist.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#AAAAAA', fontFamily: 'var(--font-body)', marginTop: 40 }}>Nessuna parola in blacklist</p>
            ) : blacklist.map(item => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 10, paddingTop: 10, paddingBottom: 10, borderBottom: '1px solid #F5F5F5' }}>
                <svg width="16" height="16" fill="none" stroke="#FF3B30" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
                <span style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 14, color: '#111', flex: 1 }}>{item.word}</span>
                <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#AAAAAA' }}>{fmtDate(item.created_at)}</span>
                <button onClick={() => removeWord(item.id)} style={{ padding: 4, background: 'none', border: 'none', cursor: 'pointer' }}>
                  <svg width="17" height="17" fill="none" stroke="#FF3B30" strokeWidth="2" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/></svg>
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── TAB JES ARC ── */}
      {tab === 'arc' && (
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#888', marginBottom: 4 }}>
            Invia comunicazione JES ARC agli utenti per categoria. Cliccando apri la mail precompilata.
          </p>

          {/* Artisti */}
          <div style={{ background: '#FEF0E9', borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: ORANGE, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><circle cx="11" cy="11" r="2"/></svg>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: '#111' }}>JES ARC Artisti</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#888' }}>Artisti, Pro Artisti, Studenti</div>
              </div>
            </div>
            <button
              onClick={() => window.location.href = 'mailto:jes.socialdellemozioni@gmail.com?subject=JES ARC Artisti&body=Ciao, sono interessato al servizio JES ARC per Artisti.'}
              style={{ width: '100%', background: ORANGE, color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              Contatta Artisti →
            </button>
          </div>

          {/* Aziende */}
          <div style={{ background: '#F0F5FE', borderRadius: 16, padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="20" height="20" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: '#111' }}>JES ARC Aziende</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#888' }}>Gallerie, Mostre, Società</div>
              </div>
            </div>
            <button
              onClick={() => window.location.href = 'mailto:jes.socialdellemozioni@gmail.com?subject=JES ARC Aziende&body=Ciao, sono interessato al servizio JES ARC per Aziende e Gallerie.'}
              style={{ width: '100%', background: '#3B82F6', color: '#fff', border: 'none', borderRadius: 12, padding: '13px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
              Contatta Aziende →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
