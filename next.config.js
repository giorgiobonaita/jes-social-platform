/** @type {import('next').NextConfig} */
const isMobileBuild = process.env.MOBILE_BUILD === 'true';

const nextConfig = {
  // Static export only for Capacitor mobile build, not for web deployment
  ...(isMobileBuild ? { output: 'export' } : {}),
  images: {
    unoptimized: isMobileBuild,
    remotePatterns: [
      { protocol: 'https', hostname: 'cunftokrdqvprepcnlum.supabase.co' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
    ],
  },
};

module.exports = nextConfig;
