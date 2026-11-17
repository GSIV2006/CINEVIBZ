'use client';
import { Notice } from '@/components/media';
export default function Error({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="page-shell">
      <Notice
        message="This scene didn't load correctly. Your locally saved watchlist is still on this browser."
        retry={reset}
      />
    </main>
  );
}
