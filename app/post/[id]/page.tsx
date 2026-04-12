import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://cunftokrdqvprepcnlum.supabase.co',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN1bmZ0b2tyZHF2cHJlcGNubHVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU0MDY0ODIsImV4cCI6MjA5MDk4MjQ4Mn0.MbzysRQTEvNXWQKgE84ThglSZSnOlDu_vyD1JF8WdC4'
);

async function getPost(id: string) {
  const { data } = await supabase
    .from('posts')
    .select('id, caption, image_url, created_at, users(name, username, avatar_url)')
    .eq('id', id)
    .single();
  return data;
}

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    return {
      title: 'Post — JES',
      description: 'JES — Il Social delle Emozioni',
    };
  }

  const author = (post as any).users;
  const authorName: string = author?.name || 'Un artista';
  const authorUsername: string = author?.username || 'jes';
  const caption: string = post.caption || '';

  const title = `${authorName} su JES`;
  const description = caption
    ? `${caption.slice(0, 140)}${caption.length > 140 ? '…' : ''}`
    : `Guarda il post di @${authorUsername} su JES — Il Social delle Emozioni`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      siteName: 'JES — Il Social delle Emozioni',
      url: `https://jesocial.com/post/${id}`,
      images: post.image_url
        ? [{ url: post.image_url, width: 1200, height: 630, alt: title }]
        : [{ url: '/logo.png', width: 512, height: 512, alt: 'JES' }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: post.image_url ? [post.image_url] : ['/logo.png'],
    },
  };
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'Adesso';
  if (m < 60) return `${m} min fa`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ore fa`;
  return `${Math.floor(h / 24)} g fa`;
}

export default async function PostPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const post = await getPost(id);
  const author = post ? (post as any).users : null;

  return (
    <div style={{
      minHeight: '100dvh',
      background: '#F5F5F5',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      fontFamily: "'Plus Jakarta Sans', sans-serif",
    }}>

      {/* Header */}
      <header style={{
        width: '100%',
        maxWidth: 430,
        background: '#fff',
        borderBottom: '1px solid #EEEEEE',
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}>
        <Link href="/" style={{
          fontFamily: "'Poppins', sans-serif",
          fontSize: 26,
          color: '#F07B1D',
          letterSpacing: -1,
          textDecoration: 'none',
          fontWeight: 800,
        }}>
          JES
        </Link>
        <Link href="/login" style={{
          background: '#F07B1D',
          color: '#fff',
          padding: '8px 18px',
          borderRadius: 12,
          fontSize: 14,
          fontWeight: 700,
          textDecoration: 'none',
        }}>
          Apri JES
        </Link>
      </header>

      {/* Post card */}
      <main style={{ width: '100%', maxWidth: 430, flex: 1 }}>
        {!post ? (
          <div style={{
            padding: 48,
            textAlign: 'center',
            color: '#666',
            fontSize: 15,
          }}>
            <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'center' }}>
              <svg width="52" height="52" fill="none" stroke="#DDD" strokeWidth="1.5" viewBox="0 0 24 24">
                <rect x="3" y="3" width="18" height="18" rx="3"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="M21 15l-5-5L5 21"/>
              </svg>
            </div>
            <p style={{ fontWeight: 600, color: '#111', marginBottom: 8 }}>Post non disponibile</p>
            <p>Il post potrebbe essere stato eliminato o essere privato.</p>
            <Link href="/" style={{
              display: 'inline-block',
              marginTop: 24,
              background: '#F07B1D',
              color: '#fff',
              padding: '12px 28px',
              borderRadius: 14,
              fontWeight: 700,
              textDecoration: 'none',
              fontSize: 15,
            }}>
              Vai a JES →
            </Link>
          </div>
        ) : (
          <div style={{ background: '#fff', marginTop: 8, paddingBottom: 24 }}>

            {/* Post header */}
            <div style={{
              padding: '14px 16px 10px',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}>
              <div style={{
                width: 40, height: 40, borderRadius: '50%',
                background: '#EEE', overflow: 'hidden', flexShrink: 0,
              }}>
                {author?.avatar_url && (
                  <img
                    src={author.avatar_url}
                    alt={author.name}
                    width={40} height={40}
                    style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                  />
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 14, fontWeight: 700, color: '#111',
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {author?.name || 'Artista JES'}
                </div>
                <div style={{ fontSize: 12, color: '#888' }}>
                  @{author?.username || 'jes'} · {formatTimeAgo(post.created_at)}
                </div>
              </div>
            </div>

            {/* Post image */}
            {post.image_url && (
              <div style={{ width: '100%', background: '#F5F5F5' }}>
                <img
                  src={post.image_url}
                  alt={post.caption || 'Post JES'}
                  style={{ width: '100%', display: 'block', maxHeight: 520, objectFit: 'cover' }}
                />
              </div>
            )}

            {/* Caption */}
            {post.caption && (
              <div style={{ padding: '12px 16px 0', fontSize: 14, color: '#111', lineHeight: 1.5 }}>
                <span style={{ fontWeight: 700 }}>{author?.username || 'artista'} </span>
                {post.caption}
              </div>
            )}

            {/* CTA */}
            <div style={{ padding: '20px 16px 0' }}>
              <Link href="/login" style={{
                display: 'block',
                textAlign: 'center',
                background: '#F07B1D',
                color: '#fff',
                padding: '14px 24px',
                borderRadius: 14,
                fontWeight: 700,
                fontSize: 15,
                textDecoration: 'none',
              }}>
                Apri su JES per mettere like e commentare →
              </Link>
            </div>

          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{
        width: '100%',
        maxWidth: 430,
        padding: '20px 16px',
        display: 'flex',
        justifyContent: 'center',
        gap: 24,
        fontSize: 12,
        color: '#AAA',
      }}>
        <Link href="/legal/privacy" style={{ color: '#AAA', textDecoration: 'none' }}>Privacy</Link>
        <Link href="/legal/termini" style={{ color: '#AAA', textDecoration: 'none' }}>Termini</Link>
        <span>© 2025 JES</span>
      </footer>

    </div>
  );
}
