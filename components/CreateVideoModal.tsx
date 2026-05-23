'use client';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { containsBlacklistedWord } from '@/lib/blacklist';
import { useLang } from '@/lib/i18n';

const MAX_MB = 50;
const MAX_BYTES = MAX_MB * 1024 * 1024;

const OFFICIAL_GROUP_NAMES = [
  'Pittura', 'Scultura', 'Moda e Fashion', 'Antiquariato', 'Letteratura', 'Fotografia', 'Cucina Chef', 'Tattoo',
  'Design', 'Architettura', 'Archeologia', 'Storia', 'Recitazione e Danza',
  'Musica', 'Fumettistica', 'Arte di Strada', 'Partner', 'Sponsor',
];

interface GroupOption { id: string; name: string; }

interface Props {
  visible: boolean;
  onClose: () => void;
  onPublished?: () => void;
  authorUserId?: string;
}

export default function CreateVideoModal({ visible, onClose, onPublished, authorUserId }: Props) {
  const { t } = useLang();
  const [step, setStep] = useState<'picker' | 'details'>('picker');
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [groups, setGroups] = useState<GroupOption[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [privacy, setPrivacy] = useState<'all' | 'me'>('all');
  const [publishing, setPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep('picker'); setFile(null); setPreview(null);
    setCaption(''); setSelectedGroupId(null); setPrivacy('all');
    setPublishing(false); setUploadProgress(0); setError(null);
  };
  const close = () => { reset(); onClose(); };

  useEffect(() => {
    if (!visible) return;
    (async () => {
      const { data } = await supabase.from('groups').select('id, name').in('name', OFFICIAL_GROUP_NAMES);
      if (data) {
        const sorted = OFFICIAL_GROUP_NAMES.map(n => data.find((g: any) => g.name === n)).filter(Boolean) as GroupOption[];
        setGroups(sorted);
      }
    })();
  }, [visible]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('video/')) { setError('Seleziona un file video (mp4, mov, webm…)'); return; }
    if (f.size > MAX_BYTES) { setError(`Il video supera il limite di ${MAX_MB}MB. Comprimi il video e riprova.`); return; }
    setError(null);
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setStep('details');
  };

  const publish = async () => {
    if (!file || publishing) return;
    const blocked = caption.trim() ? await containsBlacklistedWord(caption.trim()) : false;
    if (blocked) { setError(`Parola non consentita: "${blocked}"`); return; }
    setPublishing(true);
    setUploadProgress(0);
    try {
      let postUserId = authorUserId ?? null;
      if (!postUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setError('Non sei loggato.'); return; }
        const { data: dbUser } = await supabase.from('users').select('id').eq('auth_id', user.id).single();
        if (!dbUser) { setError('Profilo non trovato.'); return; }
        postUserId = dbUser.id;
      }

      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'mp4';
      const filePath = `videos/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const bytes = await file.arrayBuffer();
      setUploadProgress(30);

      const { error: upErr } = await supabase.storage.from('media').upload(filePath, bytes, { contentType: file.type, upsert: false });
      if (upErr) { setError(`Errore upload: ${upErr.message}`); return; }
      setUploadProgress(80);

      const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);
      const videoUrl = urlData.publicUrl;

      const selectedGroup = groups.find(g => g.id === selectedGroupId);
      const { error: insertErr } = await supabase.from('posts').insert({
        user_id:    postUserId,
        caption:    caption.trim(),
        image_urls: [],
        image_url:  null,
        video_url:  videoUrl,
        aspect_ratio: 1,
        post_type:  'video',
        privacy,
        ...(selectedGroup ? { group_id: selectedGroup.id, group_name: selectedGroup.name } : {}),
      });
      if (insertErr) { setError(`Errore pubblicazione: ${insertErr.message}`); return; }

      setUploadProgress(100);
      onPublished?.();
      close();
    } catch (e: any) {
      setError(e?.message || 'Errore durante la pubblicazione.');
    } finally {
      setPublishing(false);
    }
  };

  if (!visible) return null;

  const ORANGE = '#F07B1D';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#fff', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #F0F0F0', flexShrink: 0 }}>
        <button onClick={step === 'details' ? () => { setStep('picker'); setFile(null); setPreview(null); } : close}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#111', padding: 0, display: 'flex', alignItems: 'center' }}>
          <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            {step === 'details' ? <polyline points="15 18 9 12 15 6"/> : <><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></>}
          </svg>
        </button>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: '#111' }}>
          {step === 'picker' ? 'Carica video' : 'Dettagli video'}
        </span>
        {step === 'details' ? (
          <button onClick={publish} disabled={publishing}
            style={{ background: ORANGE, color: '#fff', border: 'none', borderRadius: 20, padding: '8px 20px', fontWeight: 700, fontSize: 15, cursor: publishing ? 'not-allowed' : 'pointer', opacity: publishing ? 0.7 : 1 }}>
            {publishing ? '…' : 'Pubblica'}
          </button>
        ) : <div style={{ width: 60 }} />}
      </div>

      {/* Error */}
      {error && (
        <div style={{ background: '#FFF0EE', color: '#FF3B30', fontSize: 13, fontWeight: 500, padding: '10px 20px', borderBottom: '1px solid #FFD0CC' }}>
          {error}
        </div>
      )}

      {/* Step: picker */}
      {step === 'picker' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 32 }}>
          <div style={{ width: 90, height: 90, borderRadius: 24, background: '#FFF0E6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="42" height="42" fill="none" stroke={ORANGE} strokeWidth="1.6" viewBox="0 0 24 24">
              <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
            </svg>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20, color: '#111', margin: '0 0 6px' }}>Carica un video</p>
            <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#AAA', margin: 0 }}>
              Formati: mp4, mov, webm · Max <strong style={{ color: '#111' }}>{MAX_MB}MB</strong>
            </p>
          </div>
          <button onClick={() => inputRef.current?.click()}
            style={{ background: ORANGE, color: '#fff', border: 'none', borderRadius: 16, padding: '14px 36px', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}>
            Scegli video
          </button>
          <input ref={inputRef} type="file" accept="video/mp4,video/quicktime,video/webm,video/*" style={{ display: 'none' }} onChange={handleFileChange} />
        </div>
      )}

      {/* Step: details */}
      {step === 'details' && preview && (
        <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 40 }}>
          {/* Video preview */}
          <div style={{ background: '#000', width: '100%' }}>
            <video src={preview} controls playsInline style={{ width: '100%', maxHeight: '45vh', display: 'block', objectFit: 'contain' }} />
          </div>

          {/* File info */}
          <div style={{ padding: '12px 20px', borderBottom: '1px solid #F5F5F5', display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="18" height="18" fill="none" stroke="#AAA" strokeWidth="1.8" viewBox="0 0 24 24">
              <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
            </svg>
            <span style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#888' }}>
              {file?.name} · {((file?.size || 0) / (1024 * 1024)).toFixed(1)}MB
            </span>
          </div>

          {/* Upload progress */}
          {publishing && (
            <div style={{ padding: '10px 20px', borderBottom: '1px solid #F5F5F5' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: 12, color: '#888', fontWeight: 500 }}>Caricamento…</span>
                <span style={{ fontSize: 12, color: ORANGE, fontWeight: 600 }}>{uploadProgress}%</span>
              </div>
              <div style={{ height: 4, background: '#F0F0F0', borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${uploadProgress}%`, background: ORANGE, borderRadius: 2, transition: 'width 0.3s' }} />
              </div>
            </div>
          )}

          {/* Caption */}
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #F5F5F5' }}>
            <label style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: '#AAA', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
              Didascalia (opzionale)
            </label>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              placeholder="Descrivi il tuo video…"
              maxLength={500}
              style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: 15, color: '#111', border: '1.5px solid #E8E8E8', borderRadius: 12, padding: '12px 14px', minHeight: 80, resize: 'none', outline: 'none', boxSizing: 'border-box', lineHeight: '22px' }}
            />
          </div>

          {/* Group */}
          {groups.length > 0 && (
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #F5F5F5' }}>
              <label style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: '#AAA', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
                Gruppo (opzionale)
              </label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {groups.map(g => (
                  <button key={g.id} onClick={() => setSelectedGroupId(v => v === g.id ? null : g.id)}
                    style={{ padding: '7px 14px', borderRadius: 20, border: selectedGroupId === g.id ? `2px solid ${ORANGE}` : '1.5px solid #E8E8E8', background: selectedGroupId === g.id ? '#FFF0E6' : '#fff', color: selectedGroupId === g.id ? ORANGE : '#555', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>
                    {g.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Privacy */}
          <div style={{ padding: '16px 20px' }}>
            <label style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: '#AAA', letterSpacing: '0.5px', textTransform: 'uppercase', display: 'block', marginBottom: 10 }}>
              Visibilità
            </label>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setPrivacy('all')}
                style={{ flex: 1, padding: '12px', borderRadius: 12, border: privacy === 'all' ? `2px solid ${ORANGE}` : '1.5px solid #E8E8E8', background: privacy === 'all' ? '#FFF0E6' : '#fff', color: privacy === 'all' ? ORANGE : '#555', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"/></svg>
                Tutti
              </button>
              <button onClick={() => setPrivacy('me')}
                style={{ flex: 1, padding: '12px', borderRadius: 12, border: privacy === 'me' ? `2px solid ${ORANGE}` : '1.5px solid #E8E8E8', background: privacy === 'me' ? '#FFF0E6' : '#fff', color: privacy === 'me' ? ORANGE : '#555', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                Solo io
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
