import ProfilePageClient from './ProfilePageClient';

export async function generateStaticParams() { return []; }
export const dynamicParams = false;

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  return <ProfilePageClient username={username} />;
}
