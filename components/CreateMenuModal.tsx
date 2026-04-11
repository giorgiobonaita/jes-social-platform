'use client';
interface Props {
  visible: boolean; onClose: () => void;
  onPost: () => void; onStory: () => void; onPoll: () => void;
}

const OPTIONS = [
  { key: 'post', label: 'Post', sub: 'Condividi una foto o più', emoji: '🖼️', color: '#5B6AF5', bg: '#5B6AF518' },
  { key: 'story', label: 'Storia', sub: 'Scompare dopo 24 ore', emoji: '▶️', color: '#F07B1D', bg: '#F07B1D18' },
  { key: 'poll', label: 'Sondaggio', sub: "Chiedi l'opinione dei tuoi follower", emoji: '📊', color: '#34C759', bg: '#34C75918' },
];

export default function CreateMenuModal({ visible, onClose, onPost, onStory, onPoll }: Props) {
  if (!visible) return null;
  const handlers: Record<string, () => void> = {
    post: () => { onClose(); setTimeout(onPost, 200); },
    story: () => { onClose(); setTimeout(onStory, 200); },
    poll: () => { onClose(); setTimeout(onPoll, 200); },
  };
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ paddingBottom: 40 }}>
        <div className="modal-handle" />
        <h2 style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 20, color: '#111', marginBottom: 8, paddingLeft: 6 }}>Cosa vuoi creare?</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {OPTIONS.map(opt => (
            <button key={opt.key} onClick={handlers[opt.key]}
              style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 10px', background: 'none', border: 'none', cursor: 'pointer', borderRadius: 18, width: '100%', textAlign: 'left', transition: 'background .1s' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#F5F5F5')}
              onMouseLeave={e => (e.currentTarget.style.background = 'none')}>
              <div style={{ width: 56, height: 56, borderRadius: 18, background: opt.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0 }}>{opt.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 17, color: '#111' }}>{opt.label}</div>
                <div style={{ fontFamily: 'var(--font-body)', fontSize: 13, color: '#AAA', marginTop: 2 }}>{opt.sub}</div>
              </div>
              <svg width="18" height="18" fill="none" stroke="#CCC" strokeWidth="2"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          ))}
        </div>
        <div style={{ marginTop: 16, borderTop: '1px solid #F0F0F0', paddingTop: 16, textAlign: 'center' }}>
          <button onClick={onClose} style={{ fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 16, color: '#999', background: 'none', border: 'none', cursor: 'pointer', padding: '8px 24px' }}>Annulla</button>
        </div>
      </div>
    </div>
  );
}
