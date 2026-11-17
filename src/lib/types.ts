export type MediaType = 'movie' | 'tv';
export type Dimension =
  'emotion' | 'atmosphere' | 'theme' | 'visual' | 'setting' | 'pacing' | 'experience';
export type Signal = {
  key: string;
  label: string;
  dimension: Dimension;
  evidence: string[];
  keywords: string[];
};
export type Constraints = {
  type?: MediaType;
  anime?: boolean;
  animation?: boolean;
  genres: number[];
  excludedGenres: number[];
  language?: string;
  countries?: string[];
  excludedCountries?: string[];
  languages?: string[];
  release?: 'upcoming' | 'released';
  excludedLanguages: string[];
  yearFrom?: number;
  yearTo?: number;
  runtimeMax?: number;
  allowMature?: boolean;
  excludeWatched?: boolean;
};
export type Interpretation = {
  prompt: string;
  signals: Signal[];
  excludedSignals: Signal[];
  constraints: Constraints;
  notes: string[];
  conflicts: string[];
};
export type Media = {
  id: number;
  key: string;
  type: MediaType;
  title: string;
  originalTitle: string;
  overview: string;
  poster: string | null;
  backdrop: string | null;
  date: string;
  year: number | null;
  genres: number[];
  genreNames: string[];
  language: string;
  countries: string[];
  rating: number | null;
  votes: number;
  popularity: number;
  adult: boolean;
  runtime: number | null;
  keywords: string[];
  certification?: { country: string; rating: string };
  collectionId?: number;
  enriched: boolean;
  status?: string;
  credit?: string;
  editorial?: {
    period: 'daily' | 'weekly';
    theme: string;
    hook: string;
    why: string;
    evidence?: Evidence[];
    coverage?: number;
  };
  cast?: { id?: number; name: string; character: string; image: string | null }[];
  crew?: { name: string; job: string }[];
  seasons?: number;
  episodes?: number;
  related?: Media[];
  similar?: Media[];
};
export type Feedback = {
  key: string;
  kind: 'like' | 'dislike' | 'watched';
  genres: number[];
  language: string;
  keywords: string[];
};
export type Preferences = {
  feedback: Feedback[];
  moods: string[];
  allowMature: boolean;
  excludeWatched: boolean;
};
export type Evidence = {
  signal: string;
  dimension: Dimension;
  term: string;
  strength: number;
  source: 'synopsis' | 'keyword' | 'country';
};
export type Recommendation = Media & {
  score: number;
  match: 'Strong resonance' | 'Promising connection' | 'A loose connection';
  explanation: string;
  evidence: Evidence[];
  coverage: number;
};
export type PageResult = {
  results: Media[];
  page: number;
  totalPages: number;
  totalResults: number;
};
export type Person = {
  id: number;
  name: string;
  image: string | null;
  department: string;
  knownFor: string[];
  aliases: string[];
};
export type CatalogueResult = PageResult & {
  intent: 'person' | 'title' | 'catalogue';
  heading: string;
  note: string;
  people: Person[];
  person?: Person;
  constraints: Constraints;
  partial: boolean;
};
export type HomeData = {
  daily: Media[];
  weekly: Media[];
  popular: Media[];
  trending: Media[];
  outside: Media[];
  dayKey: string;
  weekKey: string;
  weeklyTheme: string;
  weeklyDescription: string;
  partial: boolean;
};
export const GENRES: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western',
  10759: 'Action & Adventure',
  10762: 'Kids',
  10765: 'Sci-Fi & Fantasy',
  10768: 'War & Politics',
  10764: 'Reality',
  10767: 'Talk',
  10763: 'News',
};
export const LANGUAGES: Record<string, string> = {
  en: 'English',
  ja: 'Japanese',
  ko: 'Korean',
  fr: 'French',
  es: 'Spanish',
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  ml: 'Malayalam',
  kn: 'Kannada',
  bn: 'Bengali',
  mr: 'Marathi',
  pa: 'Punjabi',
  gu: 'Gujarati',
  or: 'Odia',
  as: 'Assamese',
  it: 'Italian',
  de: 'German',
  zh: 'Mandarin',
  cn: 'Cantonese',
  fa: 'Persian',
  pt: 'Portuguese',
  ar: 'Arabic',
};
