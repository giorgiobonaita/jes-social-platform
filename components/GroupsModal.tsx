'use client';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Props {
  visible: boolean; onClose: () => void;
  initialGroupId?: string;
  onPostPublished: (post: any) => void;
}

export default function GroupsModal({ visible, onClose, initialGroupId, onPostPublished }: Props) {
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!visible) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase.from('groups').select('*').order('members_count', { ascending: false }).limit(30);
      setGroups(data || []);
      setLoading(false);
    })();
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" style={{ maxHeight: '85dvh', display: 'flex', flexDirection: 'column', paddingBottom: 0 }} onClick={e => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-header" style={{ padding: '0 20px 12px', borderBottom: '1px solid #EEE' }}>
          <span className="modal-title">Gruppi</span>
          <button className="modal-close" onClick={onClose}>
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 20px 32px' }}>
          {loading ? (
            <div className="spinner"><div className="spin" /></div>
          ) : groups.length === 0 ? (
            <p className="empty-text">Nessun gruppo disponibile</p>
          ) : (
            groups.map(g => (
              <div key={g.id} className="user-row">
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#F0F0F0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                  {g.emoji || '👥'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: '#111' }}>{g.name}</div>
                  <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#888' }}>{g.members_count || 0} membri</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
