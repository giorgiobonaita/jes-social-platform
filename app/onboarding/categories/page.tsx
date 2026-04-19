'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/lib/i18n';

const MIN_SELECTIONS = 3;

const CATEGORY_IMAGES = [
  'https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=600&q=80',
  'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=600&q=80',
  'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&q=80',
  'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=600&q=80',
  'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=600&q=80',
  'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&q=80',
  'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=600&q=80',
  'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=600&q=80',
  'https://images.unsplash.com/photo-1541701494587-cb58502866ab?w=600&q=80',
  'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=600&q=80',
  'https://images.unsplash.com/photo-1580136579312-94651dfd596d?w=600&q=80',
  'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=600&q=80',
  'https://images.unsplash.com/photo-1564457461758-8ff96e439e83?w=600&q=80',
  'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=600&q=80',
  'https://images.unsplash.com/photo-1455390582262-044cdead277a?w=600&q=80',
  'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80',
  'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=600&q=80',
];

const CATEGORY_EMOJIS = ['🎨','🗿','✏️','📷','💻','🎭','📚','🖼️','🌀','👤','💡','🏛️','🏺','🧵','🖊️','👗','📣'];
const CATEGORY_KEYS = [
  'cat_painting','cat_sculpture','cat_drawing','cat_photography','cat_digital',
  'cat_street','cat_illustration','cat_graphic','cat_abstract','cat_figurative',
  'cat_conceptual','cat_contemporary','cat_classical','cat_textile','cat_calligraphy',
  'cat_fashion','cat_sponsor',
];

export default function OnboardingCategoriesPage() {
  const router = useRouter();
  const { t } = useLang();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const CATEGORIES = CATEGORY_KEYS.map((key, i) => ({
    id: String(i + 1),
    key,
    title: t(key),
    image: CATEGORY_IMAGES[i],
    emoji: CATEGORY_EMOJIS[i],
  }));

  const toggle = (id: string) =>
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  const canProceed = selectedIds.length >= MIN_SELECTIONS;

  const handleContinue = async () => {
    if (!canProceed) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: dbUser } = await supabase.from('users').select('id').eq('auth_id', user.id).single();
        if (dbUser) {
          const selectedTitles = CATEGORIES.filter(c => selectedIds.includes(c.id)).map(c => c.title);
          await supabase.from('users').update({ categories: selectedTitles }).eq('id', dbUser.id);
        }
      }
    } catch {}
    router.push('/onboarding/role');
  };

  return (
    <div className="shell categories-page">
      <div className="categories-header">
        <h1 className="onb-title lg" style={{ marginBottom: 8 }}>{t('onb_cat_title')}</h1>
        <p className="onb-subtitle">
          {t('onb_cat_subtitle_pre')} <span className="onb-subtitle orange">{t('onb_cat_subtitle_bold')}</span> {t('onb_cat_subtitle_post')}
        </p>
      </div>

      <div className="categories-grid">
        {CATEGORIES.map(item => {
          const sel = selectedIds.includes(item.id);
          return (
            <div key={item.id} className={`cat-card${sel ? ' selected' : ''}`} onClick={() => toggle(item.id)}>
              <img className="cat-card-img" src={item.image} alt={item.title} loading="lazy" />
              <div className="cat-card-overlay" />
              {sel && <div className="cat-card-selected-overlay" />}
              {sel && (
                <div className="cat-card-check">
                  <svg width="14" height="14" fill="none" stroke="white" strokeWidth="3"><path d="M2 7l4 4 6-6"/></svg>
                </div>
              )}
              <div className="cat-card-label">
                <div className="cat-icon-circle">{item.emoji}</div>
                <span className="cat-card-title">{item.title}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="sticky-bottom">
        <button className="btn-primary" onClick={handleContinue} disabled={!canProceed}>
          {canProceed ? (
            <>{t('onb_continue')} <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>
          ) : `${t('onb_cat_select_more')} ${MIN_SELECTIONS - selectedIds.length}`}
        </button>
      </div>
    </div>
  );
}
