'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

const ORANGE = '#F07B1D';

const INTERESTS = [
  { id: 'Pittura',            emoji: '🎨' },
  { id: 'Scultura',           emoji: '🗿' },
  { id: 'Fotografia',         emoji: '📷' },
  { id: 'Disegno',            emoji: '✏️' },
  { id: 'Musica',             emoji: '🎵' },
  { id: 'Letteratura',        emoji: '📚' },
  { id: 'Design',             emoji: '💻' },
  { id: 'Moda e Fashion',     emoji: '👗' },
  { id: 'Arte di Strada',     emoji: '🎭' },
  { id: 'Fotografia',         emoji: '📸' },
  { id: 'Architettura',       emoji: '🏛️' },
  { id: 'Fumettistica',       emoji: '💬' },
  { id: 'Tattoo',             emoji: '🖊️' },
  { id: 'Cucina Chef',        emoji: '🍳' },
  { id: 'Recitazione e Danza',emoji: '💃' },
  { id: 'Storia',             emoji: '🏺' },
  { id: 'Archeologia',        emoji: '⛏️' },
].filter((v, i, a) => a.findIndex(x => x.id === v.id) === i);

interface Props {
  userId: string;
  onDone: () => void;
}

export default function InterestsModal({ userId, onDone }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggle = (id: string) => {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id]);
  };

  const handleSave = async () => {
    if (selected.length < 3) return;
    setSaving(true);
    const scores: Record<string, number> = {};
    selected.forEach(cat => { scores[cat] = 10; });
    await supabase.from('users').update({
      categories: selected,
      category_scores: scores,
      interests_set: true,
    }).eq('id', userId);
    setSaving(false);
    onDone();
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#fff', display: 'flex', flexDirection: 'column', fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
      <div style={{ padding: '48px 24px 24px' }}>
        <h1 style={{ fontFamily: 'Poppins, sans-serif', fontSize: 26, fontWeight: 800, color: '#111', marginBottom: 8 }}>
          Cosa ti piace? ✨
        </h1>
        <p style={{ fontSize: 15, color: '#666', lineHeight: 1.5 }}>
          Scegli almeno <strong>3 categorie</strong> — il feed si adatterà ai tuoi gusti e imparerà nel tempo.
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, paddingBottom: 24 }}>
          {INTERESTS.map(item => {
            const sel = selected.includes(item.id);
            return (
              <button
                key={item.id}
                onClick={() => toggle(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '14px 16px', borderRadius: 16,
                  border: `2px solid ${sel ? ORANGE : '#EEE'}`,
                  background: sel ? '#FFF5EC' : '#FAFAFA',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.15s',
                }}
              >
                <span style={{ fontSize: 22 }}>{item.emoji}</span>
                <span style={{ fontWeight: 600, fontSize: 13, color: sel ? ORANGE : '#333' }}>{item.id}</span>
                {sel && <span style={{ marginLeft: 'auto', color: ORANGE }}>✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ padding: '16px 24px 48px' }}>
        <button
          onClick={handleSave}
          disabled={selected.length < 3 || saving}
          style={{
            width: '100%', padding: '16px', borderRadius: 16,
            background: selected.length >= 3 ? ORANGE : '#EEE',
            color: selected.length >= 3 ? '#fff' : '#AAA',
            fontWeight: 700, fontSize: 16, border: 'none', cursor: selected.length >= 3 ? 'pointer' : 'default',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {saving ? 'Salvo...' : `Continua${selected.length >= 3 ? ` (${selected.length})` : ` — scegli ancora ${3 - selected.length}`}`}
        </button>
      </div>
    </div>
  );
}
