'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const ROLES = [
  { id: 'user', title: 'Utente', description: "Esplora l'arte, scopri nuovi talenti e interagisci.", emoji: '🧭' },
  { id: 'student', title: 'Studente / Insegnante', description: "Studia, insegna o condividi la tua passione per l'arte.", emoji: '🎓' },
  { id: 'hobby_artist', title: 'Artista emergente', description: "Crea arte nel tempo libero o sei alle prime armi.", emoji: '🎨' },
  { id: 'pro_artist', title: 'Artista professionista', description: "L'arte è la tua professione e la tua carriera principale.", emoji: '🖌️' },
  { id: 'gallery', title: 'Gallerie & Società', description: "Promuovi e gestisci opere d'arte o artisti.", emoji: '🏛️' },
];

export default function OnboardingRolePage() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleContinue = async () => {
    if (!selectedId) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: dbUser } = await supabase.from('users').select('id').eq('auth_id', user.id).single();
        if (dbUser) {
          const role = ROLES.find(r => r.id === selectedId);
          await supabase.from('users').update({ discipline: role?.title ?? '' }).eq('id', dbUser.id);
        }
      }
    } catch {}
    router.push('/onboarding/friends');
  };

  return (
    <div className="shell roles-page">
      <div style={{ padding: '24px 20px 24px' }}>
        <h1 className="onb-title lg" style={{ marginBottom: 8 }}>Cosa ti rappresenta?</h1>
        <p className="onb-subtitle" style={{ textAlign: 'left' }}>
          Scegli il profilo che si <span className="onb-subtitle orange">adatta meglio</span> a te. Potrai comunque esplorare tutto.
        </p>
      </div>

      <div className="roles-list">
        {ROLES.map(role => {
          const sel = selectedId === role.id;
          return (
            <div key={role.id} className={`role-card${sel ? ' selected' : ''}`} onClick={() => setSelectedId(role.id)}>
              {sel && <div className="role-card-gradient" />}
              <div className={`role-icon${sel ? ' active' : ' inactive'}`}>{role.emoji}</div>
              <div className="role-text">
                <div className={`role-title${sel ? ' selected' : ''}`}>{role.title}</div>
                <div className="role-desc">{role.description}</div>
              </div>
              <div className={`radio-outer${sel ? ' selected' : ''}`}>
                {sel && <div className="radio-inner" />}
              </div>
            </div>
          );
        })}
      </div>

      <div className="sticky-bottom">
        <button className="btn-primary" onClick={handleContinue} disabled={!selectedId}>
          Continua
          {selectedId && <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>}
        </button>
      </div>
    </div>
  );
}
