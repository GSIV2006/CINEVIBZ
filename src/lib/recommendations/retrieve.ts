import 'server-only';
import { cataloguePage, tmdb, unique, enrich, mapLimit } from '@/lib/providers/tmdb';
import { score, rank } from './rank';
import { dateKey } from '@/lib/dates';
import { tvGenre } from '../catalogue-intent';
import type { Interpretation, Preferences, MediaType, Media } from '@/lib/types';
export async function recommend(i: Interpretation, p?: Preferences) {
  if (i.conflicts.length)
    return { results: [], interpretation: i, candidateCount: 0, enrichedCount: 0, partial: false };
  const c = i.constraints;
  const types: MediaType[] = c.type ? [c.type] : ['movie', 'tv'];
  const priority = {
    setting: 0,
    emotion: 1,
    atmosphere: 2,
    theme: 3,
    experience: 4,
    pacing: 5,
    visual: 6,
  };
  const focused = [...i.signals]
    .sort((a, b) => priority[a.dimension] - priority[b.dimension])
    .slice(0, 5);
  const terms = [...new Set(focused.flatMap((s) => s.keywords.slice(0, 2)))];
  const lookups = await mapLimit(terms, 3, async (term) => {
    try {
      const r = await tmdb('/search/keyword', { query: term });
      const exact = r.results?.find(
        (k: { name: string }) =>
          k.name.toLowerCase().replace(/-/g, ' ') === term.toLowerCase().replace(/-/g, ' '),
      );
      const place = r.results?.find((k: { name: string }) =>
        k.name.toLowerCase().startsWith(term.toLowerCase() + ','),
      );
      return [term, exact?.id ?? place?.id] as const;
    } catch {
      return [term, undefined] as const;
    }
  });
  const ids = new Map(lookups);
  const groups = focused
    .map((s) =>
      s.keywords
        .slice(0, 2)
        .map((k) => ids.get(k))
        .filter(Boolean)
        .join('|'),
    )
    .filter(Boolean);
  const tasks = types.flatMap((type) => {
    const filter: Record<string, string | number | boolean | undefined> = {
      with_genres: c.genres.map((g) => (type === 'tv' ? tvGenre(g) : g)).join(','),
      without_genres: c.excludedGenres.map((g) => (type === 'tv' ? tvGenre(g) : g)).join(','),
      with_original_language: c.language || c.languages?.join('|'),
      with_origin_country: c.countries?.join('|'),
      'vote_count.gte': c.release === 'upcoming' ? undefined : 20,
      'with_runtime.lte': c.runtimeMax,
    };
    const dateField = type === 'movie' ? 'primary_release_date' : 'first_air_date';
    filter[dateField + '.gte'] =
      c.release === 'upcoming' ? dateKey() : c.yearFrom ? `${c.yearFrom}-01-01` : undefined;
    filter[dateField + '.lte'] = c.yearTo
      ? `${c.yearTo}-12-31`
      : c.release === 'upcoming'
        ? undefined
        : dateKey();
    return [
      { type, params: { ...filter, sort_by: 'popularity.desc', page: 1 } },
      { type, params: { ...filter, sort_by: 'vote_average.desc', 'vote_count.gte': 150, page: 2 } },
      ...groups.flatMap((with_keywords) =>
        [1, 2].map((page) => ({
          type,
          params: { ...filter, with_keywords, sort_by: 'vote_count.desc', page },
        })),
      ),
    ];
  });
  const batches = await mapLimit(tasks, 4, async (t) => {
    try {
      return {
        ok: true as const,
        data: await cataloguePage(`/discover/${t.type}`, t.type, t.params),
      };
    } catch (error) {
      return { ok: false as const, error };
    }
  });
  const successful = batches.filter((b) => b.ok);
  if (!successful.length) {
    const first = batches.find((b) => !b.ok);
    if (first && !first.ok) throw first.error;
  }
  const pool = unique(successful.flatMap((b) => b.data.results));
  // Reserve candidates from every retrieval branch; sparse synopses must not eliminate entire moods.
  const reserved = successful.flatMap((b) =>
    [...b.data.results].sort((a, b) => score(b, i, p).score - score(a, i, p).score).slice(0, 3),
  );
  const preliminary = [...pool].sort((a, b) => score(b, i, p).score - score(a, i, p).score);
  const shortlist = unique([...reserved, ...preliminary]).slice(0, 72);
  const detailed = await enrich(shortlist);
  return {
    results: rank(detailed, i, p, 5),
    interpretation: i,
    candidateCount: pool.length,
    enrichedCount: detailed.filter((m) => m.enriched).length,
    partial: batches.some((b) => !b.ok) || detailed.some((m) => !m.enriched),
  };
}
