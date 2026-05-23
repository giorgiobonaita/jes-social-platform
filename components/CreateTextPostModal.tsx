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

type Mode = null | 'plain' | 'styled';

interface Props {
  visible: boolean;
  onClose: () => void;
  onPublished: () => void;
  authorUserId?: string;
}

export default function CreateTextPostModal({ visible, onClose, onPublished, authorUserId }: Props) {
  const { t } = useLang();
  const [mode, setMode] = useState<Mode>(null);
  const [text, setText] = useState('');
  const [bg, setBg] = useState(BACKGROUNDS[0]);
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [fontSize, setFontSize] = useState(28);
  const [textAlign, setTextAlign] = useState<'left' | 'center' | 'right'>('center');
  const [publishing, setPublishing] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleClose = () => {
    setMode(null);
    setText('');
    onClose();
  };

  if (!visible) return null;

  /* ── Step 1: scegli il tipo ── */
  if (mode === null) return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}
      onClick={handleClose}>
      <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: '20px 20px 0 0', width: '100%', maxWidth: 500, paddingBottom: 'env(safe-area-inset-bottom, 20px)' }}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '12px 0 4px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#E0E0E0' }} />
        </div>
        <p style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: '#111', margin: '8px 20px 16px' }}>Che tipo di testo?</p>

        {/* Testo normale */}
        <button onClick={() => setMode('plain')} style={{ width: '100%', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', cursor: 'pointer', borderTop: '1px solid #F5F5F5' }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: '#F5F5F5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="26" height="26" fill="none" stroke="#555" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="M4 6h16M4 12h16M4 18h10"/>
            </svg>
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16, color: '#111' }}>Testo normale</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#AAA', marginTop: 2 }}>Post di solo testo, sfondo bianco</div>
          </div>
          <svg width="18" height="18" fill="none" stroke="#CCC" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
        </button>

        {/* Testo con sfondo */}
        <button onClick={() => setMode('styled')} style={{ width: '100%', background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', cursor: 'pointer', borderTop: '1px solid #F5F5F5' }}>
          <div style={{ width: 52, height: 52, borderRadius: 16, background: 'linear-gradient(135deg,#F07B1D,#FF5E5E)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <svg width="26" height="26" fill="none" stroke="#fff" strokeWidth="1.8" viewBox="0 0 24 24">
              <polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>
            </svg>
          </div>
          <div style={{ flex: 1, textAlign: 'left' }}>
            <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 16, color: '#111' }}>Testo con sfondo</div>
            <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#AAA', marginTop: 2 }}>Gradienti e colori, stile grafico</div>
          </div>
          <svg width="18" height="18" fill="none" stroke="#CCC" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6"/></svg>
        </button>

        <button onClick={handleClose} style={{ width: '100%', background: 'none', border: 'none', padding: '16px', cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 16, color: '#999', borderTop: '1px solid #F5F5F5' }}>
          Annulla
        </button>
      </div>
    </div>
  );

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

      const isStyled = mode === 'styled';
      await supabase.from('posts').insert({
        user_id:    postUserId,
        caption:    text.trim(),
        image_urls: [],
        image_url:  null,
        aspect_ratio: 1,
        post_type:  isStyled ? 'text' : 'plain_text',
        text_bg:    isStyled ? bg.value : null,
        text_color: isStyled ? textColor : '#111111',
        text_size:  isStyled ? fontSize : null,
        text_align: isStyled ? textAlign : null,
      });

      setText('');
      setBg(BACKGROUNDS[0]);
      setTextColor('#FFFFFF');
      setFontSize(28);
      setTextAlign('center');
      setMode(null);
      onPublished();
      onClose();
    } finally { setPublishing(false); }
  };

  const headerBg = mode === 'styled' ? '#111' : '#fff';
  const headerColor = mode === 'styled' ? '#fff' : '#111';

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: mode === 'styled' ? '#000' : '#fff', display: 'flex', flexDirection: 'column' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: headerBg, borderBottom: mode === 'plain' ? '1px solid #F0F0F0' : 'none', flexShrink: 0 }}>
        <button onClick={() => setMode(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: headerColor, display: 'flex', alignItems: 'center', padding: 0 }}>
          <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 17, color: headerColor }}>
          {mode === 'plain' ? 'Testo normale' : 'Testo con sfondo'}
        </span>
        <button
          onClick={publish} disabled={!canPublish || publishing}
          style={{ background: canPublish ? '#F07B1D' : mode === 'styled' ? '#444' : '#E0E0E0', color: canPublish ? '#fff' : mode === 'styled' ? '#777' : '#AAA', border: 'none', borderRadius: 20, padding: '8px 20px', fontWeight: 700, fontSize: 15, cursor: canPublish ? 'pointer' : 'not-allowed', opacity: publishing ? 0.7 : 1 }}
        >
          {publishing ? '…' : 'Pubblica'}
        </button>
      </div>

      {/* ── PLAIN TEXT editor ── */}
      {mode === 'plain' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '20px 20px 0' }}>
          <textarea
            ref={textareaRef}
            autoFocus
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Cosa vuoi condividere?"
            maxLength={1000}
            style={{
              flex: 1, border: 'none', outline: 'none', resize: 'none',
              fontFamily: 'var(--font-body)', fontSize: 17, color: '#111',
              lineHeight: 1.55, background: 'transparent', caretColor: '#F07B1D',
              paddingBottom: 80,
            }}
          />
          <div style={{ position: 'fixed', bottom: 'env(safe-area-inset-bottom, 0px)', left: 0, right: 0, background: '#fff', borderTop: '1px solid #F0F0F0', padding: '10px 20px', display: 'flex', justifyContent: 'flex-end' }}>
            <span style={{ fontSize: 12, color: '#CCC', fontWeight: 500 }}>{text.length}/1000</span>
          </div>
        </div>
      )}

      {/* ── STYLED TEXT editor ── */}
      {mode === 'styled' && (
        <>
          {/* Preview */}
          <div
            onClick={() => textareaRef.current?.focus()}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: bg.value, padding: 24, cursor: 'text', position: 'relative' }}
          >
            <textarea
              ref={textareaRef}
              autoFocus
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
            <span style={{ position: 'absolute', bottom: 10, right: 14, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{text.length}/500</span>
          </div>

          {/* Controls */}
          <div style={{ background: '#111', paddingBottom: 'env(safe-area-inset-bottom, 16px)', flexShrink: 0 }}>
            {/* Align + font size */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 20px', borderBottom: '1px solid #222' }}>
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
                    style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: textColor === c ? '3px solid #F07B1D' : '2px solid #444', cursor: 'pointer', flexShrink: 0, boxShadow: c === '#FFFFFF' ? 'inset 0 0 0 1px #555' : 'none' }} />
                ))}
              </div>
            </div>
            {/* Background */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 20px' }}>
              <span style={{ fontSize: 11, color: '#888', fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase', flexShrink: 0 }}>Sfondo</span>
              <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                {BACKGROUNDS.map(b => (
                  <button key={b.id} onClick={() => { setBg(b); setTextColor(textColorAuto(b.value)); }}
                    style={{ width: 36, height: 36, borderRadius: 10, background: b.value, border: bg.id === b.id ? '3px solid #F07B1D' : '2px solid #333', cursor: 'pointer', flexShrink: 0, boxShadow: b.value === '#FFFFFF' ? 'inset 0 0 0 1px #555' : 'none' }} />
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
