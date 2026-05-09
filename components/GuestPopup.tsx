'use client';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface GuestPopupProps {
  onClose?: () => void;
  blocking?: boolean;
}

export default function GuestPopup({ onClose, blocking = false }: GuestPopupProps) {
  const router = useRouter();

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: blocking ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.55)',
      display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
    }} onClick={blocking ? undefined : onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: '24px 24px 0 0', width: '100%', maxWidth: 480,
        padding: '32px 24px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
      }}>
        {!blocking && <div style={{ width: 40, height: 4, borderRadius: 2, background: '#E0E0E0', marginBottom: 8 }} />}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: blocking ? 8 : 0 }}>
          <Image src="/logo.png" alt="JES" width={36} height={36} style={{ objectFit: 'contain' }} />
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 800, color: '#111' }}>JES</span>
        </div>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 16, fontWeight: 700, color: '#111', textAlign: 'center', margin: 0 }}>
          {blocking ? 'È ora di unirti!' : 'Unisciti alla comunità!'}
        </p>
        <p style={{ fontFamily: 'var(--font-body)', fontSize: 14, color: '#666', textAlign: 'center', margin: 0 }}>
          {blocking
            ? 'Hai esplorato JES come ospite. Crea un account gratuito per continuare a usare la piattaforma.'
            : 'Crea un account gratuito per mettere like, commentare e seguire gli artisti.'}
        </p>
        <button onClick={() => router.push('/auth')} style={{
          height: 52, borderRadius: 14, cursor: 'pointer', width: '100%',
          background: '#F07B1D', color: '#fff', border: 'none',
          fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700,
          marginTop: 4,
        }}>
          Registrati gratis
        </button>
        <button onClick={() => router.push('/login')} style={{
          height: 52, borderRadius: 14, cursor: 'pointer', width: '100%',
          background: '#F0F0F0', color: '#111', border: 'none',
          fontFamily: 'var(--font-body)', fontSize: 15, fontWeight: 700,
        }}>
          Accedi
        </button>
        {!blocking && onClose && (
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: 'var(--font-body)', fontSize: 13, color: '#AAA', marginTop: 4,
          }}>
            Continua come ospite
          </button>
        )}
      </div>
    </div>
  );
}
