'use client';

import { useState, useEffect, useMemo } from 'react';
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
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function AdminPage() {
  const [status, setStatus] = useState<'loading' | 'forbidden' | 'ok'>('loading');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [filter, setFilter] = useState<'all' | 'promo' | 'no_promo'>('all');
  const [search, setSearch] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setStatus('forbidden'); return; }

      const { data: dbUser } = await supabase
        .from('users')
        .select('role')
        .eq('auth_id', user.id)
        .single();

      if (dbUser?.role !== 'admin') { setStatus('forbidden'); return; }

      setStatus('ok');
      setLoadingUsers(true);
      const { data } = await supabase
        .from('users')
        .select('id, name, username, email, phone, nationality, accepts_promotions, created_at, role')
        .order('created_at', { ascending: false });
      setUsers((data as any) ?? []);
      setLoadingUsers(false);
    }
    checkAuth();
  }, []);

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

  return (
    <div style={{ minHeight: '100dvh', background: '#F5F5F5', fontFamily: "'Plus Jakarta Sans', sans-serif", paddingBottom: 60 }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid #EEE', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <div>
          <span style={{ fontFamily: "'Poppins', sans-serif", fontSize: 22, fontWeight: 800, color: '#F07B1D', letterSpacing: -1 }}>JES</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: '#888', marginLeft: 10 }}>Admin</span>
        </div>
        <div style={{ fontSize: 13, color: '#888' }}>{users.length} utenti totali</div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 16px' }}>

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
            <a
              href={`mailto:?bcc=${promoEmails.join(',')}&subject=Novità da JES&body=Ciao!`}
              style={{ background: '#F5F5F5', color: '#111', border: '1.5px solid #EEE', borderRadius: 10, padding: '9px 18px', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}
            >
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
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cerca nome, username, email, nazione…"
            style={{ flex: 1, minWidth: 200, border: '1.5px solid #EEE', borderRadius: 10, padding: '9px 14px', fontSize: 13, outline: 'none', fontFamily: 'inherit', background: '#fff' }}
          />
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
                    {['Nome', 'Username', 'Email', 'Telefono', 'Nazionalità', 'Promo', 'Iscritto'].map(h => (
                      <th key={h} style={{ padding: '12px 14px', textAlign: 'left', fontWeight: 700, color: '#888', fontSize: 12, letterSpacing: 0.3, whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr><td colSpan={7} style={{ padding: 32, textAlign: 'center', color: '#AAA' }}>Nessun utente trovato</td></tr>
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
                      <td style={{ padding: '11px 14px', color: '#888', whiteSpace: 'nowrap' }}>{formatDate(u.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
