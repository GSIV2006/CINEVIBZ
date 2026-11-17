import { Suspense } from 'react';
import { Search } from '@/components/search';
import { Loading } from '@/components/media';
export default function Page() {
  return (
    <Suspense fallback={<Loading />}>
      <Search />
    </Suspense>
  );
}
