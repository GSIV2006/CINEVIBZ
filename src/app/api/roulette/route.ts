import { NextResponse } from 'next/server';
import { cataloguePage, enrich, unique } from '@/lib/providers/tmdb';
import { complies } from '@/lib/recommendations/rank';
import { filters, failure } from '@/lib/api';
import { discoverParams } from '@/lib/catalogue';
import type { Constraints, Media, MediaType } from '@/lib/types';
export const maxDuration = 60;
export async function GET(req: Request) {
  try {
    const url = new URL(req.url),
      f = filters(url.searchParams),
      c: Constraints = { genres: [], excludedGenres: [], excludedLanguages: [], ...f };
    if (c.yearFrom && c.yearTo && c.yearFrom > c.yearTo)
      return NextResponse.json(
        { error: 'The release period is reversed. Choose an earlier start year.' },
        { status: 422 },
      );
    if (c.anime && c.language && c.language !== 'ja')
      return NextResponse.json(
        {
          error:
            'Anime uses Japanese originals here. Choose Japanese or Any language, or use Animation for other languages.',
        },
        { status: 422 },
      );
    if (c.anime) {
      c.language = 'ja';
      c.genres = [...c.genres, 16];
    }
    if (c.animation) c.genres = [...c.genres, 16];
    const seen = new Set(
      (url.searchParams.get('exclude') || '')
        .slice(0, 5000)
        .split(',')
        .filter((k) => /^(movie|tv):\d+$/.test(k)),
    );
    const types: MediaType[] = c.type
      ? [c.type]
      : Math.random() < 0.5
        ? ['movie', 'tv']
        : ['tv', 'movie'];
    let eligible: Media[] = [];
    for (const type of types) {
      const base = discoverParams(c, type),
        first = await cataloguePage(`/discover/${type}`, type, base);
      const maxPage = Math.min(20, Math.max(1, first.totalPages)),
        start = 1 + Math.floor(Math.random() * maxPage);
      for (const page of [...new Set([start, 1, (start % maxPage) + 1])]) {
        const pool =
          page === 1 ? first : await cataloguePage(`/discover/${type}`, type, { ...base, page });
        eligible = unique([
          ...eligible,
          ...(await enrich(pool.results.filter((m) => !seen.has(m.key)))).filter((m) =>
            complies(m, c),
          ),
        ]);
        if (eligible.length >= 5) break;
      }
      if (eligible.length >= 5) break;
    }
    if (!eligible.length)
      return NextResponse.json(
        {
          error:
            'No new eligible titles remain in this draw. Broaden the format, language or release period, or change the content preference. Previous spins are excluded.',
        },
        { status: 404 },
      );
    return NextResponse.json({
      ...eligible[Math.floor(Math.random() * eligible.length)],
      rouletteNote:
        eligible.length < 3
          ? 'This is a small eligible pool. Broaden your filters for more variety.'
          : '',
    });
  } catch (error) {
    return failure(error);
  }
}
