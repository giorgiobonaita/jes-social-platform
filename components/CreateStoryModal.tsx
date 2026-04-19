'use client';
import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/lib/i18n';

const ORANGE = '#F07B1D';

const TEXT_COLORS = ['#FFFFFF', '#000000', ORANGE, '#FFD700', '#FF3B30', '#34C759', '#5B6AF5'];

interface TextOverlay { id: string; text: string; y: number; color: string; }

type Step = 'picker' | 'editor';

interface Props {
  visible: boolean;
  onClose: () => void;
  onPublished: () => void;
  authorUserId?: string;
}

export default function CreateStoryModal({ visible, onClose, onPublished, authorUserId }: Props) {
  const { t } = useLang();
  
  const PRIVACY_OPTS = [
    { id: 'all', label: t('privacy_public'), desc: t('privacy_public_desc') },
    { id: 'me',  label: t('privacy_private'),  desc: t('privacy_private_desc') },
  ] as const;

  const [step, setStep]                   = useState<Step>('picker');
  const [file, setFile]                   = useState<File | null>(null);
  const [preview, setPreview]             = useState<string | null>(null);
  const [overlays, setOverlays]           = useState<TextOverlay[]>([]);
  const [showTextInput, setShowTextInput] = useState(false);
  const [currentText, setCurrentText]     = useState('');
  const [textColor, setTextColor]         = useState('#FFFFFF');
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [linkText, setLinkText]           = useState('');
  const [showMentionInput, setShowMentionInput] = useState(false);
  const [mentionText, setMentionText]     = useState('');
  const [privacy, setPrivacy]             = useState<'all' | 'me'>('all');
  const [showPrivacy, setShowPrivacy]     = useState(false);
  const [publishing, setPublishing]       = useState(false);
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const changeFileRef  = useRef<HTMLInputElement>(null);

  const reset = () => {
    setStep('picker'); setFile(null); setPreview(null); setOverlays([]); setCurrentText('');
    setTextColor('#FFFFFF'); setLinkText(''); setMentionText(''); setPrivacy('all');
    setShowTextInput(false); setShowLinkInput(false); setShowMentionInput(false); setShowPrivacy(false);
  };
  const close = () => { reset(); onClose(); };
  const closeAllInputs = () => { setShowTextInput(false); setShowLinkInput(false); setShowMentionInput(false); setShowPrivacy(false); };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) { setFile(f); setPreview(URL.createObjectURL(f)); setStep('editor'); }
    e.target.value = '';
  };

  const addText = () => {
    if (!currentText.trim()) return;
    setOverlays(prev => [...prev, { id: Date.now().toString(), text: currentText.trim(), y: 180 + prev.length * 56, color: textColor }]);
    setCurrentText(''); setShowTextInput(false);
  };

  const publish = async () => {
    if (!file || publishing) return;
    setPublishing(true);
    try {
      let storyUserId = authorUserId ?? null;
      if (!storyUserId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error(t('not_logged'));
        const { data: dbUser, error: userErr } = await supabase.from('users').select('id').eq('auth_id', user.id).single();
        if (userErr || !dbUser) throw new Error(t('profile_not_found'));
        storyUserId = dbUser.id;
      }
      const ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const filePath = `stories/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
      const bytes = await file.arrayBuffer();
      const { error: uploadErr } = await supabase.storage.from('media').upload(filePath, bytes, { contentType: file.type, upsert: false });
      if (uploadErr) throw new Error(uploadErr.message);
      const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);
      const expires = new Date();
      expires.setDate(expires.getDate() + 30);
      const { error: storyErr } = await supabase.from('stories').insert({
        user_id: storyUserId, image_url: urlData.publicUrl,
        link_url: linkText || null, mention: mentionText || null,
        privacy, expires_at: expires.toISOString(),
      });
      if (storyErr) throw new Error(storyErr.message);
      close(); onPublished();
    } catch (e: any) {
      alert(e.message || 'Error');
    } finally { setPublishing(false); }
  };

  if (!visible) return null;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 200, backgroundColor: '#000', display: 'flex', flexDirection: 'column' }}>

      {/* ── STEP: picker ── */}
      {step === 'picker' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: 40 }}>
          <button onClick={close} style={{ position: 'absolute', top: 16, left: 16, width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2.2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <svg width="64" height="64" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 18, color: '#fff', marginBottom: 8 }}>{t('add_photo_story')}</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>{t('visible_days').replace('{days}', '30')}</div>
          </div>
          <button onClick={() => fileInputRef.current?.click()}
            style={{ backgroundColor: ORANGE, border: 'none', borderRadius: 26, padding: '14px 32px', cursor: 'pointer' }}>
            <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16, color: '#fff' }}>{t('choose_photo')}</span>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
        </div>
      )}

      {/* ── STEP: editor ── */}
      {step === 'editor' && (
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          {/* Background */}
          {preview && <img src={preview} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} alt="" />}
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)' }} />

          {/* Text overlays */}
          {overlays.map(ov => (
            <div key={ov.id} style={{ position: 'absolute', left: 20, top: ov.y, fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 24, color: ov.color, textShadow: '1px 1px 6px rgba(0,0,0,0.8)', pointerEvents: 'none' }}>
              {ov.text}
            </div>
          ))}

          {/* Link badge */}
          {linkText && (
            <div style={{ position: 'absolute', bottom: 140, left: '50%', transform: 'translateX(-50%)', display: 'flex', alignItems: 'center', gap: 6, backgroundColor: 'rgba(0,0,0,0.65)', padding: '9px 16px', borderRadius: 22 }}>
              <svg width="13" height="13" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
              <span style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 13, color: '#fff', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{linkText}</span>
            </div>
          )}

          {/* Mention badge */}
          {mentionText && (
            <div style={{ position: 'absolute', bottom: 185, left: '50%', transform: 'translateX(-50%)', backgroundColor: 'rgba(240,123,29,0.9)', padding: '9px 16px', borderRadius: 22 }}>
              <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: '#fff' }}>@{mentionText}</span>
            </div>
          )}

          {/* Top bar */}
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 14 }}>
            <button onClick={() => setStep('picker')}
              style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(0,0,0,0.4)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="22" height="22" fill="none" stroke="#fff" strokeWidth="2.2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { label: t('text_tool'), icon: <svg width="19" height="19" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>, action: () => { closeAllInputs(); setShowTextInput(true); } },
                { label: t('link_tool'), icon: <svg width="19" height="19" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>, action: () => { closeAllInputs(); setShowLinkInput(true); } },
                { label: t('photo_tool'), icon: <svg width="19" height="19" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>, action: () => changeFileRef.current?.click() },
                { label: t('mention_tool'), icon: <svg width="19" height="19" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 006 0v-1a10 10 0 10-3.92 7.94"/></svg>, action: () => { closeAllInputs(); setShowMentionInput(true); } },
              ].map(t => (
                <button key={t.label} onClick={t.action}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 14, padding: '7px 10px', gap: 2, border: 'none', cursor: 'pointer' }}>
                  {t.icon}
                  <span style={{ fontFamily: 'var(--font-body)', fontWeight: 500, fontSize: 10, color: '#fff' }}>{t.label}</span>
                </button>
              ))}
            </div>
          </div>
          <input ref={changeFileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

          {/* Text input panel */}
          {showTextInput && (
            <div style={{ position: 'absolute', bottom: 90, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.85)', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15, color: '#fff', marginBottom: 4 }}>{t('add_text')}</span>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 4 }}>
                {TEXT_COLORS.map(c => (
                  <button key={c} onClick={() => setTextColor(c)}
                    style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: c, border: textColor === c ? '3px solid #fff' : '2.5px solid transparent', cursor: 'pointer', flexShrink: 0, transform: textColor === c ? 'scale(1.25)' : 'none' }} />
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  style={{ flex: 1, background: 'none', border: 'none', borderBottom: '1.5px solid rgba(255,255,255,0.3)', outline: 'none', fontFamily: 'var(--font-body)', fontSize: 16, color: textColor, paddingBottom: 6 }}
                  placeholder={t('write_something')}
                  value={currentText}
                  onChange={e => setCurrentText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') addText(); }}
                  autoFocus
                />
                <button onClick={addText} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: ORANGE, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                </button>
                <button onClick={() => setShowTextInput(false)} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
          )}

          {/* Link input panel */}
          {showLinkInput && (
            <div style={{ position: 'absolute', bottom: 90, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.85)', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15, color: '#fff', marginBottom: 4 }}>{t('add_link')}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  style={{ flex: 1, background: 'none', border: 'none', borderBottom: '1.5px solid rgba(255,255,255,0.3)', outline: 'none', fontFamily: 'var(--font-body)', fontSize: 16, color: '#fff', paddingBottom: 6 }}
                  placeholder="https://..."
                  value={linkText}
                  onChange={e => setLinkText(e.target.value)}
                  autoFocus
                />
                <button onClick={() => setShowLinkInput(false)} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: ORANGE, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                </button>
              </div>
            </div>
          )}

          {/* Mention input panel */}
          {showMentionInput && (
            <div style={{ position: 'absolute', bottom: 90, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.85)', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 15, color: '#fff', marginBottom: 4 }}>{t('mention_someone')}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 20, color: '#fff' }}>@</span>
                <input
                  style={{ flex: 1, background: 'none', border: 'none', borderBottom: '1.5px solid rgba(255,255,255,0.3)', outline: 'none', fontFamily: 'var(--font-body)', fontSize: 16, color: '#fff', paddingBottom: 6 }}
                  placeholder="username"
                  value={mentionText}
                  onChange={e => setMentionText(e.target.value)}
                  autoFocus
                />
                <button onClick={() => setShowMentionInput(false)} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: ORANGE, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="20" height="20" fill="none" stroke="#fff" strokeWidth="2.5" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>
                </button>
              </div>
            </div>
          )}

          {/* Bottom bar: privacy + publish */}
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 28px', backgroundColor: 'rgba(0,0,0,0.55)' }}>
            <button onClick={() => setShowPrivacy(p => !p)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, backgroundColor: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: 22, padding: '11px 14px', cursor: 'pointer' }}>
              <svg width="17" height="17" fill="none" stroke="#fff" strokeWidth="2" viewBox="0 0 24 24">
                {privacy === 'all' ? <circle cx="12" cy="12" r="10"/> : <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>}
              </svg>
              <span style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, color: '#fff' }}>{PRIVACY_OPTS.find(p => p.id === privacy)?.label}</span>
              <svg width="13" height="13" fill="none" stroke="rgba(255,255,255,0.6)" strokeWidth="2.2" viewBox="0 0 24 24"><polyline points="18 15 12 9 6 15"/></svg>
            </button>
            <button onClick={publish} disabled={publishing}
              style={{ display: 'flex', alignItems: 'center', gap: 8, backgroundColor: ORANGE, border: 'none', borderRadius: 26, padding: '13px 22px', cursor: publishing ? 'default' : 'pointer' }}>
              {publishing
                ? <div className="spin" style={{ width: 18, height: 18, borderColor: 'rgba(255,255,255,0.4)', borderTopColor: '#fff' }} />
                : <>
                    <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16, color: '#fff' }}>{t('publish_story')}</span>
                    <svg width="18" height="18" fill="none" stroke="#fff" strokeWidth="2.2" viewBox="0 0 24 24"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </>
              }
            </button>
          </div>

          {/* Privacy sheet */}
          {showPrivacy && (
            <div style={{ position: 'absolute', bottom: 85, left: 12, right: 12, backgroundColor: '#fff', borderRadius: 22, padding: 20, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <span style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16, color: '#111', display: 'block', marginBottom: 14 }}>{t('who_can_see_story')}</span>
              {PRIVACY_OPTS.map(opt => (
                <button key={opt.id} onClick={() => { setPrivacy(opt.id); setShowPrivacy(false); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '13px 0', borderBottom: '1px solid #F5F5F5', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', borderBottomWidth: 1, borderBottomColor: '#F5F5F5', paddingTop: 13, paddingBottom: 13 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: privacy === opt.id ? ORANGE : '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <svg width="20" height="20" fill="none" stroke={privacy === opt.id ? '#fff' : '#555'} strokeWidth="2" viewBox="0 0 24 24">
                      {opt.id === 'all' ? <circle cx="12" cy="12" r="10"/> : <><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></>}
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 15, color: privacy === opt.id ? ORANGE : '#222' }}>{opt.label}</div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 12, color: '#AAA', marginTop: 2 }}>{opt.desc}</div>
                  </div>
                  {privacy === opt.id && (
                    <svg width="22" height="22" fill={ORANGE} viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01" stroke="white" strokeWidth="2" fill="none"/></svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

