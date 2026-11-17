import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url)).replace(/\/$/, '');
const env = await fs.readFile(root + '/.env.local', 'utf8');
const token = env
  .match(/^TMDB_READ_ACCESS_TOKEN=(.*)$/m)?.[1]
  ?.trim()
  .replace(/^['"]|['"]$/g, '');
const cache = new Map();
async function get(path, params = {}) {
  const u = new URL('https://api.themoviedb.org/3' + path);
  u.searchParams.set('language', 'en-US');
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, String(v));
  const r = await fetch(u, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) throw Error('TMDB ' + r.status + ' ' + path);
  return r.json();
}
const plans = {
  Movies: [
    ['RRR', 2022],
    ['Peddi', 2026],
    ['Magadheera', 2009],
    ['Lagaan', 2001],
    ['3 Idiots', 2009],
    ['Dangal', 2016],
    ['Baahubali: The Beginning', 2015],
    ['Eega', 2012],
  ],
  Anime: [
    ['Spirited Away'],
    ['Your Name.'],
    ['Princess Mononoke'],
    ['Akira'],
    ['Perfect Blue'],
    ['My Neighbor Totoro'],
    ['The Boy and the Heron'],
    ['Howl’s Moving Castle'],
  ],
  'International Cinema': [
    ['Parasite', 2019],
    ['Amélie', 2001],
    ['Life Is Beautiful', 1997],
    ['Cinema Paradiso', 1988],
    ['Pan’s Labyrinth', 2006],
    ['City of God', 2002],
    ['The Lives of Others', 2006],
    ['A Separation', 2011],
  ],
  'TV & Series': [
    ['Breaking Bad', 2008],
    ['Dark', 2017],
    ['Chernobyl', 2019],
    ['Stranger Things', 2016],
    ['Fleabag', 2016],
    ['The Office', 2005],
    ['Shōgun', 2024],
    ['Better Call Saul', 2015],
  ],
  Animation: [
    ['Inside Out', 2015],
    ['Coco', 2017],
    ['Spider-Man: Into the Spider-Verse', 2018],
    ['Toy Story', 1995],
    ['Finding Nemo', 2003],
    ['WALL·E', 2008],
    ['The Iron Giant', 1999],
    ['Ratatouille', 2007],
  ],
  'Directors & Filmmakers': [
    ['Inception', 2010],
    ['The Grand Budapest Hotel', 2014],
    ['Seven Samurai', 1954],
    ['Pulp Fiction', 1994],
    ['The Godfather', 1972],
    ['Jaws', 1975],
    ['Portrait of a Lady on Fire', 2019],
    ['Get Out', 2017],
  ],
  'Soundtracks & Music': [
    ['Interstellar', 2014],
    ['Inception', 2010],
    ['RRR', 2022],
    ['Jurassic Park', 1993],
    ['The Good, the Bad and the Ugly', 1966],
    ['The Social Network', 2010],
    ['Amélie', 2001],
    ['Black Panther', 2018],
  ],
  'Film History': [
    ['Citizen Kane', 1941],
    ['Metropolis', 1927],
    ['Modern Times', 1936],
    ['The General', 1926],
    ['The Gold Rush', 1925],
    ['12 Angry Men', 1957],
    ['Rear Window', 1954],
    ['Psycho', 1960],
  ],
};
const normal = (s) =>
  s
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\p{L}\p{N}]/gu, '')
    .toLowerCase();
async function record(title, year, type) {
  const key = type + title;
  if (cache.has(key)) return cache.get(key);
  const promise = (async () => {
    const r = await get('/search/' + type, { query: title, include_adult: false });
    let found = r.results.find(
      (m) =>
        normal(m.title || m.name) === normal(title) &&
        (!year || (m.release_date || m.first_air_date || '').startsWith(String(year))),
    );
    if (!found) throw Error('Missing exact record ' + title);
    const detail = await get('/' + type + '/' + found.id, { append_to_response: 'credits' });
    return { ...detail, media_type: type };
  })();
  cache.set(key, promise);
  return promise;
}
const all = [];
const entries = Object.entries(plans).flatMap(([category, titles]) =>
  titles.map(([title, year], index) => ({ category, title, year, index })),
);
let index = 0;
await Promise.all(
  Array.from({ length: 4 }, async () => {
    while (index < entries.length) {
      const entry = entries[index++];
      const r = await record(
        entry.title,
        entry.year,
        entry.category === 'TV & Series' ? 'tv' : 'movie',
      );
      if (
        entry.category === 'Anime' &&
        (r.original_language !== 'ja' || !r.genres.some((g) => g.id === 16))
      )
        throw Error('Invalid anime record ' + entry.title);
      all.push({ ...entry, r });
    }
  }),
);
const languages = {
  te: 'Telugu',
  hi: 'Hindi',
  ta: 'Tamil',
  ml: 'Malayalam',
  kn: 'Kannada',
  ja: 'Japanese',
  en: 'English',
  ko: 'Korean',
  fr: 'French',
  it: 'Italian',
  es: 'Spanish',
  pt: 'Portuguese',
  de: 'German',
  fa: 'Persian',
};
const directors = [
  ...new Set(
    all.flatMap(({ r }) =>
      (r.credits?.crew || []).filter((p) => p.job === 'Director').map((p) => p.name),
    ),
  ),
];
const composers = [
  ...new Set(
    all.flatMap(({ r }) =>
      (r.credits?.crew || []).filter((p) => p.job === 'Original Music Composer').map((p) => p.name),
    ),
  ),
];
const questions = [];
for (const { category, index, r } of all.sort(
  (a, b) => a.category.localeCompare(b.category) || a.index - b.index,
)) {
  const title = r.title || r.name,
    year = Number((r.release_date || r.first_air_date).slice(0, 4));
  let answer,
    question,
    explanation,
    distractors,
    excluded = [];
  if (category === 'International Cinema' || category === 'Movies') {
    answer = languages[r.original_language];
    if (!answer) throw Error('Unsupported language ' + title);
    question = `What is the original language of ${title} (${year})?`;
    explanation = `${title} is catalogued with ${answer} as its original language. Dubbed versions do not change that original-language credit.`;
    distractors = Object.values(languages).filter((l) => l !== answer);
  } else if (category === 'Film History' || category === 'TV & Series') {
    answer = String(year);
    question =
      category === 'TV & Series'
        ? `In which year did ${title} first air?`
        : `Which primary release year does TMDB list for ${title}?`;
    explanation = `${title} has a ${category === 'TV & Series' ? 'first-air' : 'primary release'} date of ${r.release_date || r.first_air_date} in the catalogue. Local release dates can differ.`;
    distractors = [String(year - 5), String(year + 3), String(year + 1)];
  } else {
    const job = category === 'Soundtracks & Music' ? 'Original Music Composer' : 'Director';
    excluded = (r.credits.crew || []).filter((p) => p.job === job).map((p) => p.name);
    answer = excluded[0];
    if (!answer) throw Error('Missing ' + job + ' for ' + title);
    question =
      job === 'Director'
        ? `Who is credited as a director of ${title} (${year})?`
        : `Who is credited for the original music of ${title} (${year})?`;
    explanation = `${r.title || r.name} credits ${excluded.join(' and ')} ${job === 'Director' ? 'for direction' : 'as original music composer' + (excluded.length > 1 ? 's' : '')}.`;
    distractors = (job === 'Director' ? directors : composers).filter((n) => !excluded.includes(n));
  }
  const wrong = [...new Set(distractors)].slice(
    index % Math.max(1, distractors.length - 3),
    (index % Math.max(1, distractors.length - 3)) + 3,
  );
  if (wrong.length < 3) throw Error('Not enough verified answer choices');
  const answerIndex = (index + category.length) % 4,
    options = [...wrong];
  options.splice(answerIndex, 0, answer);
  questions.push({
    id: `bank-${category.toLowerCase().replace(/[^a-z]/g, '')}-${r.media_type}-${r.id}`,
    category,
    question,
    options,
    answer: answerIndex,
    explanation,
    source: `https://www.themoviedb.org/${r.media_type}/${r.id}`,
    verifiedAt: new Date().toISOString(),
    recordId: r.id,
  });
}
await fs.writeFile(root + '/src/data/quiz-bank.json', JSON.stringify(questions, null, 2) + '\n');
await fs.writeFile(
  root + '/docs/quiz-verification.json',
  JSON.stringify(
    {
      verifiedAt: new Date().toISOString(),
      method:
        'Each fact and distractor name checked against live TMDB title details and credits. No runtime AI generation.',
      records: [
        ...new Map(
          all.map(({ r }) => [
            r.media_type + ':' + r.id,
            {
              id: r.id,
              type: r.media_type,
              title: r.title || r.name,
              date: r.release_date || r.first_air_date,
              language: r.original_language,
              directors: r.credits.crew.filter((p) => p.job === 'Director').map((p) => p.name),
              composers: r.credits.crew
                .filter((p) => p.job === 'Original Music Composer')
                .map((p) => p.name),
            },
          ]),
        ).values(),
      ],
    },
    null,
    2,
  ) + '\n',
);
console.log(
  JSON.stringify({
    questions: questions.length,
    categories: Object.keys(plans),
    verifiedRecords: cache.size,
  }),
);
