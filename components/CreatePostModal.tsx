'use client';
import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const ORANGE = '#F07B1D';

const PRIVACY_OPTIONS = [
  { id: 'all', label: 'Pubblico',  desc: 'Chiunque può vedere' },
  { id: 'me',  label: 'Solo io',   desc: 'Privato' },
] as const;

const OFFICIAL_GROUP_NAMES = [
  'Pittura', 'Scultura', 'Letteratura', 'Fotografia', 'Cucina Chef', 'Tattoo',
  'Design', 'Architettura', 'Archeologia', 'Storia', 'Recitazione e Danza',
  'Musica', 'Fumettistica', 'Arte di Strada', 'Partner',
];

interface GroupOption { id: string; name: string; }

type Step = 'picker' | 'details';

interface Props {
  visible: boolean;
  onClose: () => void;
  onPublished: () => void;
  authorUserId?: string;
}

/** Inline hashtag preview — highlights #tags in orange */
function DescriptionPreview({ text }: { text: string }) {
  const parts = text.split(/(\s)/);
  return (
    <div style={{ fontFamily: 'var(--font-body)', fontSize: 16, color: '#111', lineHeight: '24px', padding: '13px 16px', minHeight: 110, cursor: 'text', wordBreak: 'break-word' }}>
      {parts.map((part, i) =>
        part.startsWith('#')
          ? <span key={i} style={{ color: ORANGE, fontWeight: 600 }}>{part}</span>
          : <span key={i}>{part}</span>
      )}
    </div>
  );
}

export default function CreatePostModal({ visible, onClose, onPublished, authorUserId }: Props) {
  const [step, setStep]                     = useState<Step>('picker');
  const [files, setFiles]                   = useState<File[]>([]);
  const [previews, setPreviews]             = useState<string[]>([]);
  const [groups, setGroups]                 = useState<GroupOption[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [title, setTitle]                   = useState('');
  const [description, setDescription]       = useState('');
  const [privacy, setPrivacy]               = useState<'all' | 'me'>('all');
  const [descFocused, setDescFocused]       = useState(false);
  const [publishing, setPublishing]         = useState(false);
  const fileInputRef  = useRef<HTMLInputElement>(null);
  const changeFileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep('picker'); setFiles([]); setPreviews([]); setTitle(''); setDescription('');
    setPrivacy('all'); setDescFocused(false); setSelectedGroupId(null);
  };
  const close = () => { reset(); onClose(); };

  useEffect(() => {
    if (!visible) return;
    (async () => {
      const { data } = await supabase.from('groups').select('id, name').in('name', OFFICIAL_GROUP_NAMES);
      if (data) {
        const sorted = OFFICIAL_GROUP_NAMES.map(name => data.find((g: any) => g.name === name)).filter(Boolean) as GroupOption[];
        setGroups(sorted);
      }
    })();
  }, [visible]);

  const onFilesSelected = (selected: File[]) => {
    const items = selected.slice(0, 10);
    setFiles(items);
    setPreviews(items.map(f => URL.createObjectURL(f)));
    setStep('details');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length > 0) onFilesSelected(selected);
    e.target.value = '';
  };

  const uploadImage = async (file: File): Promise<string> => {
    const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    const filePath = `posts/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const bytes = await file.arrayBuffer();
    const { error } = await supabase.storage.from('media').upload(filePath, bytes, { contentType: file.type, upsert: false });
    if (error) throw new Error(error.message);
    const { data } = supabase.storage.from('media').getPublicUrl(filePath);
    return data.publicUrl;
  };

  const canPublish = title.trim().length > 0 && description.trim().length > 0 && files.length > 0;

  const publish = async () => {
    if (!canPublish || publishing) return;
    setPublishing(true);
    try {
      let postUserId = authorUserId ?? null;
      if (!postUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Non sei loggato.');
        const { data: dbUser, error: userErr } = await supabase.from('users').select('id').eq('auth_id', user.id).single();
        if (userErr || !dbUser) throw new Error('Profilo non trovato.');
        postUserId = dbUser.id;
      }

      const uploadedUrls = await Promise.all(files.map(uploadImage));
      const selectedGroup = groups.find(g => g.id === selectedGroupId);

      const { data: post, error: postErr } = await supabase.from('posts').insert({
        user_id:      postUserId,
        caption:      `${title.trim()}\n\n${description.trim()}`,
        image_urls:   uploadedUrls,
        image_url:    uploadedUrls[0] ?? null,
        aspect_ratio: 1,
        privacy,
        ...(selectedGroup ? { group_id: selectedGroup.id, group_name: selectedGroup.name } : {}),
      }).select('id').single();

      if (postErr || !post) throw new Error(`Errore DB: ${postErr?.message}`);

      const tags = [...new Set((description.match(/#\w+/g) || []).map(t => t.slice(1)))];
      if (tags.length > 0) {
        await supabase.from('post_tags').insert(tags.map(tag => ({ post_id: post.id, tag })));
      }

      close();
      onPublished();
    } catch (e: any) {
      alert(e.message || 'Impossibile pubblicare. Riprova.');
    } finally { setPublishing(false); }
  };

  if (!visible) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, backgroundColor: '#fff', display: 'flex', flexDirection: 'column' }}>

      {step === 'picker' && (
        <>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #F0F0F0' }}>
            <button onClick={close} style={{ width: 40, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}>
              <svg width="24" height="24" fill="none" stroke="#111" strokeWidth="2.2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 18, color: '#111' }}>Nuovo post</span>
            <div style={{ width: 40 }} />
          </div>
          {/* Picker area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40, gap: 20 }}>
            <div onClick={() => fileInputRef.current?.click()}
              style={{ width: '100%', maxWidth: 360, border: '2px dashed #DDD', borderRadius: 24, padding: '50px 30px', textAlign: 'center', cursor: 'pointer', backgroundColor: '#FAFAFA', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <svg width="56" height="56" fill="none" stroke="#CCC" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
              <div>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 17, color: '#111', marginBottom: 6 }}>Aggiungi foto</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#888' }}>Fino a 10 immagini · JPG, PNG, HEIC</div>
              </div>
              <div style={{ backgroundColor: ORANGE, borderRadius: 22, padding: '12px 28px' }}>
                <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: '#fff' }}>Scegli foto</span>
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFileChange} />
          </div>
        </>
      )}

      {step === 'details' && (
        <>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', borderBottom: '1px solid #F0F0F0' }}>
            <button onClick={() => setStep('picker')} style={{ width: 40, background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}>
              <svg width="24" height="24" fill="none" stroke="#111" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 18, color: '#111' }}>Nuovo post</span>
            <button onClick={publish} disabled={!canPublish || publishing}
              style={{ backgroundColor: canPublish && !publishing ? ORANGE : '#E0E0E0', border: 'none', borderRadius: 22, padding: '10px 20px', cursor: canPublish && !publishing ? 'pointer' : 'default', transition: 'background .15s' }}>
              {publishing
                ? <div className="spin" style={{ width: 16, height: 16, borderColor: 'rgba(255,255,255,0.4)', borderTopColor: '#fff' }} />
                : <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: '#fff' }}>Pubblica</span>
              }
            </button>
          </div>

          {/* Scrollable form */}
          <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 60 }}>
            {/* Photos preview */}
            {previews.length === 1 ? (
              <img src={previews[0]} style={{ width: '100%', height: 'auto', maxHeight: '75vw', objectFit: 'cover', display: 'block' }} alt="" />
            ) : (
              <div style={{ display: 'flex', gap: 10, overflowX: 'auto', padding: '16px 16px', scrollbarWidth: 'none' }}>
                {previews.map((p, i) => (
                  <img key={i} src={p} style={{ width: 160, height: 160, borderRadius: 14, objectFit: 'cover', flexShrink: 0 }} alt="" />
                ))}
              </div>
            )}

            {/* Change photo button */}
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10, marginBottom: 4 }}>
              <button onClick={() => changeFileRef.current?.click()}
                style={{ display: 'flex', alignItems: 'center', gap: 6, backgroundColor: '#F5F5F5', border: 'none', borderRadius: 16, padding: '8px 16px', cursor: 'pointer' }}>
                <svg width="16" height="16" fill="none" stroke="#888" strokeWidth="1.8" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                <span style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13, color: '#666' }}>Cambia foto</span>
              </button>
              <input ref={changeFileRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFileChange} />
            </div>

            {/* Title */}
            <div style={{ padding: '22px 20px 0' }}>
              <label style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15, color: '#333', display: 'block', marginBottom: 10 }}>
                Titolo <span style={{ color: ORANGE }}>*</span>
              </label>
              <input
                style={{ width: '100%', fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 16, color: '#111', border: '1.5px solid #E8E8E8', borderRadius: 14, padding: '13px 16px', outline: 'none', boxSizing: 'border-box' }}
                placeholder='Es. «La mia ultima opera»'
                value={title}
                onChange={e => setTitle(e.target.value)}
                maxLength={100}
              />
            </div>

            {/* Description */}
            <div style={{ padding: '22px 20px 0' }}>
              <label style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15, color: '#333', display: 'block', marginBottom: 10 }}>
                Descrizione <span style={{ color: ORANGE }}>*</span>
                <span style={{ fontFamily: 'var(--font-body)', fontWeight: 400, fontSize: 12, color: '#BBB', marginLeft: 8 }}>Scrivi #hashtag per evidenziarli</span>
              </label>
              <div style={{ border: '1.5px solid #E8E8E8', borderRadius: 14, minHeight: 110, overflow: 'hidden', position: 'relative' }}>
                {!descFocused && description.length > 0
                  ? <div onClick={() => setDescFocused(true)}><DescriptionPreview text={description} /></div>
                  : <textarea
                      style={{ width: '100%', fontFamily: 'var(--font-body)', fontSize: 16, color: '#111', border: 'none', outline: 'none', padding: '13px 16px', minHeight: 110, lineHeight: '24px', resize: 'none', boxSizing: 'border-box', backgroundColor: 'transparent' }}
                      placeholder={'Racconta qualcosa sul tuo lavoro...\n\nUsa #hashtag per essere trovato più facilmente'}
                      value={description}
                      onChange={e => setDescription(e.target.value)}
                      maxLength={500}
                      rows={5}
                      onFocus={() => setDescFocused(true)}
                      onBlur={() => setDescFocused(false)}
                      autoFocus={descFocused}
                    />
                }
              </div>
              {descFocused && description.includes('#') && (
                <div style={{ marginTop: 8, padding: 12, backgroundColor: '#FFF8F3', borderRadius: 12, border: `1px solid ${ORANGE}30` }}>
                  <DescriptionPreview text={description} />
                </div>
              )}
            </div>

            {/* Gruppo */}
            {groups.length > 0 && (
              <div style={{ padding: '22px 20px 0' }}>
                <label style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15, color: '#333', display: 'block', marginBottom: 10 }}>
                  Pubblica anche nel gruppo <span style={{ fontWeight: 400, fontSize: 12, color: '#AAA' }}>(opzionale)</span>
                </label>
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none' }}>
                  <button onClick={() => setSelectedGroupId(null)}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 14px', borderRadius: 20, border: `1.5px solid ${!selectedGroupId ? ORANGE : '#E8E8E8'}`, backgroundColor: !selectedGroupId ? ORANGE : '#FAFAFA', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>
                    <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: !selectedGroupId ? '#fff' : '#888' }}>Solo feed</span>
                  </button>
                  {groups.map(g => (
                    <button key={g.id} onClick={() => setSelectedGroupId(g.id)}
                      style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 14px', borderRadius: 20, border: `1.5px solid ${selectedGroupId === g.id ? ORANGE : '#E8E8E8'}`, backgroundColor: selectedGroupId === g.id ? ORANGE : '#FAFAFA', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap' }}>
                      <svg width="13" height="13" fill="none" stroke={selectedGroupId === g.id ? '#fff' : '#888'} strokeWidth="1.8" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
                      <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 13, color: selectedGroupId === g.id ? '#fff' : '#888' }}>{g.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Privacy */}
            <div style={{ padding: '22px 20px 0' }}>
              <label style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15, color: '#333', display: 'block', marginBottom: 10 }}>Chi può vedere</label>
              <div style={{ display: 'flex', gap: 10 }}>
                {PRIVACY_OPTIONS.map(opt => {
                  const active = privacy === opt.id;
                  return (
                    <button key={opt.id} onClick={() => setPrivacy(opt.id)}
                      style={{ flex: 1, border: `1.5px solid ${active ? ORANGE : '#E8E8E8'}`, borderRadius: 16, padding: 14, display: 'flex', flexDirection: 'column', gap: 5, backgroundColor: active ? '#FFF8F3' : '#FAFAFA', cursor: 'pointer', alignItems: 'flex-start', textAlign: 'left' }}>
                      <svg width="22" height="22" fill="none" stroke={active ? ORANGE : '#999'} strokeWidth="1.8" viewBox="0 0 24 24">
                        {opt.id === 'all'
                          ? <circle cx="12" cy="12" r="10"/>
                          : <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>
                        }
                      </svg>
                      <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: active ? ORANGE : '#444' }}>{opt.label}</span>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#AAA' }}>{opt.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
