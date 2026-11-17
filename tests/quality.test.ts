import { it, expect } from 'vitest';
import { writeFileSync, mkdirSync } from 'node:fs';
import { normalize } from '@/lib/providers/tmdb';
import { rank, complies } from '@/lib/recommendations/rank';
import { interpret } from '@/lib/recommendations/interpret';
import { CASES } from './prompts';
import fixture from './fixtures/tmdb.json';
const pool = fixture.records.map((r) =>
  normalize(r, 'media_type' in r && r.media_type === 'tv' ? 'tv' : 'movie'),
);
it('evaluates all curated prompts and records transparent quality metrics', () => {
  const rows = CASES.map((t) => {
    const i = interpret(t.prompt, { allowMature: true });
    const r = rank(pool, i);
    const examples = 'examples' in t ? t.examples : [];
    const gold = examples.filter((e) =>
      pool.some((m) =>
        m.title.toLowerCase().replace(/[’]/g, "'").includes(e.toLowerCase().replace(/[’]/g, "'")),
      ),
    );
    return {
      prompt: t.prompt,
      expectedSignals: [...t.signals],
      exampleTitles: [...examples],
      returned: r.length,
      top5: r.slice(0, 5).map((m) => ({ title: m.title, score: m.score, evidence: m.evidence })),
      constraintViolations: r.filter((m) => !complies(m, i.constraints)).length,
      duplicates: r.length - new Set(r.map((m) => m.key)).size,
      metadataComplete: r.filter(
        (m) => m.title && m.poster && m.year && m.overview && m.genres.length && m.rating !== null,
      ).length,
      languageDiversity: new Set(r.map((m) => m.language)).size,
      genreDiversity: new Set(r.flatMap((m) => m.genres)).size,
      goldExampleHit: gold.length
        ? r
            .slice(0, 5)
            .some((m) =>
              gold.some((g) =>
                m.title
                  .toLowerCase()
                  .replace(/[’]/g, "'")
                  .includes(g.toLowerCase().replace(/[’]/g, "'")),
              ),
            )
        : null,
    };
  });
  expect(rows.every((r) => r.constraintViolations === 0 && r.duplicates === 0)).toBe(true);
  const labelled = rows.filter((r) => r.goldExampleHit !== null);
  mkdirSync('docs', { recursive: true });
  writeFileSync(
    'docs/recommendation-evaluation.json',
    JSON.stringify(
      {
        fixtureSource: fixture.source,
        fixtureCapturedAt: fixture.capturedAt,
        promptCount: rows.length,
        fixtureTitles: pool.length,
        method:
          'Offline regression against 28 real TMDB title fixtures; not an evaluation of entire-catalogue retrieval or human satisfaction. Gold examples are illustrative rather than exhaustive. Mature titles allowed in this evaluation to isolate mood ranking.',
        metrics: {
          constraintViolations: rows.reduce((n, r) => n + r.constraintViolations, 0),
          duplicateResults: rows.reduce((n, r) => n + r.duplicates, 0),
          goldExampleHitAt5:
            labelled.filter((r) => r.goldExampleHit).length + '/' + labelled.length,
        },
        rows,
      },
      null,
      2,
    ),
  );
});
it('comfort metadata outranks generic family references', () => {
  const i = interpret('cozy comforting film', { allowMature: true });
  const r = rank(pool, i);
  const kiki = r.findIndex((m) => m.id === 16859);
  const interstellar = r.findIndex((m) => m.id === 157336);
  expect(kiki).toBeGreaterThanOrEqual(0);
  expect(interstellar === -1 || kiki < interstellar).toBe(true);
});
it('detects contradictory UI and prompt formats', () => {
  expect(interpret('Movies only', { type: 'tv' }).conflicts.length).toBeGreaterThan(0);
});
