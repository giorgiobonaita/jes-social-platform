'use client';
import { useEffect } from 'react';

interface Props {
  imageUrl: string | null;
  visible: boolean;
  onClose: () => void;
}

export default function ImageViewerModal({ imageUrl, visible, onClose }: Props) {
  useEffect(() => {
    if (!visible) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [visible, onClose]);

  if (!visible || !imageUrl) return null;

  return (
    <div className="image-viewer-overlay" onClick={onClose}>
      <button className="image-viewer-close" onClick={onClose}>
        <svg width="28" height="28" fill="none" stroke="white" strokeWidth="2.5" viewBox="0 0 24 24">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
      <img
        src={imageUrl}
        alt="Immagine"
        className="image-viewer-img"
        onClick={e => e.stopPropagation()}
      />
    </div>
  );
}
