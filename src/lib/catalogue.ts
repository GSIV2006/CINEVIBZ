import 'server-only';
import { cataloguePage, detail, enrich, normalize, tmdb, unique } from './providers/tmdb';
import { complies } from './recommendations/rank';
import { interpret } from './recommendations/interpret';
import {
  constraintLabel,
  entityQuery,
  normalizedName,
  onlyCatalogueConstraints,
  tvGenre,
} from './catalogue-intent';
import { dateKey } from './dates';
import type { CatalogueResult, Constraints, Media, MediaType, Person, PageResult } from './types';

type Raw = Record<string, any>;
export function normalizePerson(raw: Raw): Person {
  return {
    id: raw.id,
    name: raw.name,
    image: raw.profile_path || null,
    department: raw.known_for_department || 'Cinema',
    aliases: raw.also_known_as || [],
    knownFor: (raw.known_for || [])
      .map((x: Raw) => x.title || x.name)
      .filter(Boolean)
      .slice(0, 3),
  };
}
export function isPersonMatch(p: Person, query: string) {
  if (
    interpret(query).signals.length &&
    !/\b(actor|actress|starring|directed by|with)\b/i.test(query)
  )
    return false;
  const q = normalizedName(
    entityQuery(query).replace(
      /\b(?:indian|india|desi|south|bollywood|tollywood|kollywood|mollywood|sandalwood|hindi|tamil|telugu|malayalam|kannada|action|comedy|thriller|romantic|drama|all|best|latest)\b/gi,
      ' ',
    ),
  );
  return Boolean(q) && [p.name, ...p.aliases].some((name) => normalizedName(name) === q);
}
export async function findPeople(query: string) {
  const q = entityQuery(query)
    .replace(
      /\b(?:indian|india|desi|south|bollywood|tollywood|kollywood|mollywood|sandalwood|hindi|tamil|telugu|malayalam|kannada|action|comedy|thriller|romantic|drama|all|best|latest)\b/gi,
      ' ',
    )
    .replace(/\s+/g, ' ')
    .trim();
  if (!q || q.length > 100 || q.split(/\s+/).length > 8) return [];
  const data = await tmdb('/search/person', { query: q, include_adult: false });
  const raw = (data.results || []).filter((p: Raw) => !p.adult);
  const people: Person[] = raw.map(normalizePerson);
  // A provider alias search can return a different display name. Verify aliases before choosing it.
  if (people.length && !people.some((p) => isPersonMatch(p, q))) {
    const first = await tmdb(`/person/${people[0].id}`);
    people[0] = { ...people[0], aliases: first.also_known_as || [] };
  }
  return people;
}
export function creditRecords(raw: Raw, person: Person): Media[] {
  const directing = person.department === 'Directing';
  const records = directing
    ? (raw.crew || []).filter((x: Raw) => x.job === 'Director')
    : person.department === 'Acting'
      ? raw.cast || []
      : [...(raw.cast || []), ...(raw.crew || [])];
  return unique(
    records
      .filter((x: Raw) => !x.adult && ['movie', 'tv'].includes(x.media_type))
      .map((x: Raw) => ({
        ...normalize(x, x.media_type),
        credit: directing
          ? 'Directed by ' + person.name
          : x.character
            ? `${person.name} as ${x.character}`
            : x.job
              ? `${person.name} · ${x.job}`
              : `Cast: ${person.name}`,
      })),
  );
}
export function titleOrder(items: Media[], query: string) {
  const q = normalizedName(query);
  const strength = (m: Media) =>
    Math.max(
      ...[m.title, m.originalTitle].map((t) => {
        const n = normalizedName(t);
        return n === q ? 3 : n.startsWith(q) ? 2 : n.includes(q) ? 1 : 0;
      }),
    );
  return items
    .map((m, index) => ({ m, index }))
    .sort(
      (a, b) =>
        strength(b.m) - strength(a.m) ||
        b.m.votes - a.m.votes ||
        b.m.popularity - a.m.popularity ||
        a.index - b.index,
    )
    .map((x) => x.m);
}
export function discoverParams(c: Constraints, type: MediaType, page = 1) {
  const dateField = type === 'movie' ? 'primary_release_date' : 'first_air_date';
  return {
    page,
    sort_by: 'popularity.desc',
    with_genres: c.genres.map((g) => (type === 'tv' ? tvGenre(g) : g)).join(','),
    without_genres: c.excludedGenres.map((g) => (type === 'tv' ? tvGenre(g) : g)).join(','),
    with_original_language: c.language || c.languages?.join('|'),
    with_origin_country: c.countries?.join('|'),
    [dateField + '.gte']:
      c.release === 'upcoming' ? dateKey() : c.yearFrom ? `${c.yearFrom}-01-01` : undefined,
    [dateField + '.lte']: c.yearTo
      ? `${c.yearTo}-12-31`
      : c.release === 'released'
        ? dateKey()
        : undefined,
    'with_runtime.lte': c.runtimeMax,
    // No vote floor: a real, newly announced title is still a valid catalogue record.
  };
}
export async function searchCatalogue(
  query: string,
  overrides: Partial<Constraints> = {},
  page = 1,
  personId?: number,
  safe = false,
): Promise<CatalogueResult> {
  const i = interpret(query, overrides);
  let c: Constraints = { ...i.constraints, allowMature: !safe, excludeWatched: false };
  const isBrowse = onlyCatalogueConstraints(query, c) && !personId;
  const people = personId
    ? [normalizePerson(await tmdb(`/person/${personId}`))]
    : isBrowse
      ? []
      : await findPeople(query);
  let person = personId ? people[0] : people.find((p) => isPersonMatch(p, query));
  let titlePages: PageResult[] | undefined;
  // Bare queries favour an exact title over a same-named person. Explicit
  // actor/director queries and selected person IDs keep verified credits.
  if (
    person &&
    !personId &&
    !/\b(actor|actress|director|starring|featuring|directed by|filmography|with|by)\b/i.test(query)
  ) {
    const types: MediaType[] = c.type ? [c.type] : ['movie', 'tv'];
    const first = await Promise.all(
      types.map((type) => cataloguePage(`/search/${type}`, type, { query, page: 1 })),
    );
    const q = normalizedName(query);
    if (
      first.some((p) =>
        p.results.some((m) => [m.title, m.originalTitle].some((t) => normalizedName(t) === q)),
      )
    ) {
      person = undefined;
      if (page === 1) titlePages = first;
    }
  }
  if ((person || isBrowse) && i.conflicts.length)
    throw new (await import('./providers/tmdb')).CatalogueError(
      i.conflicts.join(' '),
      422,
      'CONFLICT',
    );
  if (person) {
    const raw = await tmdb(`/person/${person.id}/combined_credits`);
    const incidental = (m: Media) =>
      /\b(self|himself|herself|cameo|special appearance|archive footage)\b/i.test(m.credit || '') ||
      m.genres.some((g) => [10767, 10764, 99].includes(g));
    const credits = creditRecords(raw, person).sort(
      (a, b) =>
        Number(incidental(a)) - Number(incidental(b)) ||
        Number(b.type === 'movie') - Number(a.type === 'movie') ||
        b.popularity - a.popularity ||
        b.date.localeCompare(a.date),
    );
    // Credit membership is the source of truth. Never fill a filmography with generic recommendations.
    const prefiltered = credits.filter((m) =>
      complies(m, {
        ...c,
        allowMature: true,
        runtimeMax: undefined,
        countries: m.countries.length ? c.countries : undefined,
        excludedCountries: m.countries.length ? c.excludedCountries : undefined,
      }),
    );
    const slice = prefiltered.slice((page - 1) * 20, page * 20);
    const detailed = await enrich(slice);
    const verified = detailed
      .map((m, n) => ({ ...m, credit: slice[n].credit }))
      .filter((m) => complies(m, c));
    const totalPages = Math.ceil(prefiltered.length / 20);
    return {
      results: verified,
      page,
      totalPages,
      totalResults: prefiltered.length,
      intent: 'person',
      heading: person.name,
      person,
      people: people.slice(0, 6),
      constraints: c,
      partial: detailed.some((m) => !m.enriched),
      note: `${person.department === 'Directing' ? 'Directing credits' : 'Verified credits'} from TMDB. Each title credits ${person.name}. Unrated and announced titles are included. Catalogue counts are before final metadata and optional family-rating checks.`,
    };
  }
  if (!isBrowse)
    c = { ...interpret('', overrides).constraints, allowMature: !safe, excludeWatched: false };
  const types: MediaType[] = c.type ? [c.type] : ['movie', 'tv'];
  const pages =
    titlePages ||
    (await Promise.all(
      types.map((type) =>
        cataloguePage(
          isBrowse ? `/discover/${type}` : `/search/${type}`,
          type,
          isBrowse
            ? discoverParams(c, type, page)
            : {
                query,
                page,
                ...(c.yearFrom && c.yearFrom === c.yearTo
                  ? {
                      [type === 'movie' ? 'primary_release_year' : 'first_air_date_year']:
                        c.yearFrom,
                    }
                  : {}),
              },
        ),
      ),
    ));
  const raw = unique(pages.flatMap((p) => p.results));
  const detailed = await enrich(raw);
  const filtered = detailed.filter((m) => complies(m, c));
  const results = isBrowse
    ? filtered.sort(
        (a, b) =>
          Number(b.type === 'movie') - Number(a.type === 'movie') || b.popularity - a.popularity,
      )
    : titleOrder(filtered, query);
  return {
    results,
    page,
    totalPages: Math.max(0, ...pages.map((p) => p.totalPages)),
    totalResults: pages.reduce((s, p) => s + p.totalResults, 0),
    intent: isBrowse ? 'catalogue' : 'title',
    heading: isBrowse ? constraintLabel(c) : `Results for “${query}”`,
    people: people.slice(0, 6),
    constraints: c,
    partial: detailed.some((m) => !m.enriched),
    note: isBrowse
      ? 'Country of origin, original language and selected filters are checked against each title.'
      : 'Title matches from TMDB, with exact matches first. Announced and unrated records stay discoverable. No unrelated titles are substituted.',
  };
}
