import { it, expect, vi, afterEach } from 'vitest';
import { tmdb, normalize } from '@/lib/providers/tmdb';
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
it('fails honestly when no server credential is present', async () => {
  vi.stubEnv('TMDB_READ_ACCESS_TOKEN', '');
  await expect(tmdb('/movie/1')).rejects.toMatchObject({ code: 'NOT_CONFIGURED', status: 503 });
});
it('handles authentication and rate limiting without leaking credentials', async () => {
  vi.stubEnv('TMDB_READ_ACCESS_TOKEN', 'test-only-secret');
  for (const [status, code] of [
    [401, 'AUTH_ERROR'],
    [429, 'RATE_LIMIT'],
  ] as const) {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status })));
    await expect(tmdb('/movie/' + status)).rejects.toMatchObject({ code });
  }
});
it('deduplicates simultaneous provider calls and only authenticates server-side', async () => {
  vi.stubEnv('TMDB_READ_ACCESS_TOKEN', 'test-only-secret');
  const fn = vi.fn().mockImplementation(async () => {
    await new Promise((r) => setTimeout(r, 5));
    return new Response(JSON.stringify({ id: 9 }));
  });
  vi.stubGlobal('fetch', fn);
  const [a, b] = await Promise.all([tmdb('/movie/9'), tmdb('/movie/9')]);
  expect(a).toEqual(b);
  expect(fn).toHaveBeenCalledTimes(1);
  expect(fn.mock.calls[0][0]).not.toContain('test-only-secret');
  expect(fn.mock.calls[0][1].headers.Authorization).toBe('Bearer test-only-secret');
});
it('preserves missing metadata instead of filling invented values', () => {
  const m = normalize({ id: 1, title: 'Test-only fixture', adult: false }, 'movie');
  expect(m.poster).toBeNull();
  expect(m.rating).toBeNull();
  expect(m.year).toBeNull();
  expect(m.runtime).toBeNull();
  expect(m.overview).toBe('');
});
