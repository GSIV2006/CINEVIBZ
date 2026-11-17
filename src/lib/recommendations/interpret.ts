import { TAXONOMY } from './taxonomy';
import { regionConstraints, hasCatalogueConstraints } from '../catalogue-intent';
import { LANGUAGES, type Constraints, type Interpretation } from '@/lib/types';
const genreWords: Record<string, number> = {
  action: 28,
  adventure: 12,
  animation: 16,
  animated: 16,
  comedy: 35,
  crime: 80,
  documentary: 99,
  documentaries: 99,
  drama: 18,
  family: 10751,
  fantasy: 14,
  history: 36,
  horror: 27,
  music: 10402,
  mystery: 9648,
  romance: 10749,
  'sci-fi': 878,
  'science fiction': 878,
  thriller: 53,
  war: 10752,
  western: 37,
};
export function interpret(prompt: string, overrides: Partial<Constraints> = {}): Interpretation {
  overrides = Object.fromEntries(
    Object.entries(overrides).filter(([, value]) => value !== undefined),
  );
  const text = prompt.toLowerCase().replace(/[’']/g, "'").trim();
  const negative = [
    ...text.matchAll(
      /\b(?:no|not|without|exclude|excluding|avoid|except|anything but)\s+(.+?)(?=[,.;]|\bbut\b|\band\b|$)/g,
    ),
  ].map((m) => m[1]);
  const positive = text.replace(
    /\b(?:no|not|without|exclude|excluding|avoid|except|anything but)\s+(.+?)(?=[,.;]|\bbut\b|\band\b|$)/g,
    ' ',
  );
  const c: Constraints = {
    genres: [],
    excludedGenres: [],
    excludedLanguages: [],
    excludeWatched: true,
  };
  Object.assign(c, regionConstraints(positive, negative));
  const conflicts: string[] = [];
  const notes: string[] = [];
  if (/\b(movies?|films?|feature)\b/.test(positive)) c.type = 'movie';
  if (/\b(series|tv|television|shows?)\b/.test(positive)) {
    if (c.type && !/movie or|film or|movies and|films and/.test(positive))
      conflicts.push(
        'Both films and series were requested. Choose one format, or say “movies or series”.',
      );
    else c.type = 'tv';
  }
  if (
    /movies? or (?:tv |television )?(?:series|shows?)|films? or (?:tv )?series|movies and series|films and series/.test(
      positive,
    )
  )
    delete c.type;
  if (/\banime\b/.test(positive)) {
    c.anime = true;
    c.animation = true;
    c.language = 'ja';
    c.genres.push(16);
  }
  if (/\banimat(?:ion|ed)\b/.test(positive)) {
    c.animation = true;
    c.genres.push(16);
  }
  for (const [word, id] of Object.entries(genreWords)) {
    const pattern = new RegExp('\\b' + word + 's?\\b');
    if (negative.some((n) => pattern.test(n))) c.excludedGenres.push(id);
    // Emotion words do not silently become hard genre constraints.
    if (pattern.test(positive) && ![12, 18, 10751, 14, 36, 10402, 9648, 10749, 10752].includes(id))
      c.genres.push(id);
    else if (
      new RegExp('(?:only |genre:? |a |an )' + word + '(?: movie| film| series|$)').test(positive)
    )
      c.genres.push(id);
  }
  for (const [code, name] of Object.entries(LANGUAGES)) {
    const word = name.toLowerCase();
    if (negative.some((n) => n.includes(word))) c.excludedLanguages.push(code);
    if (new RegExp('\\b' + word + '\\b').test(positive)) {
      if (c.language && c.language !== code)
        conflicts.push(
          'The requested language conflicts with the selected cinema industry or anime filter.',
        );
      c.language = code;
    }
  }
  const decade = positive.match(/\b((?:19|20)\d)0s\b/);
  if (decade) {
    c.yearFrom = Number(decade[1] + '0');
    c.yearTo = c.yearFrom + 9;
  }
  const range = positive.match(/\b((?:19|20)\d{2})\s*(?:-|to|through)\s*((?:19|20)\d{2})\b/);
  if (range) {
    c.yearFrom = +range[1];
    c.yearTo = +range[2];
  }
  const after = positive.match(/(?:after|since|from)\s+((?:19|20)\d{2})/);
  if (after && !range) c.yearFrom = +after[1] + (after[0].startsWith('after') ? 1 : 0);
  const before = positive.match(/(?:before|until|through)\s+((?:19|20)\d{2})/);
  if (before && !range) c.yearTo = +before[1] - (before[0].startsWith('before') ? 1 : 0);
  const exact = positive.match(/(?:in|released in)\s+((?:19|20)\d{2})/);
  if (exact) {
    c.yearFrom = +exact[1];
    c.yearTo = +exact[1];
  }
  const runtime = positive.match(
    /(?:under|less than|at most|within)\s+(\d+)\s*(minutes?|mins?|hours?|hrs?)/,
  );
  if (runtime)
    c.runtimeMax =
      +runtime[1] * (runtime[2].startsWith('h') ? 60 : 1) -
      (runtime[0].startsWith('under') || runtime[0].startsWith('less') ? 1 : 0);
  const signals = TAXONOMY.filter((s) => s.pattern.test(positive)).map(
    ({ pattern, ...signal }) => signal,
  );
  if (/(?:wandering|walking).*(?:tokyo).*(?:2\s*a\.?m|night)/i.test(positive)) {
    for (const key of ['melancholy', 'meditative']) {
      const entry = TAXONOMY.find((s) => s.key === key)!;
      if (!signals.some((s) => s.key === key) && !negative.some((n) => entry.pattern.test(n))) {
        const { pattern, ...signal } = entry;
        signals.push(signal);
      }
    }
    notes.push(
      'Late-night wandering is interpreted as introspective; the result explanations show which parts the catalogue actually supports.',
    );
  }
  const excludedSignals = TAXONOMY.filter((s) => negative.some((n) => s.pattern.test(n))).map(
    ({ pattern, ...signal }) => signal,
  );
  if (c.type && overrides.type && c.type !== overrides.type)
    conflicts.push('The format in your prompt conflicts with the selected format filter.');
  if (c.language && overrides.language && c.language !== overrides.language)
    conflicts.push('The language in your prompt conflicts with the selected language filter.');
  if (
    c.countries?.length &&
    overrides.countries?.length &&
    !c.countries.some((country) => overrides.countries!.includes(country))
  )
    conflicts.push('The country in your prompt conflicts with the selected country filter.');
  const merged = {
    ...c,
    ...overrides,
    countries: [...new Set([...(c.countries || []), ...(overrides.countries || [])])],
    excludedCountries: [
      ...new Set([...(c.excludedCountries || []), ...(overrides.excludedCountries || [])]),
    ],
    genres: [...new Set([...(c.genres || []), ...(overrides.genres || [])])],
    excludedGenres: [
      ...new Set([...(c.excludedGenres || []), ...(overrides.excludedGenres || [])]),
    ],
    excludedLanguages: [
      ...new Set([...(c.excludedLanguages || []), ...(overrides.excludedLanguages || [])]),
    ],
  };
  if (c.yearFrom && overrides.yearFrom) merged.yearFrom = Math.max(c.yearFrom, overrides.yearFrom);
  if (c.yearTo && overrides.yearTo) merged.yearTo = Math.min(c.yearTo, overrides.yearTo);
  if (c.runtimeMax && overrides.runtimeMax)
    merged.runtimeMax = Math.min(c.runtimeMax, overrides.runtimeMax);
  if (merged.anime) {
    merged.animation = true;
    merged.genres = [...new Set([...merged.genres, 16])];
    if (merged.language && merged.language !== 'ja')
      conflicts.push('Anime and the selected language conflict.');
    merged.language = 'ja';
  }
  if (merged.genres.some((g) => merged.excludedGenres.includes(g)))
    conflicts.push('A genre was both requested and excluded.');
  if (merged.language && merged.excludedLanguages.includes(merged.language))
    conflicts.push('The same language was requested and excluded.');
  if (merged.yearFrom && merged.yearTo && merged.yearFrom > merged.yearTo)
    conflicts.push('The requested release period is empty.');
  if (merged.countries?.some((country) => merged.excludedCountries?.includes(country)))
    conflicts.push('The same country was requested and excluded.');
  if (merged.languages?.length && merged.language && !merged.languages.includes(merged.language))
    conflicts.push('The selected language conflicts with the requested regional cinema.');
  if (!signals.length && !hasCatalogueConstraints(merged))
    notes.push(
      'No reliable emotional signals were recognised. Try describing an atmosphere, emotion or setting.',
    );
  if (signals.some((s) => s.dimension === 'visual' || s.dimension === 'pacing'))
    notes.push(
      'Visual style and pacing are sparsely described in TMDB. Matches use explicit metadata evidence only.',
    );
  if (signals.some((s) => s.key === 'tokyo'))
    notes.push('Tokyo is a relevance signal. For a strict language filter, select Japanese.');
  return { prompt, signals, excludedSignals, constraints: merged, notes, conflicts };
}
