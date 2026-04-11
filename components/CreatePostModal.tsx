'use client';
import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface Props {
  visible: boolean; onClose: () => void;
  onPublished: () => void; authorUserId?: string;
}

export default function CreatePostModal({ visible, onClose, onPublished, authorUserId }: Props) {
  const [caption, setCaption] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [tags, setTags] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []).slice(0, 10);
    setFiles(selected);
    setPreviews(selected.map(f => URL.createObjectURL(f)));
  };

  const handlePublish = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: dbUser } = await supabase.from('users').select('id').eq('auth_id', user.id).single();
      if (!dbUser) return;
      const userId = authorUserId || dbUser.id;

      const imageUrls: string[] = [];
      for (const file of files) {
        const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
        const path = `posts/${userId}_${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const bytes = await file.arrayBuffer();
        const { error: upErr } = await supabase.storage.from('media').upload(path, bytes, { contentType: file.type, upsert: true });
        if (!upErr) {
          const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);
          imageUrls.push(urlData.publicUrl);
        }
      }

      const { data: post, error } = await supabase.from('posts').insert({
        user_id: userId, caption: caption.trim() || null,
        image_urls: imageUrls.length > 0 ? imageUrls : null,
        image_url: imageUrls[0] || null,
        aspect_ratio: 1,
      }).select().single();

      if (!error && post && tags.trim()) {
        const tagArr = tags.split(',').map((t: string) => t.trim()).filter(Boolean);
        if (tagArr.length > 0) {
          await supabase.from('post_tags').insert(tagArr.map((tag: string) => ({ post_id: post.id, tag })));
        }
      }

      onClose();
      setCaption(''); setFiles([]); setPreviews([]); setTags('');
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
          <span className="modal-title" style={{ fontSize: 17 }}>Nuovo Post</span>
          <button onClick={handlePublish} disabled={loading || (files.length === 0 && !caption.trim())}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: '#F07B1D', opacity: (loading || (files.length === 0 && !caption.trim())) ? 0.4 : 1 }}>
            {loading ? '...' : 'Pubblica'}
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 20px 32px' }}>
          {/* Image picker */}
          <div
            onClick={() => inputRef.current?.click()}
            style={{ border: '2px dashed #DDD', borderRadius: 16, padding: previews.length ? 0 : '40px 20px', textAlign: 'center', cursor: 'pointer', marginBottom: 20, overflow: 'hidden', background: previews.length ? 'none' : '#FAFAFA' }}>
            {previews.length > 0 ? (
              <div style={{ display: 'flex', gap: 4, overflowX: 'auto' }}>
                {previews.map((p, i) => <img key={i} src={p} alt="" style={{ height: 200, width: 'auto', objectFit: 'cover', borderRadius: 12, flexShrink: 0 }} />)}
              </div>
            ) : (
              <>
                <div style={{ fontSize: 36, marginBottom: 8 }}>🖼️</div>
                <p style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15, color: '#111' }}>Aggiungi foto</p>
                <p style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#888', marginTop: 4 }}>Fino a 10 immagini</p>
              </>
            )}
          </div>
          <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFiles} />

          <div className="input-group">
            <label className="input-label">Didascalia</label>
            <textarea
              className="input-field"
              placeholder="Scrivi una didascalia..."
              value={caption}
              onChange={e => setCaption(e.target.value)}
              maxLength={500}
              rows={3}
              style={{ height: 'auto', paddingTop: 12, resize: 'none' }}
            />
          </div>

          <div className="input-group">
            <label className="input-label">Tag (separati da virgola)</label>
            <input className="input-field" type="text" placeholder="pittura, olio, arte" value={tags} onChange={e => setTags(e.target.value)} />
          </div>
        </div>
      </div>
    </div>
  );
}
