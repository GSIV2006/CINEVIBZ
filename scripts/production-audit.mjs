import fs from 'node:fs/promises';
const base = process.env.CINEVIBZ_TEST_URL || 'http://127.0.0.1:3000';
const output = process.env.CINEVIBZ_AUDIT_OUTPUT || 'work/production-audit/current.json';
const prompts = [
  'A movie that feels like walking through Tokyo at 2 AM.',
  'Something beautiful but emotionally devastating.',
  'An anime that makes me want to change my life.',
  'Something like childhood summer holidays.',
  'A film that feels like a fever dream.',
  'Something peaceful for a rainy evening.',
  'A mind-bending psychological thriller.',
  'Something that feels like the end of summer.',
  'A mysterious film with beautiful cinematography.',
  'Something hopeful after a difficult day.',
];
const searches = [
  'Interstellar',
  'Spirited Away',
  'Naruto',
  'Attack on Titan',
  'Christopher Nolan',
  'Leonardo DiCaprio',
  'Spider-Man',
  'RRR',
  'Kantara',
  'Drishyam',
  'Vikram',
  '12th Fail',
  'Premalu',
  'Maharaja',
  'Ram Charan',
  'Allu Arjun',
  'Mani Ratnam',
  'Peddi',
  'Sen to Chihiro no kamikakushi',
  'Indian',
  'South Indian movies',
  'Malayalam thrillers',
];
const rows = [];
await fs.mkdir(output.slice(0, output.lastIndexOf('/')), { recursive: true });
async function capture(kind, label, path, body) {
  const started = Date.now();
  let row;
  try {
    const response = await fetch(base + path, {
      ...(body
        ? {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          }
        : {}),
      signal: AbortSignal.timeout(90000),
    });
    row = {
      kind,
      label,
      status: response.status,
      ms: Date.now() - started,
      data: await response.json(),
    };
  } catch (error) {
    row = { kind, label, error: error.message, ms: Date.now() - started };
  }
  rows.push(row);
  await fs.writeFile(
    output,
    JSON.stringify({ base, checkedAt: new Date().toISOString(), rows }, null, 2) + '\n',
  );
  const data = row.data;
  console.log(
    JSON.stringify({
      kind,
      label,
      status: row.status,
      ms: row.ms,
      error: row.error || data?.error,
      signals: data?.interpretation?.signals.map((s) => s.key),
      person: data?.person?.name,
      titles: (data?.results || data?.catalogue?.results || data?.daily || [])
        .slice(0, 5)
        .map((m) => ({
          key: m.key,
          title: m.title,
          coverage: m.coverage,
          explanation: m.explanation || m.editorial?.why,
        })),
    }),
  );
}
await capture('home', 'general', '/api/home', { preferences: { allowMature: false } });
for (const prompt of prompts)
  await capture('mood', prompt, '/api/recommend', {
    prompt,
    preferences: { allowMature: !process.env.CINEVIBZ_GENERAL_ONLY },
  });
if (!process.env.CINEVIBZ_MOODS_ONLY) {
  for (const query of searches)
    await capture('search', query, '/api/search?q=' + encodeURIComponent(query));
  for (const type of ['', 'movie', 'tv', 'anime', 'animation', 'documentary'])
    await capture('roulette', type || 'any', '/api/roulette?mature=true&type=' + type);
}
