import PostClientWrapper from './PostClientWrapper';

export async function generateStaticParams() { return []; }
export const dynamicParams = false;

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PostClientWrapper id={id} />;
}
