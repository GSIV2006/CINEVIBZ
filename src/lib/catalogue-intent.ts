import { GENRES, LANGUAGES, type Constraints } from './types';

export const COUNTRIES: Record<string, string> = {
  IN: 'India',
  US: 'United States',
  GB: 'United Kingdom',
  JP: 'Japan',
  KR: 'South Korea',
  FR: 'France',
  ES: 'Spain',
  IT: 'Italy',
  DE: 'Germany',
  CN: 'China',
  IR: 'Iran',
};
export const INDUSTRIES = [
  {
    pattern: /\b(?:indian|india|desi|bollywood|tollywood|kollywood|mollywood|sandalwood)\b/i,
    country: 'IN',
  },
  { pattern: /\b(?:american|hollywood)\b/i, country: 'US' },
  { pattern: /\bbritish\b/i, country: 'GB' },
];
export function regionConstraints(positive: string, negative: string[]): Partial<Constraints> {
  const countries = INDUSTRIES.filter((x) => x.pattern.test(positive)).map((x) => x.country);
  const excludedCountries = INDUSTRIES.filter((x) => negative.some((n) => x.pattern.test(n))).map(
    (x) => x.country,
  );
  const industryLanguage = /\bbollywood\b/i.test(positive)
    ? 'hi'
    : /\btollywood\b/i.test(positive)
      ? 'te'
      : /\bkollywood\b/i.test(positive)
        ? 'ta'
        : /\bmollywood\b/i.test(positive)
          ? 'ml'
          : /\bsandalwood\b/i.test(positive)
            ? 'kn'
            : undefined;
  return {
    countries,
    excludedCountries,
    ...(industryLanguage ? { language: industryLanguage } : {}),
    ...(/\bsouth[- ]indian\b/i.test(positive) ? { languages: ['te', 'ta', 'ml', 'kn'] } : {}),
    ...(/\b(?:upcoming|unreleased|not yet released)\b/i.test(positive)
      ? { release: 'upcoming' as const }
      : {}),
  };
}
export function normalizedName(text: string) {
  return text
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, '');
}
export function entityQuery(text: string): string {
  // Strip query grammar, never invent a person's name or a title.
  return text
    .replace(/\b(?:show me|find me|recommend me|suggest me|i want|i need|looking for)\b/gi, ' ')
    .replace(
      /\b(?:movies?|films?|cinema|series|shows?|filmography|starring|featuring|directed by|with|by|of|actor|actress|director)\b/gi,
      ' ',
    )
    .replace(/['’]s\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
export function onlyCatalogueConstraints(query: string, c: Constraints): boolean {
  if (!query.trim()) return true;
  let rest = entityQuery(query);
  const words = [
    ...Object.values(LANGUAGES),
    ...Object.values(GENRES),
    'Indian',
    'India',
    'Desi',
    'Bollywood',
    'Tollywood',
    'Kollywood',
    'Mollywood',
    'Sandalwood',
    'South',
    'American',
    'Hollywood',
    'British',
    'anime',
    'animated',
    'upcoming',
    'released',
    'only',
    'all',
    'popular',
    'best',
    'new',
    'latest',
    'in',
    'from',
    'before',
    'after',
    'since',
    'until',
    'to',
    'and',
    'or',
    'under',
    'minutes',
    'minute',
    'hours',
    'hour',
    'no',
    'not',
    'without',
    'avoid',
    'except',
    'excluding',
  ];
  for (const word of words.sort((a, b) => b.length - a.length))
    rest = rest.replace(
      new RegExp('\\b' + word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + 's?\\b', 'gi'),
      ' ',
    );
  if (c.yearFrom || c.yearTo) rest = rest.replace(/\b(?:19|20)\d{2}s?\b/g, '');
  if (c.runtimeMax) rest = rest.replace(/\b\d{1,3}\b/g, '');
  rest = rest.replace(/[\s,.;!\-]/g, '');
  return !rest && hasCatalogueConstraints(c);
}
export function hasCatalogueConstraints(c: Constraints) {
  return Boolean(
    c.type ||
    c.anime ||
    c.animation ||
    c.language ||
    c.countries?.length ||
    c.languages?.length ||
    c.genres.length ||
    c.excludedGenres.length ||
    c.excludedCountries?.length ||
    c.excludedLanguages.length ||
    c.yearFrom ||
    c.yearTo ||
    c.runtimeMax ||
    c.release,
  );
}
export const tvGenre = (id: number) =>
  ({ 28: 10759, 12: 10759, 878: 10765, 14: 10765, 10752: 10768, 36: 10768 })[id] || id;
export function constraintLabel(c: Constraints) {
  const places = (c.countries || []).map((x) => COUNTRIES[x] || x).join(' / ');
  return [
    places,
    c.language
      ? LANGUAGES[c.language] || c.language
      : c.languages?.length
        ? 'South Indian languages'
        : '',
    c.genres.map((x) => GENRES[x]).join(' + '),
    c.type === 'tv' ? 'series' : c.type === 'movie' ? 'films' : 'cinema',
  ]
    .filter(Boolean)
    .join(' · ');
}
