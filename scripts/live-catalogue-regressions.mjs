import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const origin = process.env.CINEVIBZ_TEST_URL || 'http://127.0.0.1:3000';
const checks = [];
async function request(path, body) {
  const r = await fetch(
    origin + path,
    body
      ? {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        }
      : {},
  );
  return { status: r.status, data: await r.json() };
}
async function test(name, fn) {
  const started = Date.now();
  try {
    const evidence = await fn();
    checks.push({ name, passed: true, ms: Date.now() - started, ...evidence });
    console.log('PASS ' + name);
  } catch (e) {
    checks.push({ name, passed: false, error: e.message });
    console.log('FAIL ' + name + ': ' + e.message);
  }
}
const titles = (data) =>
  data.results.map((m) => ({
    id: m.id,
    title: m.title,
    language: m.language,
    countries: m.countries,
    credit: m.credit,
    date: m.date,
  }));
await test('Indian search: every result has Indian origin', async () => {
  const { status, data } = await request('/api/search?q=Indian');
  assert.equal(status, 200);
  assert(data.results.length > 5);
  assert(data.results.every((m) => m.countries.includes('IN')));
  assert.equal(data.results[0].type, 'movie');
  return { sample: titles(data).slice(0, 8) };
});
await test('Indian entered as a mood: constrained catalogue, no global fallback', async () => {
  const { status, data } = await request('/api/recommend', { prompt: 'Indian' });
  assert.equal(status, 200);
  assert(data.catalogue.results.length > 5);
  assert(data.catalogue.results.every((m) => m.countries.includes('IN')));
  assert.equal(data.results.length, 0);
  return { sample: titles(data.catalogue).slice(0, 5) };
});
await test('Ram Charan: correct person and his actual feature-film credits first', async () => {
  const { status, data } = await request('/api/search?q=ram%20charan');
  assert.equal(status, 200);
  assert.equal(data.person.id, 147023);
  assert.equal(data.results[0].title, 'RRR');
  assert(data.results.some((m) => m.id === 1057265));
  assert(data.results.every((m) => m.credit.includes('Ram Charan')));
  return { personId: data.person.id, sample: titles(data).slice(0, 8) };
});
await test('Ram Charan entered as a mood resolves to the same person', async () => {
  const { status, data } = await request('/api/recommend', { prompt: 'Ram Charan' });
  assert.equal(status, 200);
  assert.equal(data.catalogue.person.id, 147023);
  return { sample: titles(data.catalogue).slice(0, 4) };
});
await test('Actor phrase plus country and movie constraints', async () => {
  const { status, data } = await request('/api/search?q=Indian%20movies%20with%20Ram%20Charan');
  assert.equal(status, 200);
  assert.equal(data.person.id, 147023);
  assert(data.results.length > 5);
  assert(data.results.every((m) => m.type === 'movie' && m.countries.includes('IN')));
  return {};
});
await test('Peddi exact title is first, with its own artwork and Telugu metadata', async () => {
  const { status, data } = await request('/api/search?q=peddi');
  assert.equal(status, 200);
  const m = data.results[0];
  assert.equal(m.id, 1057265);
  assert.equal(m.title, 'Peddi');
  assert.equal(m.language, 'te');
  assert(m.poster);
  return { sample: titles(data).slice(0, 1) };
});
await test('Peddi detail opens with cast and real metadata', async () => {
  const { status, data } = await request('/api/title/movie/1057265');
  assert.equal(status, 200);
  assert.equal(data.title, 'Peddi');
  assert(data.cast.some((p) => p.id === 147023));
  return { status: data.status, rating: data.certification };
});
await test('Explicit family-only search still respects the rating filter', async () => {
  const { status, data } = await request('/api/search?q=peddi&safe=true');
  assert.equal(status, 200);
  assert(!data.results.some((m) => m.id === 1057265));
  return {};
});
await test('Malayalam thrillers: original language and genre both enforced', async () => {
  const { status, data } = await request('/api/search?q=Malayalam%20thrillers');
  assert.equal(status, 200);
  assert(data.results.length > 0);
  assert(data.results.every((m) => m.language === 'ml' && m.genres.includes(53)));
  return { sample: titles(data).slice(0, 5) };
});
await test('South Indian movies: regional languages and country both enforced', async () => {
  const { status, data } = await request('/api/search?q=South%20Indian%20movies');
  assert.equal(status, 200);
  assert(data.results.length > 0);
  assert(
    data.results.every(
      (m) => m.countries.includes('IN') && ['te', 'ta', 'ml', 'kn'].includes(m.language),
    ),
  );
  return { sample: titles(data).slice(0, 5) };
});
await test('Upcoming Indian films remain searchable', async () => {
  const { status, data } = await request('/api/search?q=Indian%20movies&release=upcoming');
  assert.equal(status, 200);
  assert(data.results.length > 0);
  const now = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  assert(data.results.every((m) => m.countries.includes('IN') && m.date > now));
  return { sample: titles(data).slice(0, 4) };
});
await test('Conflicting country requests produce an actionable error', async () => {
  const { status, data } = await request('/api/recommend', {
    prompt: 'Indian movies',
    filters: { country: 'US' },
  });
  assert.equal(status, 422);
  assert(data.error.includes('country'));
  return {};
});
await test('Unrecognised query produces no unrelated recommendations', async () => {
  const { status, data } = await request('/api/recommend', {
    prompt: 'zxqvzz nonexistent title qlmnop',
  });
  assert.equal(status, 200);
  assert.equal(data.catalogue.results.length, 0);
  assert.equal(data.results.length, 0);
  return {};
});
await test('Indian comfort mood never leaks western productions', async () => {
  const { status, data } = await request('/api/recommend', {
    prompt: 'Indian comforting movies',
    preferences: { allowMature: true },
  });
  assert.equal(status, 200);
  assert(data.results.length > 0);
  assert(data.results.every((m) => m.countries.includes('IN') && m.evidence.length > 0));
  return { sample: titles(data).slice(0, 5) };
});
await test('Actor pagination does not repeat the first page', async () => {
  const one = await request('/api/search?q=Ram%20Charan');
  const two = await request('/api/search?q=Ram%20Charan&page=2');
  assert.equal(two.status, 200);
  assert(two.data.results.length > 0);
  const keys = new Set(one.data.results.map((m) => m.key));
  assert(two.data.results.every((m) => !keys.has(m.key)));
  return {};
});
await fs.mkdir('docs', { recursive: true });
await fs.writeFile(
  'docs/catalogue-regressions-live.json',
  JSON.stringify(
    {
      checkedAt: new Date().toISOString(),
      passed: checks.filter((c) => c.passed).length,
      total: checks.length,
      checks,
    },
    null,
    2,
  ) + '\n',
);
if (checks.some((c) => !c.passed)) process.exitCode = 1;
