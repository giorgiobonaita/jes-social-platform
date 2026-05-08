'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

interface AdminUser {
  id: string;
  name: string;
  username: string;
  email: string | null;
  phone: string | null;
  nationality: string | null;
  accepts_promotions: boolean;
  created_at: string;
  role: string | null;
  is_banned: boolean;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

type Tab = 'users' | 'reports' | 'blacklist';

export default function AdminPage() {
  const [status, setStatus] = useState<'loading' | 'forbidden' | 'ok'>('loading');
  const [tab, setTab] = useState<Tab>('users');

  // Users
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [filter, setFilter] = useState<'all' | 'promo' | 'no_promo'>('all');
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);

  // Reports
  const [reports, setReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);

  // Blacklist
  const [blacklist, setBlacklist] = useState<any[]>([]);
  const [loadingBlacklist, setLoadingBlacklist] = useState(false);
  const [newWord, setNewWord] = useState('');
  const [myId, setMyId] = useState<string | null>(null);

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setStatus('forbidden'); return; }

      const { data: dbUser } = await supabase
        .from('users')
        .select('id, role')
        .eq('auth_id', user.id)
        .single();

      if (dbUser?.role !== 'admin') { setStatus('forbidden'); return; }

      setMyId(dbUser.id);
      setStatus('ok');
      loadUsers();
      loadReports();
      loadBlacklist();
    }
    checkAuth();
  }, []);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    const { data } = await supabase
      .from('users')
      .select('id, name, username, email, phone, nationality, accepts_promotions, created_at, role, is_banned')
      .order('created_at', { ascending: false });
    setUsers((data as any) ?? []);
    setLoadingUsers(false);
  }, []);

  const loadReports = async () => {
    setLoadingReports(true);
    const { data } = await supabase
      .from('reports')
      .select('id, type, description, status, created_at, reporter_id, reported_user_id')
      .order('created_at', { ascending: false })
      .limit(100);
    setReports(data ?? []);
    setLoadingReports(false);
  };

  const loadBlacklist = async () => {
    setLoadingBlacklist(true);
    const { data } = await supabase
      .from('blacklist_words')
      .select('id, word, created_at')
      .order('created_at', { ascending: false });
    setBlacklist(data ?? []);
    setLoadingBlacklist(false);
  };

  const toggleBan = async (id: string, banned: boolean) => {
    if (!confirm(`Vuoi ${banned ? 'sbloccare' : 'bannare'} questo utente?`)) return;
    await supabase.from('users').update({ is_banned: !banned }).eq('id', id);
    if (!banned) {
      await supabase.from('posts').delete().eq('user_id', id);
    }
    loadUsers();
  };

  const deleteUser = async (id: string, username: string) => {
    if (!confirm(`Eliminare definitivamente l'account @${username} e tutti i suoi dati? Questa azione è irreversibile.`)) return;
    await supabase.from('posts').delete().eq('user_id', id);
    await supabase.from('likes').delete().eq('user_id', id);
    await supabase.from('comments').delete().eq('user_id', id);
    await supabase.from('follows').delete().or(`follower_id.eq.${id},followed_id.eq.${id}`);
    await supabase.from('users').delete().eq('id', id);
    loadUsers();
  };

  const updateReport = async (id: string, status: string) => {
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

  const filtered = useMemo(() => {
    let list = users;
    if (filter === 'promo') list = list.filter(u => u.accepts_promotions);
    if (filter === 'no_promo') list = list.filter(u => !u.accepts_promotions);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(u =>
        u.name?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.nationality?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [users, filter, search]);

  const promoEmails = users.filter(u => u.accepts_promotions && u.email).map(u => u.email!);
  const promoPhones = users.filter(u => u.accepts_promotions && u.phone).map(u => u.phone!);

  const copyEmails = async () => {
    await navigator.clipboard.writeText(promoEmails.join(', '));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (status === 'loading') {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#F5F5F5' }}>
        <div style={{ width: 32, height: 32, borderRadius: '50%', border: '3px solid #F07B1D', borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (status === 'forbidden') {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#F5F5F5', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔒</div>
        <div style={{ fontWeight: 700, fontSize: 18, color: '#111' }}>Accesso negato</div>
        <div style={{ color: '#888', fontSize: 14, marginTop: 6 }}>Non hai i permessi per vedere questa pagina.</div>
      </div>
    );
  }

  const pendingReports = reports.filter(r => r.status === 'pending').length;

  return (
    <div style={{ minHeight: '100dvh', background: '#F5F5F5', fontFamily: "'Plus Jakarta Sans', sans-serif", display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #EEE', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 24, fontWeight: 800, color: '#F07B1D', letterSpacing: -1 }}>JES</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#AAA', background: '#F5F5F5', borderRadius: 8, padding: '3px 10px' }}>Admin Panel</span>
        </div>
        <div style={{ background: '#FFF3E0', borderRadius: 10, padding: '6px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="16" height="16" fill="none" stroke="#F07B1D" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
          <span style={{ fontSize: 18, fontWeight: 800, color: '#F07B1D' }}>{users.length}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#F07B1D' }}>membri JES</span>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ background: '#fff', display: 'flex', borderBottom: '1px solid #EEE' }}>
        {([['users','Utenti'], ['reports','Segnalazioni'], ['blacklist','Blacklist']] as [Tab,string][]).map(([t, label]) => (
          <button key={t} onClick={() => setTab(t)} style={{ padding: '12px 28px', background: 'none', border: 'none', borderBottom: `2.5px solid ${tab === t ? '#F07B1D' : 'transparent'}`, cursor: 'pointer', fontWeight: 700, fontSize: 14, color: tab === t ? '#F07B1D' : '#888', fontFamily: "'Plus Jakarta Sans', sans-serif", display: 'flex', alignItems: 'center', gap: 6 }}>
            {label}
            {t === 'reports' && pendingReports > 0 && <span style={{ background: '#F07B1D', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 11 }}>{pendingReports}</span>}
          </button>
        ))}
      </div>

      <div style={{ padding: '24px 28px' }}>

        {/* ── TAB UTENTI ── */}
        {tab === 'users' && (
          <>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'Utenti totali', value: users.length, color: '#111' },
                { label: 'Accettano promozioni', value: promoEmails.length, color: '#F07B1D' },
                { label: 'Con telefono', value: users.filter(u => u.phone).length, color: '#2196F3' },
                { label: 'Con nazionalità', value: users.filter(u => u.nationality).length, color: '#4CAF50' },
              ].map(s => (
                <div key={s.label} style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Promo email bar */}
            <div style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', marginBottom: 20, boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#111', marginBottom: 10 }}>Email promozioni ({promoEmails.length})</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <button onClick={copyEmails} style={{ background: copied ? '#4CAF50' : '#F07B1D', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  {copied ? '✓ Copiate!' : 'Copia tutte le email'}
                </button>
                <a href={`mailto:?bcc=${promoEmails.join(',')}&subject=Novità da JES&body=Ciao!`}
                  style={{ background: '#F5F5F5', color: '#111', border: '1.5px solid #EEE', borderRadius: 10, padding: '9px 18px', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
                  Apri in Mail
                </a>
              </div>
              {promoPhones.length > 0 && (
                <div style={{ marginTop: 10, fontSize: 12, color: '#666' }}>
                  <strong>Telefoni:</strong> {promoPhones.join(' · ')}
                </div>
              )}
            </div>

            {/* Filters */}
            <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Cerca nome, username, email, nazione…"
                style={{ flex: 1, minWidth: 200, border: '1.5px solid #EEE', borderRadius: 10, padding: '9px 14px', fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#fff' }} />
              {(['all', 'promo', 'no_promo'] as const).map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  style={{ background: filter === f ? '#F07B1D' : '#fff', color: filter === f ? '#fff' : '#666', border: `1.5px solid ${filter === f ? '#F07B1D' : '#EEE'}`, borderRadius: 10, padding: '9px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                  {f === 'all' ? 'Tutti' : f === 'promo' ? 'Promo ✓' : 'No promo'}
                </button>
              ))}
            </div>

            {/* Table */}
            {loadingUsers ? (
              <div style={{ textAlign: 'center', padding: 48, color: '#888' }}>Caricamento…</div>
            ) : (
              <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead>
                      <tr style={{ background: '#FAFAFA', borderBottom: '1.5px solid #EEE' }}>
                        {['Nome', 'Username', 'Email', 'Telefono', 'Nazionalità', 'Promo', 'Stato', 'Iscritto', ''].map(h => (
                          <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#888', fontSize: 12, whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.length === 0 ? (
                        <tr><td colSpan={8} style={{ padding: 32, textAlign: 'center', color: '#AAA' }}>Nessun utente trovato</td></tr>
                      ) : filtered.map((u, i) => (
                        <tr key={u.id} style={{ borderBottom: '1px solid #F5F5F5', background: i % 2 === 0 ? '#fff' : '#FAFAFA' }}>
                          <td style={{ padding: '11px 14px', fontWeight: 600, color: '#111', whiteSpace: 'nowrap' }}>{u.name}</td>
                          <td style={{ padding: '11px 14px', color: '#666' }}>@{u.username}</td>
                          <td style={{ padding: '11px 14px', color: '#444' }}>{u.email ?? <span style={{ color: '#CCC' }}>—</span>}</td>
                          <td style={{ padding: '11px 14px', color: '#444' }}>{u.phone ?? <span style={{ color: '#CCC' }}>—</span>}</td>
                          <td style={{ padding: '11px 14px', color: '#444' }}>{u.nationality ?? <span style={{ color: '#CCC' }}>—</span>}</td>
                          <td style={{ padding: '11px 14px' }}>
                            {u.accepts_promotions
                              ? <span style={{ background: '#FFF3E0', color: '#F07B1D', borderRadius: 8, padding: '3px 10px', fontWeight: 700, fontSize: 12 }}>Sì</span>
                              : <span style={{ color: '#CCC', fontSize: 12 }}>No</span>}
                          </td>
                          <td style={{ padding: '11px 14px' }}>
                            <button onClick={() => toggleBan(u.id, u.is_banned)}
                              style={{ background: u.is_banned ? '#FFF0EE' : '#F0FFF4', color: u.is_banned ? '#FF3B30' : '#34C759', border: 'none', borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                              {u.is_banned ? 'Bannato' : 'Attivo'}
                            </button>
                          </td>
                          <td style={{ padding: '11px 14px', color: '#888', whiteSpace: 'nowrap' }}>{formatDate(u.created_at)}</td>
                          <td style={{ padding: '11px 14px' }}>
                            {u.id !== myId && (
                              <button onClick={() => deleteUser(u.id, u.username)}
                                style={{ background: '#FFF0EE', color: '#FF3B30', border: 'none', borderRadius: 8, padding: '4px 10px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                                Elimina
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* ── TAB SEGNALAZIONI ── */}
        {tab === 'reports' && (
          <>
            {loadingReports ? (
              <div style={{ textAlign: 'center', padding: 48, color: '#888' }}>Caricamento…</div>
            ) : reports.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: '#AAA' }}>Nessuna segnalazione</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {reports.map(r => (
                  <div key={r.id} style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                      <span style={{ background: r.status === 'reviewed' ? '#E8F5E9' : r.status === 'dismissed' ? '#F5F5F5' : '#FFF3E0', color: r.status === 'reviewed' ? '#34C759' : r.status === 'dismissed' ? '#AAA' : '#F07B1D', borderRadius: 8, padding: '3px 10px', fontWeight: 700, fontSize: 12 }}>
                        {r.type?.toUpperCase() ?? 'SEGNALAZIONE'}
                      </span>
                      <span style={{ fontSize: 12, color: '#AAA', marginLeft: 'auto' }}>{formatDate(r.created_at)}</span>
                    </div>
                    {r.description && <p style={{ fontSize: 13, color: '#444', margin: '0 0 12px', lineHeight: 1.5 }}>{r.description}</p>}
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => updateReport(r.id, 'reviewed')}
                        style={{ background: '#F07B1D', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                        Revisiona
                      </button>
                      <button onClick={() => updateReport(r.id, 'dismissed')}
                        style={{ background: '#F5F5F5', color: '#888', border: 'none', borderRadius: 8, padding: '7px 14px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                        Ignora
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── TAB BLACKLIST ── */}
        {tab === 'blacklist' && (
          <>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <input type="text" value={newWord} onChange={e => setNewWord(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') addWord(); }}
                placeholder="Aggiungi parola…"
                style={{ flex: 1, border: '1.5px solid #EEE', borderRadius: 10, padding: '9px 14px', fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#fff' }} />
              <button onClick={addWord}
                style={{ background: '#F07B1D', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                + Aggiungi
              </button>
            </div>
            {loadingBlacklist ? (
              <div style={{ textAlign: 'center', padding: 48, color: '#888' }}>Caricamento…</div>
            ) : blacklist.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 48, color: '#AAA' }}>Nessuna parola in blacklist</div>
            ) : (
              <div style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
                {blacklist.map((item, i) => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', padding: '12px 20px', borderBottom: i < blacklist.length - 1 ? '1px solid #F5F5F5' : 'none' }}>
                    <span style={{ flex: 1, fontSize: 14, fontWeight: 500, color: '#111' }}>{item.word}</span>
                    <span style={{ fontSize: 12, color: '#AAA', marginRight: 16 }}>{formatDate(item.created_at)}</span>
                    <button onClick={() => removeWord(item.id)}
                      style={{ background: '#FFF0EE', color: '#FF3B30', border: 'none', borderRadius: 8, padding: '5px 12px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                      Rimuovi
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  );
}
