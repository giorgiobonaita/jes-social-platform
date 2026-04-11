'use client';
import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface Props {
  visible: boolean; onClose: () => void;
  onPublished: () => void; authorUserId?: string;
}

export default function CreateStoryModal({ visible, onClose, onPublished, authorUserId }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setPreview(URL.createObjectURL(f)); }
  };

  const handlePublish = async () => {
    if (!file || loading) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: dbUser } = await supabase.from('users').select('id').eq('auth_id', user.id).single();
      if (!dbUser) return;
      const userId = authorUserId || dbUser.id;

      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const path = `stories/${userId}_${Date.now()}.${ext}`;
      const bytes = await file.arrayBuffer();
      const { error: upErr } = await supabase.storage.from('media').upload(path, bytes, { contentType: file.type, upsert: true });
      if (upErr) { setLoading(false); return; }

      const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
      const expiresAt = new Date(Date.now() + 24 * 3600 * 1000).toISOString();
      await supabase.from('stories').insert({ user_id: userId, image_url: urlData.publicUrl, expires_at: expiresAt, privacy: 'all' });

      onClose(); setFile(null); setPreview(null);
      onPublished();
    } catch {}
    finally { setLoading(false); }
  };

  if (!visible) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" style={{ maxHeight: '90dvh', display: 'flex', flexDirection: 'column', paddingBottom: 0 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header" style={{ padding: '0 20px 12px', borderBottom: '1px solid #EEE', marginBottom: 16 }}>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontSize: 15, color: '#888' }}>Annulla</button>
          <span className="modal-title" style={{ fontSize: 17 }}>Nuova Storia</span>
          <button onClick={handlePublish} disabled={!file || loading}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: '#F07B1D', opacity: (!file || loading) ? 0.4 : 1 }}>
            {loading ? '...' : 'Pubblica'}
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 32px' }}>
          <div onClick={() => inputRef.current?.click()}
            style={{ border: '2px dashed #DDD', borderRadius: 16, overflow: 'hidden', cursor: 'pointer', marginBottom: 20, background: preview ? 'none' : '#FAFAFA', padding: preview ? 0 : '60px 20px', textAlign: 'center' }}>
            {preview
              ? <img src={preview} alt="" style={{ width: '100%', maxHeight: 400, objectFit: 'cover', display: 'block' }} />
              : <>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>▶️</div>
                  <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15, color: '#111' }}>Aggiungi foto per la storia</p>
                  <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#888', marginTop: 4 }}>Scomparirà dopo 24 ore</p>
                </>
            }
          </div>
          <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
        </div>
      </div>
    </div>
  );
}
