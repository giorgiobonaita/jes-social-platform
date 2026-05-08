'use client';

const GRADIENTS: [string, string][] = [
  ['#F07B1D', '#FF9A3D'],
  ['#E74C3C', '#FF7675'],
  ['#9B59B6', '#C39BD3'],
  ['#2980B9', '#74B9FF'],
  ['#27AE60', '#55EFC4'],
  ['#E67E22', '#FDCB6E'],
  ['#16A085', '#00CEC9'],
  ['#8E44AD', '#A29BFE'],
  ['#2C3E50', '#636E72'],
  ['#D35400', '#E17055'],
  ['#C0392B', '#FF7675'],
  ['#1ABC9C', '#00B894'],
  ['#3498DB', '#74B9FF'],
  ['#F39C12', '#FDCB6E'],
  ['#7F8C8D', '#B2BEC3'],
];

function seedToIndex(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return hash % GRADIENTS.length;
}

interface Props {
  uri?: string | null;
  size: number;
  seed?: string;
  borderRadius?: number;
  style?: React.CSSProperties;
  className?: string;
}

export default function AvatarImg({ uri, size, seed, borderRadius, style, className }: Props) {
  const r = borderRadius ?? size / 2;
  const baseStyle: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: r,
    flexShrink: 0,
    ...style,
  };

  if (uri && uri.trim() !== '') {
    return (
      <img
        src={uri}
        alt={seed || 'avatar'}
        style={{ ...baseStyle, objectFit: 'cover', display: 'block' }}
        className={className}
      />
    );
  }

  // Account JES Official → sfondo arancione + shield
  if (seed === 'jes_official') {
    return (
      <div
        className={className}
        style={{
          ...baseStyle,
          background: 'linear-gradient(135deg, #F07B1D, #FF9A3D)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <svg width={Math.round(size * 0.55)} height={Math.round(size * 0.55)} fill="rgba(255,255,255,0.95)" viewBox="0 0 24 24">
          <path d="M12 2L3 7v5c0 5.25 3.75 10.15 9 11.25C17.25 22.15 21 17.25 21 12V7L12 2zm-2 13l-3-3 1.41-1.41L10 12.17l5.59-5.58L17 8l-7 7z"/>
        </svg>
      </div>
    );
  }

  const idx = seed ? seedToIndex(seed) : 14;
  const [color1, color2] = GRADIENTS[idx];
  const initial = seed ? seed.trim().charAt(0).toUpperCase() : '';
  const fontSize = Math.round(size * 0.40);

  return (
    <div
      className={className}
      style={{
        ...baseStyle,
        background: `linear-gradient(135deg, ${color1}, ${color2})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {initial ? (
        <span style={{ fontSize, color: 'rgba(255,255,255,0.95)', fontWeight: 700, lineHeight: 1 }}>
          {initial}
        </span>
      ) : (
        <svg width={Math.round(size * 0.55)} height={Math.round(size * 0.55)} fill="rgba(255,255,255,0.7)" viewBox="0 0 24 24">
          <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z"/>
        </svg>
      )}
    </div>
  );
}
