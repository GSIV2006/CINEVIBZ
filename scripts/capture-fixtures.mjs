// Maintenance utility. Only test fixtures use these records; the app never imports them.
import { writeFile, mkdir } from 'node:fs/promises';
const titles = [
  ['Lost in Translation', 2003],
  ['Spirited Away', 2001],
  ['My Neighbor Totoro', 1988],
  ['Grave of the Fireflies', 1988],
  ['Eternal Sunshine of the Spotless Mind', 2004],
  ['The Truman Show', 1998],
  ['Inception', 2010],
  ['Amelie', 2001],
  ['Paddington 2', 2017],
  ['Perfect Days', 2023],
  ['Paprika', 2006],
  ['Arrival', 2016],
  ['The Grand Budapest Hotel', 2014],
  ['Cinema Paradiso', 1988],
  ['Interstellar', 2014],
  ['Little Miss Sunshine', 2006],
  ['Parasite', 2019],
  ['Your Name', 2016],
  ['Aftersun', 2022],
  ['Kiki’s Delivery Service', 1989],
  ['WALL-E', 2008],
  ['The Secret Life of Walter Mitty', 2013],
  ['A Separation', 2011],
  ['The Lunchbox', 2013],
];
const token = process.env.TMDB_READ_ACCESS_TOKEN;
if (!token) throw Error('TMDB token required');
async function get(path, params = {}) {
  const u = new URL('https://api.themoviedb.org/3' + path);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  const r = await fetch(u, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw Error('TMDB HTTP ' + r.status);
  return r.json();
}
const records = [];
for (const [title, year] of titles) {
  const r = await get('/search/movie', {
    query: title,
    primary_release_year: String(year),
    include_adult: 'false',
  });
  const hit = r.results.find((m) => m.release_date?.startsWith(String(year))) || r.results[0];
  if (!hit) {
    console.log('Missing fixture: ' + title);
    continue;
  }
  records.push(await get('/movie/' + hit.id, { append_to_response: 'keywords,release_dates' }));
}
for (const id of [1399, 1396, 46298, 94605]) {
  const raw = await get('/tv/' + id, { append_to_response: 'keywords,content_ratings' });
  records.push({ ...raw, media_type: 'tv' });
}
await mkdir('tests/fixtures', { recursive: true });
await writeFile(
  'tests/fixtures/tmdb.json',
  JSON.stringify(
    { capturedAt: new Date().toISOString(), source: 'https://api.themoviedb.org/3', records },
    null,
    2,
  ),
);
console.log('Captured ' + records.length + ' actual TMDB records for offline tests.');
