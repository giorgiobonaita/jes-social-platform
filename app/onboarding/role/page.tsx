'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const ORANGE = '#F07B1D';

const ROLE_ICONS: Record<string, React.ReactElement> = {
  user: (
    <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
  ),
  student: (
    <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M22 10v6M2 10l10-5 10 5-10 5-10-5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>
  ),
  hobby_artist: (
    <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M12 19l7-7 3 3-7 7-3-3z"/><path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/>
      <path d="M2 2l7.586 7.586"/><circle cx="11" cy="11" r="2"/>
    </svg>
  ),
  pro_artist: (
    <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
    </svg>
  ),
  gallery: (
    <svg width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
};

const ROLES = [
  { id: 'user', title: 'Utente', description: "Esplora l'arte, scopri nuovi talenti e interagisci." },
  { id: 'student', title: 'Studente / Insegnante', description: "Studia, insegna o condividi la tua passione per l'arte." },
  { id: 'hobby_artist', title: 'Artista emergente', description: "Crea arte nel tempo libero o sei alle prime armi." },
  { id: 'pro_artist', title: 'Artista professionista', description: "L'arte è la tua professione e la tua carriera principale." },
  { id: 'gallery', title: 'Gallerie & Società', description: "Promuovi e gestisci opere d'arte o artisti." },
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
              <div className={`role-icon${sel ? ' active' : ' inactive'}`} style={{ color: sel ? ORANGE : '#888' }}>
                {ROLE_ICONS[role.id]}
              </div>
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
          {selectedId && <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>}
        </button>
      </div>
    </div>
  );
}
