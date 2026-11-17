import { Detail } from '@/components/detail';
import { notFound } from 'next/navigation';
export default async function Page({ params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params;
  if (!['movie', 'tv'].includes(type) || !/^\d+$/.test(id)) notFound();
  return <Detail type={type} id={id} />;
}
