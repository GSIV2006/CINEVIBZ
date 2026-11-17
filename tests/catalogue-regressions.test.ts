import { afterEach, describe, expect, it, vi } from 'vitest';
import { interpret } from '@/lib/recommendations/interpret';
import { complies } from '@/lib/recommendations/rank';
import { onlyCatalogueConstraints } from '@/lib/catalogue-intent';
import {
  creditRecords,
  discoverParams,
  isPersonMatch,
  searchCatalogue,
  titleOrder,
} from '@/lib/catalogue';
import { normalize } from '@/lib/providers/tmdb';
import type { Constraints, Person } from '@/lib/types';

const base: Constraints = {
  genres: [],
  excludedGenres: [],
  excludedLanguages: [],
  allowMature: true,
};
const person: Person = {
  id: 147023,
  name: 'Ram Charan',
  image: null,
  department: 'Acting',
  aliases: ['Ramcharan'],
  knownFor: ['RRR'],
};
const movie = (extra: Record<string, unknown> = {}) => ({
  id: 1,
  title: 'Test fixture',
  original_title: 'Test fixture',
  original_language: 'te',
  origin_country: ['IN'],
  genre_ids: [28],
  release_date: '2020-01-01',
  adult: false,
  vote_count: 10,
  vote_average: 7,
  keywords: { keywords: [] },
  ...extra,
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});
describe('Cinema origin is a constraint, not an emotional guess', () => {
  it.each(['Indian', 'Indian movies', 'Indian cinema', 'desi films'])(
    '%s requires Indian origin',
    (query) => {
      const i = interpret(query, { allowMature: true });
      expect(i.constraints.countries).toEqual(['IN']);
      expect(onlyCatalogueConstraints(query, i.constraints)).toBe(true);
      expect(complies(normalize(movie(), 'movie'), i.constraints)).toBe(true);
      expect(
        complies(
          normalize(movie({ origin_country: ['US'], original_language: 'hi' }), 'movie'),
          i.constraints,
        ),
      ).toBe(false);
    },
  );
  it.each([
    ['Bollywood', 'hi'],
    ['Tollywood', 'te'],
    ['Kollywood', 'ta'],
    ['Mollywood', 'ml'],
    ['Sandalwood', 'kn'],
  ])('%s has a specific language', (word, language) => {
    const c = interpret(word).constraints;
    expect(c.countries).toEqual(['IN']);
    expect(c.language).toBe(language);
  });
  it('Indian does not silently mean Hindi only', () => {
    expect(interpret('Indian').constraints.language).toBeUndefined();
  });
  it('South Indian includes four industries without allowing Hindi or western productions', () => {
    const c = interpret('South Indian films', { allowMature: true }).constraints;
    for (const language of ['te', 'ta', 'ml', 'kn'])
      expect(complies(normalize(movie({ original_language: language }), 'movie'), c)).toBe(true);
    expect(complies(normalize(movie({ original_language: 'hi' }), 'movie'), c)).toBe(false);
    expect(complies(normalize(movie({ origin_country: ['US'] }), 'movie'), c)).toBe(false);
  });
  it('plural genre phrases remain constrained discovery queries', () => {
    const i = interpret('Malayalam thrillers');
    expect(i.constraints.language).toBe('ml');
    expect(i.constraints.genres).toContain(53);
    expect(onlyCatalogueConstraints(i.prompt, i.constraints)).toBe(true);
  });
  it('does not accept a missing origin as evidence of India', () => {
    expect(
      complies(normalize(movie({ origin_country: [] }), 'movie'), { ...base, countries: ['IN'] }),
    ).toBe(false);
  });
  it('negative countries are respected', () => {
    const c = interpret('movies, no Indian', { allowMature: true }).constraints;
    expect(complies(normalize(movie(), 'movie'), c)).toBe(false);
  });
  it('rejects contradictory regional language requests', () => {
    expect(interpret('South Indian movies', { language: 'hi' }).conflicts.length).toBeGreaterThan(
      0,
    );
  });
  it('uses origin filters rather than theatrical-release region', () => {
    const params = discoverParams(interpret('Indian movies').constraints, 'movie');
    expect(params.with_origin_country).toBe('IN');
    expect(params).not.toHaveProperty('region');
  });
});
describe('Entity matching and verified credits', () => {
  it.each([
    'Ram Charan',
    'ram charan',
    'Ramcharan',
    'movies with Ram Charan',
    'Indian movies with Ram Charan',
  ])('recognizes %s', (q) => expect(isPersonMatch(person, q)).toBe(true));
  it('does not confuse a partial name or another person', () => {
    expect(isPersonMatch(person, 'Ram')).toBe(false);
    expect(isPersonMatch({ ...person, name: 'Master Charan Ram', aliases: [] }, 'Ram Charan')).toBe(
      false,
    );
  });
  it('actor filmographies contain cast credits, not unrelated producer credits', () => {
    const records = creditRecords(
      {
        cast: [
          { ...movie(), media_type: 'movie', character: 'Test character' },
          { ...movie({ id: 2, adult: true }), media_type: 'movie' },
        ],
        crew: [{ ...movie({ id: 3 }), media_type: 'movie', job: 'Producer' }],
      },
      person,
    );
    expect(records.map((m) => m.id)).toEqual([1]);
    expect(records[0].credit).toContain('Ram Charan as Test character');
  });
  it('directors get directing credits, not every crew association', () => {
    const records = creditRecords(
      {
        crew: [
          { ...movie(), media_type: 'movie', job: 'Director' },
          { ...movie({ id: 2 }), media_type: 'movie', job: 'Executive Producer' },
        ],
      },
      { ...person, department: 'Directing' },
    );
    expect(records.map((m) => m.id)).toEqual([1]);
  });
  it('exact titles outrank more popular partial matches', () => {
    const items = [
      normalize(movie({ id: 2, title: 'Peddinti Alludu', popularity: 99999 }), 'movie'),
      normalize(movie({ title: 'Peddi', original_title: 'పెద్ది' }), 'movie'),
    ];
    expect(titleOrder(items, 'peddi')[0].title).toBe('Peddi');
  });
});

function stubCatalogue(overrides: Record<string, unknown> = {}) {
  const calls: URL[] = [];
  vi.stubEnv('TMDB_READ_ACCESS_TOKEN', 'test-only-token');
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string) => {
      const url = new URL(input);
      calls.push(url);
      const path = url.pathname.replace('/3', '');
      let payload: any;
      if (path === '/search/person') payload = { results: [] };
      else if (path === '/search/movie')
        payload = { page: 1, total_pages: 1, total_results: 1, results: [movie(overrides)] };
      else if (path === '/search/tv')
        payload = { page: 1, total_pages: 0, total_results: 0, results: [] };
      else if (path === '/movie/1') payload = movie(overrides);
      else throw Error('Unexpected provider call ' + path);
      return new Response(JSON.stringify(payload), { status: 200 });
    }),
  );
  return calls;
}
describe('Search regressions through the provider boundary', () => {
  it('keeps an announced zero-vote, unrated title discoverable', async () => {
    stubCatalogue({ title: 'Peddi', release_date: '', vote_count: 0, status: 'In Production' });
    const r = await searchCatalogue('Peddi');
    expect(r.results[0]?.title).toBe('Peddi');
    expect(r.results[0]?.rating).toBeNull();
    expect(r.results[0]?.date).toBe('');
  });
  it('does not hide upcoming titles behind a current-date cutoff', async () => {
    stubCatalogue({ title: 'Future fixture', release_date: '2099-01-01', vote_count: 0 });
    const r = await searchCatalogue('Future fixture');
    expect(r.results).toHaveLength(1);
  });
  it('still enforces an explicitly selected family filter', async () => {
    stubCatalogue({ title: 'Peddi' });
    expect((await searchCatalogue('Peddi', {}, 1, undefined, true)).results).toEqual([]);
  });
  it('preserves literal title words that resemble query grammar', async () => {
    const calls = stubCatalogue({ title: 'The Lord of the Rings' });
    await searchCatalogue('The Lord of the Rings');
    expect(calls.find((c) => c.pathname.endsWith('/search/movie'))?.searchParams.get('query')).toBe(
      'The Lord of the Rings',
    );
  });
  it('a literal title containing French is not a French-language filter', async () => {
    stubCatalogue({ title: 'French Kiss', original_language: 'en', origin_country: ['US'] });
    const r = await searchCatalogue('French Kiss');
    expect(r.results).toHaveLength(1);
    expect(r.constraints.language).toBeUndefined();
  });
  it('unknown text is never substituted with popular movies', async () => {
    vi.stubEnv('TMDB_READ_ACCESS_TOKEN', 'test-only-token');
    const calls: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string) => {
        calls.push(input);
        return new Response(
          JSON.stringify({ results: [], page: 1, total_pages: 0, total_results: 0 }),
        );
      }),
    );
    const r = await searchCatalogue('zxqv nonexistent film');
    expect(r.results).toEqual([]);
    expect(calls.every((url) => url.includes('/search/'))).toBe(true);
  });
});

it('empty UI filters never erase an explicit query language or format', () => {
  const c = interpret('Malayalam thriller movies', {
    language: undefined,
    type: undefined,
    countries: undefined,
  }).constraints;
  expect(c.language).toBe('ml');
  expect(c.type).toBe('movie');
  expect(c.genres).toContain(53);
});
it('numbered film titles are not mistaken for regional browse requests', () => {
  const i = interpret('Indian 2');
  expect(onlyCatalogueConstraints(i.prompt, i.constraints)).toBe(false);
});
it('explicit country filters cannot broaden a conflicting country request', () => {
  expect(interpret('Indian', { countries: ['US'] }).conflicts.length).toBeGreaterThan(0);
});
