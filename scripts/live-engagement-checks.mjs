import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const base = process.env.CINEVIBZ_TEST_URL || 'http://127.0.0.1:3000',
  checks = [];
async function req(path, body) {
  const r = await fetch(
    base + path,
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
  try {
    const evidence = await fn();
    checks.push({ name, passed: true, ...evidence });
    console.log('PASS ' + name);
  } catch (e) {
    checks.push({ name, passed: false, error: e.message });
    console.log('FAIL ' + name + ': ' + e.message);
  }
}
let home;
await test('Five daily lanes contain real records with editorial explanations and no weekly overlap', async () => {
  const r = await req('/api/home', { preferences: { allowMature: false } });
  assert.equal(r.status, 200);
  home = r.data;
  assert.equal(home.daily.length, 5);
  assert(home.daily.some((m) => m.type === 'movie'));
  assert(home.daily.some((m) => m.type === 'tv'));
  assert(home.daily.some((m) => m.genres.includes(99)));
  assert(home.daily.some((m) => m.language === 'ja' && m.genres.includes(16)));
  assert(
    home.daily.some((m) => m.genres.includes(16) && m.language !== 'ja') ||
      home.daily.filter((m) => m.genres.includes(16)).length >= 2,
  );
  assert(home.daily.every((m) => m.editorial?.why && m.editorial?.hook && m.poster));
  assert(home.daily.every((m) => !home.weekly.some((w) => w.key === m.key)));
  return {
    daily: home.daily.map((m) => ({ title: m.title, key: m.key, genres: m.genres })),
    weekly: home.weekly.map((m) => ({ title: m.title, key: m.key, language: m.language })),
  };
});
await test('Weekly theme constrains its records, with varied originals and formats', async () => {
  const genres = {
    'Films that stay with you': [18],
    'The art of feeling': [18, 10749],
    'Animation that hits differently': [16],
    'The beautiful and bizarre': [878, 14, 10765],
  }[home.weeklyTheme];
  if (genres) assert(home.weekly.every((m) => genres.some((g) => m.genres.includes(g))));
  if (home.weeklyTheme === 'Stories from somewhere else')
    assert(home.weekly.every((m) => m.language !== 'en'));
  if (home.weeklyTheme === 'Beyond the mainstream')
    assert(home.weekly.every((m) => m.votes >= 50 && m.votes <= 1500));
  assert(new Set(home.weekly.map((m) => m.language)).size >= 3);
  assert(new Set(home.weekly.map((m) => m.type)).size === 2);
  return {};
});
await test('Previously shown daily titles are avoided when alternate records exist', async () => {
  const recent = home.daily.map((m) => m.key),
    r = await req('/api/home', {
      preferences: { allowMature: false },
      recent,
      weekly: home.weekly.map((m) => m.key),
    });
  assert.equal(r.status, 200);
  assert(r.data.daily.length > 0);
  assert(
    r.data.daily.every(
      (m) => !recent.includes(m.key) || m.editorial.why.includes('recent pick returned'),
    ),
  );
  return { next: r.data.daily.map((m) => m.title) };
});
await test('Disliked titles are excluded from personalized daily picks', async () => {
  const m = home.daily[0],
    r = await req('/api/home', {
      preferences: {
        allowMature: false,
        feedback: [
          {
            key: m.key,
            kind: 'dislike',
            genres: m.genres,
            language: m.language,
            keywords: m.keywords,
          },
        ],
      },
    });
  assert.equal(r.status, 200);
  assert(r.data.daily.every((x) => x.key !== m.key));
  return {};
});
await test('Three anime spins respect Japanese animation and exclude earlier session picks', async () => {
  const seen = [];
  for (let i = 0; i < 3; i++) {
    const r = await req(
      '/api/roulette?type=anime&mature=true&from=2000&to=2026&exclude=' + seen.join(','),
    );
    assert.equal(r.status, 200);
    assert.equal(r.data.language, 'ja');
    assert(r.data.genres.includes(16));
    assert(r.data.year >= 2000 && r.data.year <= 2026);
    assert(!seen.includes(r.data.key));
    seen.push(r.data.key);
  }
  return { keys: seen };
});
await test('Documentary roulette uses genuine documentary records', async () => {
  const r = await req('/api/roulette?type=documentary&mature=true');
  assert.equal(r.status, 200);
  assert(r.data.genres.includes(99));
  return { title: r.data.title, key: r.data.key };
});
await test('Reversed release period produces a useful error', async () => {
  const r = await req('/api/roulette?from=2025&to=1990');
  assert.equal(r.status, 422);
  assert.match(r.data.error, /reversed/);
  return {};
});
await test('An empty draw does not substitute an unrelated title', async () => {
  const r = await req('/api/roulette?type=movie&language=te&from=1900&to=1900');
  assert.equal(r.status, 404);
  assert.match(r.data.error, /Broaden/);
  return {};
});
await test('Daily challenge reaches the recommendation engine with supported evidence', async () => {
  const r = await req('/api/recommend', {
    prompt: 'Dark, mysterious, neon-lit thrillers about identity.',
    preferences: { allowMature: false },
  });
  assert.equal(r.status, 200);
  assert(r.data.results.length > 0);
  assert(r.data.results.every((m) => m.evidence.length > 0));
  return { titles: r.data.results.slice(0, 4).map((m) => m.title) };
});
await fs.writeFile(
  'docs/engagement-live-checks.json',
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
