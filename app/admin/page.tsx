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
  deletion_scheduled_at: string | null;
  deletion_reason: string | null;
  appeal_text: string | null;
  appeal_status: string | null;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

type Tab = 'users' | 'reports' | 'blacklist' | 'appeals';

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
  const [postCount, setPostCount] = useState<number | null>(null);
  const [commentCount, setCommentCount] = useState<number | null>(null);

  // Soft-delete modal
  const [deleteModal, setDeleteModal] = useState<{ id: string; username: string } | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Report post-delete modal
  const [reportDeleteModal, setReportDeleteModal] = useState<{ reportId: string; postId: string } | null>(null);
  const [reportDeleteReason, setReportDeleteReason] = useState('');
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

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
      supabase.from('posts').select('id', { count: 'exact', head: true }).then(({ count }) => setPostCount(count ?? 0));
      supabase.from('comments').select('id', { count: 'exact', head: true }).then(({ count }) => setCommentCount(count ?? 0));
    }
    checkAuth();
  }, []);

  const loadUsers = useCallback(async () => {
    setLoadingUsers(true);
    const { data } = await supabase
      .from('users')
      .select('id, name, username, email, phone, nationality, accepts_promotions, created_at, role, is_banned, deletion_scheduled_at, deletion_reason, appeal_text, appeal_status')
      .order('created_at', { ascending: false });
    setUsers((data as any) ?? []);
    setLoadingUsers(false);
  }, []);

  const loadReports = async () => {
    setLoadingReports(true);
    const { data } = await supabase
      .from('reports')
      .select('id, type, description, status, created_at, reporter_id, reported_user_id, post_id, posts(image_urls, caption)')
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

  const scheduleDeletion = async () => {
    if (!deleteModal || !deleteReason.trim()) return;
    setDeletingId(deleteModal.id);
    const scheduledAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('users').update({
      is_banned: true,
      deletion_scheduled_at: scheduledAt,
      deletion_reason: deleteReason.trim(),
      appeal_status: null,
      appeal_text: null,
    }).eq('id', deleteModal.id);
    setDeleteModal(null);
    setDeleteReason('');
    setDeletingId(null);
    loadUsers();
  };

  const hardDeleteUser = async (id: string) => {
    await supabase.from('posts').delete().eq('user_id', id);
    await supabase.from('likes').delete().eq('user_id', id);
    await supabase.from('comments').delete().eq('user_id', id);
    await supabase.from('follows').delete().or(`follower_id.eq.${id},followed_id.eq.${id}`);
    await supabase.from('users').delete().eq('id', id);
    loadUsers();
  };

  const approveAppeal = async (id: string) => {
    await supabase.from('users').update({
      is_banned: false,
      deletion_scheduled_at: null,
      deletion_reason: null,
      appeal_text: null,
      appeal_status: 'approved',
    }).eq('id', id);
    loadUsers();
  };

  const rejectAppeal = async (id: string) => {
    await hardDeleteUser(id);
  };

  const deleteAllPosts = async () => {
    if (!confirm('Eliminare TUTTI i post di tutti gli utenti? Questa azione è irreversibile.')) return;
    if (!confirm('Sei sicuro? Tutti i post, like e commenti verranno cancellati permanentemente.')) return;
    await supabase.from('likes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('comments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('post_tags').delete().neq('post_id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('saves').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    await supabase.from('posts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    setPostCount(0);
    setCommentCount(0);
    alert('Tutti i post sono stati eliminati.');
  };

  const updateReport = async (id: string, status: string) => {
    await supabase.from('reports').update({ status }).eq('id', id);
    loadReports();
  };

  const deletePostFromReport = async () => {
    if (!reportDeleteModal || !reportDeleteReason.trim()) return;
    setDeletingPostId(reportDeleteModal.postId);
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await fetch('/api/admin-delete-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ post_id: reportDeleteModal.postId, caller_auth_id: user.id, reason: reportDeleteReason.trim() }),
      });
    }
    await supabase.from('reports').update({ status: 'reviewed' }).eq('id', reportDeleteModal.reportId);
    setReportDeleteModal(null);
    setReportDeleteReason('');
    setDeletingPostId(null);
    loadReports();
    supabase.from('posts').select('id', { count: 'exact', head: true }).then(({ count }) => setPostCount(count ?? 0));
  };

  const POST_DELETE_REASONS = [
    'Contenuto inappropriato',
    'Spam',
    'Violazione copyright',
    'Nudità o contenuto sessuale',
    'Violenza o contenuto pericoloso',
    'Odio o molestia',
  ];

  const ACCOUNT_DELETE_REASONS = [
    'Violazione ripetuta delle regole',
    'Spam o account falso',
    'Comportamento abusivo',
    'Contenuti illegali',
    'Richiesta dell\'utente',
  ];

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
        {([['users','Utenti'], ['reports','Segnalazioni'], ['blacklist','Blacklist'], ['appeals','Ricorsi']] as [Tab,string][]).map(([t, label]) => {
          const pendingAppeals = users.filter(u => u.appeal_text && u.appeal_status === 'pending').length;
          return (
            <button key={t} onClick={() => setTab(t)} style={{ padding: '12px 20px', background: 'none', border: 'none', borderBottom: `2.5px solid ${tab === t ? '#F07B1D' : 'transparent'}`, cursor: 'pointer', fontWeight: 700, fontSize: 14, color: tab === t ? '#F07B1D' : '#888', fontFamily: "'Plus Jakarta Sans', sans-serif", display: 'flex', alignItems: 'center', gap: 6 }}>
              {label}
              {t === 'reports' && pendingReports > 0 && <span style={{ background: '#F07B1D', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 11 }}>{pendingReports}</span>}
              {t === 'appeals' && pendingAppeals > 0 && <span style={{ background: '#FF3B30', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 11 }}>{pendingAppeals}</span>}
            </button>
          );
        })}
      </div>

      <div style={{ padding: '24px 28px' }}>

        {/* ── TAB UTENTI ── */}
        {tab === 'users' && (
          <>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 24 }}>
              {[
                { label: 'Utenti totali', value: users.length, color: '#111' },
                { label: 'Post totali', value: postCount, color: '#F07B1D' },
                { label: 'Commenti totali', value: commentCount, color: '#9C27B0' },
                { label: 'Accettano promozioni', value: promoEmails.length, color: '#FF5722' },
                { label: 'Con telefono', value: users.filter(u => u.phone).length, color: '#2196F3' },
                { label: 'Con nazionalità', value: users.filter(u => u.nationality).length, color: '#4CAF50' },
              ].map(s => (
                <div key={s.label} style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value == null ? '…' : s.value}</div>
                  <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Danger zone */}
            <div style={{ background: '#FFF0EE', borderRadius: 14, padding: '14px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#FF3B30' }}>Elimina tutti i post</div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>Cancella tutti i post, like, commenti e tag. Irreversibile.</div>
              </div>
              <button onClick={deleteAllPosts}
                style={{ background: '#FF3B30', color: '#fff', border: 'none', borderRadius: 10, padding: '9px 18px', fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Elimina tutti
              </button>
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
                              u.deletion_scheduled_at
                                ? <span style={{ fontSize: 11, color: '#FF3B30', fontWeight: 700 }}>
                                    Cancellazione<br/>
                                    {formatDate(u.deletion_scheduled_at)}
                                  </span>
                                : <button onClick={() => { setDeleteModal({ id: u.id, username: u.username }); setDeleteReason(''); }}
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
                {reports.map(r => {
                  const post = r.posts as { image_urls?: string[]; caption?: string } | null;
                  const thumb = post?.image_urls?.[0];
                  return (
                    <div key={r.id} style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{ background: r.status === 'reviewed' ? '#E8F5E9' : r.status === 'dismissed' ? '#F5F5F5' : '#FFF3E0', color: r.status === 'reviewed' ? '#34C759' : r.status === 'dismissed' ? '#AAA' : '#F07B1D', borderRadius: 8, padding: '3px 10px', fontWeight: 700, fontSize: 12 }}>
                          {r.type?.toUpperCase() ?? 'SEGNALAZIONE'}
                        </span>
                        <span style={{ fontSize: 12, color: '#AAA', marginLeft: 'auto' }}>{formatDate(r.created_at)}</span>
                      </div>
                      {r.description && <p style={{ fontSize: 13, color: '#444', margin: '0 0 12px', lineHeight: 1.5 }}>{r.description}</p>}

                      {/* Post preview */}
                      {(thumb || post?.caption) && (
                        <div style={{ display: 'flex', gap: 12, background: '#F9F9F9', borderRadius: 12, padding: '12px', marginBottom: 12, alignItems: 'flex-start' }}>
                          {thumb && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={thumb} alt="" style={{ width: 72, height: 72, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#888', marginBottom: 4 }}>POST SEGNALATO</div>
                            {post?.caption && <div style={{ fontSize: 13, color: '#444', lineHeight: 1.4, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>{post.caption}</div>}
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button onClick={() => updateReport(r.id, 'reviewed')}
                          style={{ background: '#F07B1D', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 14px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                          Revisiona
                        </button>
                        <button onClick={() => updateReport(r.id, 'dismissed')}
                          style={{ background: '#F5F5F5', color: '#888', border: 'none', borderRadius: 8, padding: '7px 14px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                          Ignora
                        </button>
                        {r.post_id && (
                          <button onClick={() => { setReportDeleteModal({ reportId: r.id, postId: r.post_id }); setReportDeleteReason(''); }}
                            style={{ background: '#FFF0EE', color: '#FF3B30', border: 'none', borderRadius: 8, padding: '7px 14px', fontWeight: 700, fontSize: 12, cursor: 'pointer', marginLeft: 'auto' }}>
                            Elimina post
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
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

        {/* ── TAB RICORSI ── */}
        {tab === 'appeals' && (() => {
          const pending = users.filter(u => u.appeal_text && u.appeal_status === 'pending');
          return pending.length === 0
            ? <div style={{ textAlign: 'center', padding: 48, color: '#AAA' }}>Nessun ricorso in attesa</div>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {pending.map(u => {
                  const daysLeft = u.deletion_scheduled_at
                    ? Math.max(0, Math.ceil((new Date(u.deletion_scheduled_at).getTime() - Date.now()) / 86400000))
                    : 0;
                  return (
                    <div key={u.id} style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', boxShadow: '0 1px 6px rgba(0,0,0,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <span style={{ fontWeight: 700, fontSize: 14, color: '#111' }}>@{u.username}</span>
                        <span style={{ fontSize: 12, color: '#FF3B30', fontWeight: 600, marginLeft: 'auto' }}>{daysLeft} giorni rimasti</span>
                      </div>
                      <div style={{ background: '#FFF3E0', borderRadius: 10, padding: '10px 14px', marginBottom: 8 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#F07B1D', marginBottom: 4 }}>MOTIVAZIONE CANCELLAZIONE</div>
                        <div style={{ fontSize: 13, color: '#444' }}>{u.deletion_reason}</div>
                      </div>
                      <div style={{ background: '#F5F5F5', borderRadius: 10, padding: '10px 14px', marginBottom: 12 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#555', marginBottom: 4 }}>RICORSO UTENTE</div>
                        <div style={{ fontSize: 13, color: '#444' }}>{u.appeal_text}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => approveAppeal(u.id)}
                          style={{ flex: 1, background: '#E8F5E9', color: '#34C759', border: 'none', borderRadius: 10, padding: '10px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                          ✓ Approva — ripristina account
                        </button>
                        <button onClick={() => { if (confirm(`Rifiutare il ricorso di @${u.username} ed eliminare l'account definitivamente?`)) rejectAppeal(u.id); }}
                          style={{ flex: 1, background: '#FFF0EE', color: '#FF3B30', border: 'none', borderRadius: 10, padding: '10px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                          ✕ Rifiuta — cancella per sempre
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>;
        })()}

      </div>

      {/* ── MODAL ELIMINA POST DA SEGNALAZIONE ── */}
      {reportDeleteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setReportDeleteModal(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 440 }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 800, color: '#111' }}>Elimina post segnalato</h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#888' }}>Seleziona o scrivi il motivo della rimozione.</p>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 6 }}>MOTIVO *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {POST_DELETE_REASONS.map(r => (
                <button key={r} onClick={() => setReportDeleteReason(r)}
                  style={{ background: reportDeleteReason === r ? '#FF3B30' : '#F5F5F5', color: reportDeleteReason === r ? '#fff' : '#555', border: 'none', borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  {r}
                </button>
              ))}
            </div>
            <textarea
              value={reportDeleteReason}
              onChange={e => setReportDeleteReason(e.target.value)}
              placeholder="Oppure scrivi un motivo personalizzato…"
              rows={3}
              style={{ width: '100%', border: '1.5px solid #EEE', borderRadius: 12, padding: '10px 14px', fontSize: 13, fontFamily: 'inherit', resize: 'none', outline: 'none', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={() => setReportDeleteModal(null)}
                style={{ flex: 1, background: '#F5F5F5', color: '#888', border: 'none', borderRadius: 12, padding: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                Annulla
              </button>
              <button onClick={deletePostFromReport} disabled={!reportDeleteReason.trim() || deletingPostId === reportDeleteModal.postId}
                style={{ flex: 1, background: reportDeleteReason.trim() ? '#FF3B30' : '#FFB3AE', color: '#fff', border: 'none', borderRadius: 12, padding: 12, fontWeight: 700, fontSize: 14, cursor: reportDeleteReason.trim() ? 'pointer' : 'not-allowed' }}>
                {deletingPostId === reportDeleteModal.postId ? 'Eliminazione…' : 'Elimina post'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CANCELLAZIONE ── */}
      {deleteModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          onClick={() => setDeleteModal(null)}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, padding: 28, width: '100%', maxWidth: 440 }}>
            <h3 style={{ margin: '0 0 6px', fontSize: 17, fontWeight: 800, color: '#111' }}>Pianifica cancellazione</h3>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#888' }}>
              L&apos;account <strong>@{deleteModal.username}</strong> sarà sospeso.<br/>
              L&apos;utente ha <strong>15 giorni</strong> per fare ricorso prima della cancellazione definitiva.
            </p>
            <label style={{ fontSize: 12, fontWeight: 700, color: '#555', display: 'block', marginBottom: 6 }}>MOTIVAZIONE *</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
              {ACCOUNT_DELETE_REASONS.map(r => (
                <button key={r} onClick={() => setDeleteReason(r)}
                  style={{ background: deleteReason === r ? '#FF3B30' : '#F5F5F5', color: deleteReason === r ? '#fff' : '#555', border: 'none', borderRadius: 20, padding: '5px 12px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                  {r}
                </button>
              ))}
            </div>
            <textarea
              value={deleteReason}
              onChange={e => setDeleteReason(e.target.value)}
              placeholder="Oppure scrivi una motivazione personalizzata…"
              rows={3}
              style={{ width: '100%', border: '1.5px solid #EEE', borderRadius: 12, padding: '10px 14px', fontSize: 13, fontFamily: 'inherit', resize: 'none', outline: 'none', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
              <button onClick={() => setDeleteModal(null)}
                style={{ flex: 1, background: '#F5F5F5', color: '#888', border: 'none', borderRadius: 12, padding: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                Annulla
              </button>
              <button onClick={scheduleDeletion} disabled={!deleteReason.trim() || deletingId === deleteModal.id}
                style={{ flex: 1, background: deleteReason.trim() ? '#FF3B30' : '#FFB3AE', color: '#fff', border: 'none', borderRadius: 12, padding: 12, fontWeight: 700, fontSize: 14, cursor: deleteReason.trim() ? 'pointer' : 'not-allowed' }}>
                {deletingId === deleteModal.id ? 'Salvataggio…' : 'Pianifica cancellazione'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
