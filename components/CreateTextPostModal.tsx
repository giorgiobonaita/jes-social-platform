'use client';
import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { containsBlacklistedWord } from '@/lib/blacklist';
import { useLang } from '@/lib/i18n';

const BACKGROUNDS: { id: string; value: string; label: string }[] = [
  { id: 'g1',  value: 'linear-gradient(135deg,#F07B1D,#FF5E5E)', label: 'Fuoco' },
  { id: 'g2',  value: 'linear-gradient(135deg,#5B6AF5,#A855F7)', label: 'Viola' },
  { id: 'g3',  value: 'linear-gradient(135deg,#11998e,#38ef7d)', label: 'Verde' },
  { id: 'g4',  value: 'linear-gradient(135deg,#f953c6,#b91d73)', label: 'Rosa' },
  { id: 'g5',  value: 'linear-gradient(135deg,#0575E6,#021B79)', label: 'Oceano' },
  { id: 'g6',  value: 'linear-gradient(135deg,#FFD200,#F7971E)', label: 'Sole' },
  { id: 'g7',  value: 'linear-gradient(135deg,#1D2671,#C33764)', label: 'Notte' },
  { id: 'g8',  value: 'linear-gradient(135deg,#134E5E,#71B280)', label: 'Foresta' },
  { id: 'g9',  value: 'linear-gradient(135deg,#ee0979,#ff6a00)', label: 'Tramonto' },
  { id: 'g10', value: 'linear-gradient(135deg,#2C3E50,#4CA1AF)', label: 'Ghiaccio' },
  { id: 's1',  value: '#111111', label: 'Nero' },
  { id: 's2',  value: '#FFFFFF', label: 'Bianco' },
  { id: 's3',  value: '#F07B1D', label: 'JES' },
  { id: 's4',  value: '#1DA1F2', label: 'Blu' },
  { id: 's5',  value: '#E91E63', label: 'Rosso' },
];

const TEXT_COLORS = ['#FFFFFF', '#111111', '#F07B1D', '#FFD200', '#11998e', '#f953c6', '#5B6AF5'];

const FONT_SIZES = [20, 24, 28, 34, 42];

function isLight(bg: string): boolean {
  return bg === '#FFFFFF' || bg.includes('FFD200') || bg.includes('38ef7d');
}

function textColorAuto(bg: string): string {
  return isLight(bg) ? '#111111' : '#FFFFFF';
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onPublished: () => void;
  authorUserId?: string;
}

export default function CreateTextPostModal({ visible, onClose, onPublished, authorUserId }: Props) {
  const { t } = useLang();
  const [text, setText] = useState('');
  const [bg, setBg] = useState(BACKGROUNDS[0]);
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [fontSize, setFontSize] = useState(28);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
  const [publishing, setPublishing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (!visible) return null;

  const canPublish = text.trim().length > 0;

  const publish = async () => {
    if (!canPublish || publishing) return;
    const blocked = await containsBlacklistedWord(text.trim());
    if (blocked) { alert(`Parola non consentita: "${blocked}"`); return; }
    setPublishing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: dbUser } = await supabase.from('users').select('id').eq('auth_id', user.id).single();
      const postUserId = authorUserId || dbUser?.id;
      if (!postUserId) return;

      await supabase.from('posts').insert({
        user_id:    postUserId,
        caption:    text.trim(),
        image_urls: [],
        image_url:  null,
        aspect_ratio: 1,
        text_bg:    bg.value,
        text_color: textColor,
        text_size:  fontSize,
        text_align: textAlign,
        post_type:  'text',
      });

      setText('');
      setBg(BACKGROUNDS[0]);
      setTextColor('#FFFFFF');
      setFontSize(28);
      setTextAlign('center');
      onPublished();
      onClose();
    } finally { setPublishing(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#000', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: '#111', flexShrink: 0 }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center', padding: 0 }}>
          <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: '#fff' }}>Testo</span>
        <button
          onClick={publish} disabled={!canPublish || publishing}
          style={{ background: canPublish ? '#F07B1D' : '#444', color: '#fff', border: 'none', borderRadius: 20, padding: '8px 20px', fontWeight: 700, fontSize: 15, cursor: canPublish ? 'pointer' : 'not-allowed', opacity: publishing ? 0.7 : 1 }}
        >
          {publishing ? '…' : 'Pubblica'}
        </button>
      </div>

      {/* Preview */}
      <div
        onClick={() => textareaRef.current?.focus()}
        style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: bg.value, padding: 24, cursor: 'text', position: 'relative',
        }}
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Scrivi qualcosa..."
          maxLength={500}
          style={{
            background: 'transparent', border: 'none', outline: 'none', resize: 'none',
            width: '100%', textAlign, fontFamily: 'var(--font-display)',
            fontSize, fontWeight: 700, color: textColor,
            lineHeight: 1.35, textShadow: textColor === '#FFFFFF' ? '0 1px 8px rgba(0,0,0,0.25)' : '0 1px 8px rgba(255,255,255,0.15)',
            caretColor: textColor, minHeight: 120, overflowY: 'hidden',
            WebkitTextFillColor: textColor,
          }}
        />
        {/* Char count */}
        <span style={{ position: 'absolute', bottom: 10, right: 14, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
          {text.length}/500
        </span>
      </div>

      {/* Controls */}
      <div style={{ background: '#111', paddingBottom: 'env(safe-area-inset-bottom, 16px)', flexShrink: 0 }}>

        {/* Toolbar: align + font size */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid #222' }}>
          {/* Align */}
          <div style={{ display: 'flex', gap: 4 }}>
            {(['left','center','right'] as const).map(a => (
              <button key={a} onClick={() => setTextAlign(a)}
                style={{ background: textAlign === a ? '#F07B1D22' : 'none', border: textAlign === a ? '1.5px solid #F07B1D' : '1.5px solid #333', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>
                <svg width="18" height="18" fill="none" stroke={textAlign === a ? '#F07B1D' : '#888'} strokeWidth="2" viewBox="0 0 24 24">
                  {a === 'left'   && <><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></>}
                  {a === 'center' && <><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></>}
                  {a === 'right'  && <><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></>}
                </svg>
              </button>
            ))}
          </div>
          {/* Font size */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            <button onClick={() => setFontSize(s => Math.max(FONT_SIZES[0], s - 4))}
              style={{ background: '#222', border: 'none', borderRadius: 8, width: 32, height: 32, color: '#fff', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
            <span style={{ color: '#fff', fontSize: 13, fontWeight: 600, minWidth: 28, textAlign: 'center' }}>{fontSize}</span>
            <button onClick={() => setFontSize(s => Math.min(FONT_SIZES[FONT_SIZES.length - 1], s + 4))}
              style={{ background: '#222', border: 'none', borderRadius: 8, width: 32, height: 32, color: '#fff', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
          </div>
        </div>

        {/* Text color */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px', borderBottom: '1px solid #222' }}>
          <span style={{ fontSize: 11, color: '#888', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', flexShrink: 0 }}>Testo</span>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
            {TEXT_COLORS.map(c => (
              <button key={c} onClick={() => setTextColor(c)}
                style={{
                  width: 28, height: 28, borderRadius: '50%', background: c, border: textColor === c ? '3px solid #F07B1D' : '2px solid #444',
                  cursor: 'pointer', flexShrink: 0, boxShadow: c === '#FFFFFF' ? 'inset 0 0 0 1px #555' : 'none',
                }} />
            ))}
          </div>
        </div>

        {/* Background */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px' }}>
          <span style={{ fontSize: 11, color: '#888', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', flexShrink: 0 }}>Sfondo</span>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {BACKGROUNDS.map(b => (
              <button key={b.id} onClick={() => { setBg(b); setTextColor(textColorAuto(b.value)); }}
                style={{
                  width: 36, height: 36, borderRadius: 10, background: b.value,
                  border: bg.id === b.id ? '3px solid #F07B1D' : '2px solid #333',
                  cursor: 'pointer', flexShrink: 0,
                  boxShadow: b.value === '#FFFFFF' ? 'inset 0 0 0 1px #555' : 'none',
                }} />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
