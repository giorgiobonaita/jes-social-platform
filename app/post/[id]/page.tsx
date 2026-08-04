import PostRedirect from './PostRedirect';

export async function generateStaticParams() {
  return [{ id: '_' }];
}

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PostRedirect id={id} />;
}
