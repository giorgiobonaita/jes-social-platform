'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useLang } from '@/lib/i18n';

export default function OnboardingPhotoPage() {
  const router = useRouter();
  const { t } = useLang();
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleContinue = async () => {
    if (!photoFile) { router.push('/onboarding/categories'); return; }
    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/onboarding/categories'); return; }
      const { data: dbUser } = await supabase.from('users').select('id').eq('auth_id', user.id).single();
      if (!dbUser) { router.push('/onboarding/categories'); return; }

      const ext = photoFile.name.split('.').pop()?.toLowerCase() ?? 'jpg';
      const filePath = `avatars/${dbUser.id}_${Date.now()}.${ext}`;
      const bytes = await photoFile.arrayBuffer();
      const { error: uploadErr } = await supabase.storage
        .from('media').upload(filePath, bytes, { contentType: photoFile.type, upsert: true });
      if (!uploadErr) {
        const { data: urlData } = supabase.storage.from('media').getPublicUrl(filePath);
        await supabase.from('users').update({ avatar_url: `${urlData.publicUrl}?t=${Date.now()}` }).eq('id', dbUser.id);
      }
    } catch {}
    finally { setUploading(false); }
    router.push('/onboarding/categories');
  };

  return (
    <div className="shell onb-page">
      <div className="onb-header">
        <button className="back-btn" onClick={() => router.back()}>
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
      </div>
      <div className="onb-body">
        <div className="onb-top">
          <h1 className="onb-title" style={{ textAlign: 'center' }}>{t('onb_photo_title')}</h1>
          <p className="onb-subtitle" style={{ marginBottom: 40, paddingLeft: 16, paddingRight: 16 }}>
            {t('onb_photo_subtitle')}
          </p>

          <div className="photo-circle-wrap" onClick={() => inputRef.current?.click()}>
            <div className="photo-circle">
              {previewUrl
                ? <img src={previewUrl} alt="preview" />
                : <svg width="64" height="64" fill="none" stroke="#CCCCCC" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              }
            </div>
            <div className="camera-badge">
              <svg width="18" height="18" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/>
                <circle cx="12" cy="13" r="4"/>
              </svg>
            </div>
          </div>

          <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />

          <button className="add-photo-btn" onClick={() => inputRef.current?.click()}>
            <svg width="20" height="20" fill="none" stroke="#F07B1D" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21,15 16,10 5,21"/></svg>
            {previewUrl ? t('change_photo') : t('add_photo')}
          </button>
        </div>
        <div className="onb-bottom">
          <button className="btn-primary" onClick={handleContinue} disabled={uploading}>
            {uploading ? <span className="spin" /> : (
              <>{previewUrl ? t('onb_continue') : t('onb_skip')} <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
