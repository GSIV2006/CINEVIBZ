import 'server-only';
import { cataloguePage, enrich, unique, mapLimit } from './providers/tmdb';
import { dateKey, weekKey, seeded, hash } from './dates';
import { safeForGeneral, score } from './recommendations/rank';
import { interpret } from './recommendations/interpret';
import { tvGenre } from './catalogue-intent';
import { LANGUAGES, type HomeData, type Media, type MediaType, type Preferences } from './types';
type Theme = {
  name: string;
  description: string;
  genres: number[];
  prompt: string;
  lowVotes?: boolean;
  older?: boolean;
  international?: boolean;
};
export const DAILY_THEMES: Theme[] = [
  {
    name: 'One for the soul',
    description: 'Human stories, with room to feel.',
    genres: [18],
    prompt: 'hopeful stories about identity and connection',
  },
  {
    name: 'Something unexpected',
    description: 'Reality has stories of its own.',
    genres: [99],
    prompt: 'thought-provoking documentaries about the world',
  },
  {
    name: 'The midnight pick',
    description: 'A mystery for the hours after dark.',
    genres: [9648, 53],
    prompt: 'dark mysterious stories',
  },
  {
    name: 'A forgotten gem',
    description: 'Older stories beyond the crowded shelves.',
    genres: [],
    prompt: 'nostalgic stories',
    lowVotes: true,
    older: true,
  },
  {
    name: 'A beautiful disaster',
    description: 'Drama with a little emotional gravity.',
    genres: [18, 10749],
    prompt: 'melancholic stories about love and loss',
  },
  {
    name: 'The comfort watch',
    description: 'A lighter route through the day.',
    genres: [35, 10751],
    prompt: 'comforting wholesome friendship',
  },
  {
    name: 'The mind-bender',
    description: 'A door into stranger possibilities.',
    genres: [878, 14, 9648],
    prompt: 'surreal mysterious stories',
  },
];
export const WEEKLY_THEMES: Theme[] = [
  {
    name: 'Films that stay with you',
    description: 'Human choices, consequences and connections.',
    genres: [18],
    prompt: 'thought-provoking stories about identity',
  },
  {
    name: 'Beyond the mainstream',
    description: 'A week spent outside the busiest shelves.',
    genres: [],
    prompt: 'thought-provoking stories',
    lowVotes: true,
  },
  {
    name: 'The art of feeling',
    description: 'Drama, romance and the things words cannot hold.',
    genres: [18, 10749],
    prompt: 'melancholic romantic stories',
  },
  {
    name: 'Stories from somewhere else',
    description: 'An edition of non-English originals, across borders.',
    genres: [],
    prompt: 'stories about identity and belonging',
    international: true,
  },
  {
    name: 'Animation that hits differently',
    description: 'Drawn worlds, very real feelings.',
    genres: [16],
    prompt: 'hopeful nostalgic animation',
  },
  {
    name: 'The beautiful and bizarre',
    description: 'Science fiction and fantasy take the scenic route.',
    genres: [878, 14],
    prompt: 'surreal dreamlike stories',
  },
];
function editorial(
  m: Media,
  t: Theme,
  period: 'daily' | 'weekly',
  personal = false,
  repeat = false,
): Media {
  const language = LANGUAGES[m.language] || m.language.toUpperCase(),
    format = m.type === 'movie' ? 'film' : 'series';
  const evidence = score(m, interpret(t.prompt, { allowMature: true })).evidence[0];
  return {
    ...m,
    editorial: {
      period,
      theme: t.name,
      hook: `${m.title}: ${language} ${m.genreNames[0]?.toLowerCase() || 'storytelling'}, seen from a different angle.`,
      why: [
        `Selected for “${t.name}” from ${m.genreNames.slice(0, 2).join(' / ') || 'the catalogue'} ${format} records.`,
        t.lowVotes
          ? `${m.votes.toLocaleString()} TMDB votes puts it in this collection’s less-voted lane.`
          : '',
        t.older ? `Its ${m.year} release places it at least ten years back.` : '',
        t.international ? `Its original language is ${language}.` : '',
        evidence
          ? `The ${evidence.source} explicitly includes “${evidence.term}”, supporting the ${evidence.signal.toLowerCase()} thread.`
          : 'The theme match is based on genre and format; a specific emotional effect is not guaranteed.',
        personal
          ? 'Your saved likes also favour this language or genre.'
          : 'A different language, genre or format helps keep the edition varied.',
        period === 'weekly'
          ? 'This edition stays with you through Sunday in India.'
          : repeat
            ? 'A recent pick returned because the eligible pool was small.'
            : 'Recent daily selections were skipped where the catalogue allowed.',
      ]
        .filter(Boolean)
        .join(' '),
    },
  };
}
export function pickEditorial(
  pool: Media[],
  theme: Theme,
  key: string,
  selected: Media[],
  preferences?: Preferences,
) {
  const interpretation = interpret(theme.prompt, { allowMature: true });
  const candidates = seeded(pool, key, (m) => m.key).filter(
    (m) =>
      !selected.some(
        (s) => s.key === m.key || (m.collectionId && s.collectionId === m.collectionId),
      ),
  );
  const liked = preferences?.feedback.filter((f) => f.kind === 'like') || [];
  return candidates
    .map((m, index) => ({
      m,
      value:
        score(m, interpretation, preferences).score -
        index * 0.2 +
        Math.min(
          8,
          liked.reduce(
            (n, f) =>
              n +
              (f.language === m.language ? 2 : 0) +
              m.genres.filter((g) => f.genres.includes(g)).length,
            0,
          ),
        ) -
        selected.reduce(
          (n, s) =>
            n +
            (s.language === m.language ? 8 : 0) +
            (s.type === m.type ? 2 : 0) +
            (s.genres[0] === m.genres[0] ? 3 : 0),
          0,
        ),
    }))
    .sort((a, b) => b.value - a.value)[0]?.m;
}
function params(theme: Theme, type: MediaType, page = 1, cutoff = dateKey()) {
  return {
    with_genres: theme.genres.map((g) => (type === 'tv' ? tvGenre(g) : g)).join('|'),
    sort_by: 'vote_average.desc',
    'vote_count.gte': theme.lowVotes ? 50 : 40,
    'vote_count.lte': theme.lowVotes ? 1500 : undefined,
    'vote_average.gte': 6,
    [type === 'movie' ? 'primary_release_date.lte' : 'first_air_date.lte']: theme.older
      ? `${Number(cutoff.slice(0, 4)) - 10}-12-31`
      : cutoff,
    with_original_language: theme.international ? 'hi|te|ta|ml|ja|ko|fr|es|it|de|pt|fa' : undefined,
    page,
  };
}
export async function homeData(
  allowMature = false,
  preferences?: Preferences,
  recent: string[] = [],
  fixedWeekly: string[] = [],
): Promise<HomeData> {
  const day = dateKey(),
    week = weekKey(),
    weeklyTheme = WEEKLY_THEMES[hash(week) % WEEKLY_THEMES.length];
  const mainTheme = DAILY_THEMES[hash(day) % DAILY_THEMES.length];
  const lanes = [
    { type: 'movie' as MediaType, theme: mainTheme, extra: {} },
    {
      type: 'tv' as MediaType,
      theme: DAILY_THEMES[2],
      extra: { with_genres: '9648|80', without_genres: '16' },
    },
    {
      type: 'movie' as MediaType,
      theme: DAILY_THEMES[5],
      extra: {
        with_genres: '16,10751',
        without_genres: '27,53',
        with_original_language: undefined,
      },
    },
    {
      type: (hash(day) % 2 ? 'tv' : 'movie') as MediaType,
      theme: DAILY_THEMES[6],
      extra: { with_genres: '16', with_original_language: 'ja' },
    },
    { type: 'movie' as MediaType, theme: DAILY_THEMES[1], extra: { with_genres: '99' } },
  ];
  const jobs = [
    { path: '/movie/popular', type: 'movie' as MediaType, params: {} },
    { path: '/tv/popular', type: 'tv' as MediaType, params: {} },
    { path: '/trending/all/day', type: 'movie' as MediaType, params: {} },
    ...(['movie', 'tv'] as MediaType[]).map((type) => ({
      path: `/discover/${type}`,
      type,
      params: params(weeklyTheme, type, 1, week),
    })),
    {
      path: '/discover/movie',
      type: 'movie' as MediaType,
      params: { ...params(weeklyTheme, 'movie', 1, week), with_origin_country: 'IN' },
    },
    ...lanes.map((l) => ({
      path: `/discover/${l.type}`,
      type: l.type,
      params: {
        ...params(l.theme, l.type, 1 + (hash(day + l.type + l.theme.name) % 3)),
        ...l.extra,
      },
    })),
    {
      path: '/discover/tv',
      type: 'tv' as MediaType,
      params: { ...params(DAILY_THEMES[1], 'tv'), with_genres: '99' },
    },
    ...(['movie', 'tv'] as MediaType[]).map((type) => ({
      path: `/discover/${type}`,
      type,
      params: params(DAILY_THEMES[3], type, 1),
    })),
  ];
  const pages = await mapLimit(jobs, 4, async (j) => {
    try {
      return { ok: true as const, data: await cataloguePage(j.path, j.type, j.params) };
    } catch (error) {
      return { ok: false as const, error };
    }
  });
  if (pages.every((p) => !p.ok)) throw (pages[0] as { error: unknown }).error;
  const lists = pages.map((p) => (p.ok ? p.data.results.slice(0, 12) : []));
  const detailed = await enrich(unique(lists.flat()));
  const allowed = detailed.filter((m) => !m.adult && (allowMature || safeForGeneral(m)));
  const map = new Map(allowed.map((m) => [m.key, m]));
  const from = (items: Media[]) =>
    items.map((m) => map.get(m.key)).filter((m): m is Media => Boolean(m));
  const weeklyPool = from(lists.slice(3, 6).flat()).filter(
    (m) => !weeklyTheme.international || m.language !== 'en',
  );
  const weekly: Media[] = [];
  for (let n = 0; n < 5; n++) {
    const m = pickEditorial(weeklyPool, weeklyTheme, week, weekly);
    if (m) weekly.push(editorial(m, weeklyTheme, 'weekly'));
  }
  const daily: Media[] = [];
  const excluded = new Set([
    ...weekly.map((m) => m.key),
    ...fixedWeekly,
    ...(preferences?.feedback || [])
      .filter((f) => f.kind === 'dislike' || (preferences?.excludeWatched && f.kind === 'watched'))
      .map((f) => f.key),
  ]);
  for (const [index, lane] of lanes.entries()) {
    const pool = from(index === 4 ? [...lists[6 + index], ...lists[11]] : lists[6 + index]).filter(
      (m) => !excluded.has(m.key),
    );
    const fresh = pool.filter((m) => !recent.includes(m.key));
    const m = pickEditorial(
      fresh.length ? fresh : pool,
      lane.theme,
      day + index,
      daily,
      preferences,
    );
    if (m) {
      const personal = Boolean(
        preferences?.feedback.some(
          (f) =>
            f.kind === 'like' &&
            (f.language === m.language || f.genres.some((g) => m.genres.includes(g))),
        ),
      );
      daily.push(
        editorial(m, lane.theme, 'daily', personal, !fresh.length && recent.includes(m.key)),
      );
    }
  }
  const popular = unique(
    Array.from({ length: 8 }, (_, i) => [from(lists[0])[i], from(lists[1])[i]])
      .flat()
      .filter((m): m is Media => Boolean(m)),
  ).slice(0, 8);
  const trending = from(lists[2])
    .filter((m) => !popular.some((p) => p.key === m.key))
    .slice(0, 8);
  const outside = from(lists.slice(12).flat())
    .filter((m) => m.votes >= 50 && m.votes <= 1500 && (m.rating || 0) >= 6)
    .sort((a, b) => a.popularity - b.popularity)
    .slice(0, 6);
  return {
    daily,
    weekly,
    popular,
    trending,
    outside,
    dayKey: day,
    weekKey: week,
    weeklyTheme: weeklyTheme.name,
    weeklyDescription: weeklyTheme.description,
    partial: pages.some((p) => !p.ok) || detailed.some((m) => !m.enriched),
  };
}
