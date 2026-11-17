import { Suspense } from 'react';
import { Discover } from '@/components/discover';
import { Loading } from '@/components/media';
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <Discover />
    </Suspense>
  );
}
