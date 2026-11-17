import 'server-only';
import { GENRES, type Media, type MediaType, type PageResult } from '@/lib/types';
type Raw = Record<string, any>;
export class CatalogueError extends Error {
  constructor(
    message: string,
    public status = 502,
    public code = 'PROVIDER_ERROR',
  ) {
    super(message);
  }
}
const base = 'https://api.themoviedb.org/3';
const pending = new Map<string, Promise<unknown>>();
export const configured = () => Boolean(process.env.TMDB_READ_ACCESS_TOKEN?.trim());
export async function tmdb<T = Raw>(
  path: string,
  params: Record<string, string | number | boolean | undefined> = {},
  revalidate = 3600,
): Promise<T> {
  const token = process.env.TMDB_READ_ACCESS_TOKEN?.trim();
  if (!token)
    throw new CatalogueError(
      'The catalogue is not connected yet. Add a TMDB Read Access Token to the server environment. Your saved lists and screen test still work.',
      503,
      'NOT_CONFIGURED',
    );
  const url = new URL(base + path);
  Object.entries({ language: 'en-US', ...params }).forEach(([k, v]) => {
    if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
  });
  const key = url.toString();
  if (pending.has(key)) return pending.get(key) as Promise<T>;
  const promise = (async () => {
    let response: Response;
    try {
      response = await fetch(key, {
        headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
        next: { revalidate },
        signal: AbortSignal.timeout(12000),
      });
    } catch {
      throw new CatalogueError(
        'The catalogue took too long to respond. Please try again.',
        504,
        'TIMEOUT',
      );
    }
    if (response.status === 401 || response.status === 403)
      throw new CatalogueError(
        'TMDB could not authenticate the server. Check the API Read Access Token.',
        503,
        'AUTH_ERROR',
      );
    if (response.status === 429)
      throw new CatalogueError(
        'TMDB is receiving too many requests. Please try again shortly.',
        429,
        'RATE_LIMIT',
      );
    if (response.status === 404)
      throw new CatalogueError('This title could not be found in TMDB.', 404, 'NOT_FOUND');
    if (!response.ok)
      throw new CatalogueError('The catalogue is temporarily unavailable. Please try again.', 502);
    return (await response.json()) as T;
  })();
  pending.set(key, promise);
  try {
    return await promise;
  } finally {
    pending.delete(key);
  }
}
export function normalize(r: Raw, type: MediaType): Media {
  const date = String(r.release_date || r.first_air_date || '');
  const genres: number[] = r.genre_ids || r.genres?.map((g: Raw) => g.id) || [];
  const certs: { country: string; rating: string }[] = [];
  const origin = r.origin_country || r.production_countries?.map((c: Raw) => c.iso_3166_1) || [];
  for (const country of origin.includes('IN') ? ['IN', 'US', 'GB'] : ['US', 'GB', 'IN']) {
    const film = r.release_dates?.results
      ?.find((c: Raw) => c.iso_3166_1 === country)
      ?.release_dates?.filter((d: Raw) => d.certification)
      ?.sort(
        (a: Raw, b: Raw) => (a.type === 3 ? -1 : 0) - (b.type === 3 ? -1 : 0),
      )?.[0]?.certification;
    const tv = r.content_ratings?.results?.find((c: Raw) => c.iso_3166_1 === country)?.rating;
    if (film || tv) certs.push({ country, rating: film || tv });
  }
  return {
    id: r.id,
    key: `${type}:${r.id}`,
    type,
    title: r.title || r.name || 'Untitled record',
    originalTitle: r.original_title || r.original_name || '',
    overview: r.overview || '',
    poster: r.poster_path || null,
    backdrop: r.backdrop_path || null,
    date,
    year: date ? Number(date.slice(0, 4)) : null,
    genres,
    genreNames: genres.map((g) => GENRES[g] || 'Other'),
    language: r.original_language || '',
    countries: r.origin_country || r.production_countries?.map((c: Raw) => c.iso_3166_1) || [],
    rating: r.vote_count > 0 && Number.isFinite(r.vote_average) ? r.vote_average : null,
    votes: r.vote_count || 0,
    popularity: r.popularity || 0,
    adult: !!r.adult,
    runtime: r.runtime || r.episode_run_time?.[0] || null,
    keywords: (r.keywords?.keywords || r.keywords?.results || []).map((k: Raw) => k.name),
    certification: certs[0],
    collectionId: r.belongs_to_collection?.id,
    enriched: !!r.keywords,
    status: r.status,
    cast: r.credits?.cast
      ?.slice(0, 12)
      .map((p: Raw) => ({ id: p.id, name: p.name, character: p.character, image: p.profile_path })),
    crew: r.credits?.crew
      ?.filter((p: Raw) =>
        ['Director', 'Writer', 'Screenplay', 'Original Music Composer'].includes(p.job),
      )
      .slice(0, 8)
      .map((p: Raw) => ({ name: p.name, job: p.job })),
    seasons: r.number_of_seasons,
    episodes: r.number_of_episodes,
  };
}
export async function cataloguePage(
  path: string,
  type: MediaType,
  params: Record<string, string | number | boolean | undefined> = {},
): Promise<PageResult> {
  const r = await tmdb(path, { include_adult: false, ...params });
  return {
    results: (r.results || [])
      .filter((m: Raw) => !m.adult && m.media_type !== 'person')
      .map((m: Raw) =>
        normalize(m, m.media_type === 'tv' ? 'tv' : m.media_type === 'movie' ? 'movie' : type),
      ),
    page: r.page,
    totalPages: Math.min(500, r.total_pages || 0),
    totalResults: r.total_results || 0,
  };
}
export async function detail(type: MediaType, id: number, full = false): Promise<Media> {
  const r = await tmdb(
    `/${type}/${id}`,
    {
      append_to_response: `keywords,${type === 'movie' ? 'release_dates' : 'content_ratings'}${full ? ',credits,recommendations,similar' : ''}`,
    },
    86400,
  );
  const m = normalize(r, type);
  if (m.adult)
    throw new CatalogueError('Adult-only entries are not available on CineVibz.', 404, 'NOT_FOUND');
  if (full) {
    m.related = (r.recommendations?.results || [])
      .filter((a: Raw) => !a.adult)
      .map((a: Raw) => normalize(a, type));
    m.similar = (r.similar?.results || [])
      .filter((a: Raw) => !a.adult)
      .map((a: Raw) => normalize(a, type));
  }
  return m;
}
export async function mapLimit<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  let index = 0;
  const result: R[] = new Array(items.length);
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (index < items.length) {
        const n = index++;
        result[n] = await fn(items[n]);
      }
    }),
  );
  return result;
}
export async function enrich(items: Media[]): Promise<Media[]> {
  return mapLimit(items, 6, async (m) => {
    try {
      return await detail(m.type, m.id);
    } catch {
      return m;
    }
  });
}
export const unique = (items: Media[]) => [...new Map(items.map((m) => [m.key, m])).values()];
export function imageUrl(path: string | null, size: 'w342' | 'w500' | 'w780' | 'w1280' = 'w500') {
  return path && /^\/[\w.-]+$/.test(path) ? `https://image.tmdb.org/t/p/${size}${path}` : null;
}
