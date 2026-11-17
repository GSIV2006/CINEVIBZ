import { describe, it, expect } from 'vitest';
import { interpret } from '@/lib/recommendations/interpret';
import { rank, score, complies, evidenceFor, safeForGeneral } from '@/lib/recommendations/rank';
import { normalize } from '@/lib/providers/tmdb';
import { textContains } from '@/lib/recommendations/taxonomy';
import { CASES } from './prompts';
import fixture from './fixtures/tmdb.json';
import type { Media, Constraints, Preferences } from '@/lib/types';
const pool = fixture.records.map((r) =>
  normalize(r, 'media_type' in r && r.media_type === 'tv' ? 'tv' : 'movie'),
);
const base: Constraints = {
  genres: [],
  excludedGenres: [],
  excludedLanguages: [],
  allowMature: true,
};
describe('38 curated mood and constraint requests', () => {
  for (const test of CASES)
    it(test.prompt, () => {
      const t = test as typeof test & Record<string, any>;
      const i = interpret(t.prompt);
      for (const key of t.signals) expect(i.signals.map((s) => s.key)).toContain(key);
      if (t.type) expect(i.constraints.type).toBe(t.type);
      if (t.anime) expect(i.constraints.anime).toBe(true);
      if (t.language) expect(i.constraints.language).toBe(t.language);
      for (const key of ['yearFrom', 'yearTo', 'runtimeMax'])
        if (t[key]) expect(i.constraints[key as keyof Constraints]).toBe(t[key]);
      if (t.genre) expect(i.constraints.genres).toContain(t.genre);
      if (t.excludedGenre) expect(i.constraints.excludedGenres).toContain(t.excludedGenre);
      if (t.excludedLanguage) expect(i.constraints.excludedLanguages).toContain(t.excludedLanguage);
      if (t.excludedSignal) {
        expect(i.excludedSignals.map((s) => s.key)).toContain(t.excludedSignal);
        expect(i.signals.map((s) => s.key)).not.toContain(t.excludedSignal);
      }
      if (t.conflict) expect(i.conflicts.length).toBeGreaterThan(0);
      if (t.ambiguous) expect(i.notes.length).toBeGreaterThan(0);
      if (t.noFantasy) expect(i.constraints.genres).not.toContain(14);
      if (t.anyFormat) expect(i.constraints.type).toBeUndefined();
    });
});
describe('ranking integrity using actual provider fixtures', () => {
  it('ranks Tokyo evidence ahead of unrelated popularity', () => {
    const i = interpret('Wandering through Tokyo at 2 AM', { allowMature: true });
    const lost = pool.find((m) => m.title === 'Lost in Translation')!;
    const wall = pool.find((m) => m.title === 'WALL·E' || m.title === 'WALL-E')!;
    expect(lost).toBeDefined();
    expect(wall).toBeDefined();
    expect(score(lost, i).score).toBeGreaterThan(score({ ...wall, popularity: 999999 }, i).score);
    expect(
      rank(pool, i)
        .slice(0, 5)
        .some((m) => m.id === lost.id),
    ).toBe(true);
  });
  it('keeps anime strictly Japanese animation', () => {
    const i = interpret('Surreal anime only', { allowMature: true });
    const r = rank(pool, i);
    expect(r.length).toBeGreaterThan(0);
    expect(r.every((m) => m.language === 'ja' && m.genres.includes(16))).toBe(true);
  });
  it('obeys all hard constraints together', () => {
    const i = interpret('Japanese animated movies before 2005 under 130 minutes', {
      allowMature: true,
    });
    const r = rank(pool, i);
    expect(r.length).toBeGreaterThan(0);
    expect(
      r.every(
        (m) =>
          m.type === 'movie' &&
          m.language === 'ja' &&
          m.genres.includes(16) &&
          m.year! < 2005 &&
          m.runtime! < 130,
      ),
    ).toBe(true);
  });
  it('rejects missing evidence for a runtime limit', () =>
    expect(complies({ ...pool[0], runtime: null }, { ...base, runtimeMax: 120 })).toBe(false));
  it('never returns adult entries', () =>
    expect(
      rank(
        pool.map((m) => ({ ...m, adult: true })),
        interpret('comfort', { allowMature: true }),
      ),
    ).toEqual([]));
  it('rejects mature and unknown certificates by default', () => {
    expect(safeForGeneral({ ...pool[0], certification: undefined })).toBe(false);
    expect(safeForGeneral({ ...pool[0], certification: { country: 'US', rating: 'R' } })).toBe(
      false,
    );
  });
  it('never invents evidence or probability percentages', () => {
    for (const m of rank(
      pool,
      interpret('Surreal lonely nostalgic movies', { allowMature: true }),
    )) {
      for (const e of m.evidence)
        expect(
          e.source === 'keyword'
            ? m.keywords.some((k) => textContains(k, e.term))
            : textContains(m.overview, e.term),
        ).toBe(true);
      expect(m.explanation).not.toMatch(/\d+%/);
    }
  });
  it('deduplicates provider IDs while distinguishing film and series', () => {
    const i = interpret('movies', { allowMature: true });
    const r = rank([...pool, ...pool], i);
    expect(new Set(r.map((m) => m.key)).size).toBe(r.length);
  });
  it('handles ambiguous text honestly', () => {
    const i = interpret('surprise me', { allowMature: true });
    const result = rank(pool, i);
    expect(
      result.every((m) => m.match === 'A loose connection' && m.explanation.includes('not enough')),
    ).toBe(true);
  });
  it('does not turn hopeless into hope or nightlife into night evidence', () => {
    expect(textContains('a hopeless situation', 'hope')).toBe(false);
    expect(textContains('a city at night', 'night')).toBe(true);
  });
  it('respects watched and negative feedback', () => {
    const m = pool[0];
    const p: Preferences = {
      moods: [],
      allowMature: true,
      excludeWatched: true,
      feedback: [
        { key: m.key, kind: 'watched', genres: m.genres, language: m.language, keywords: [] },
      ],
    };
    expect(
      rank(pool, interpret('movies', { allowMature: true, excludeWatched: true }), p).some(
        (x) => x.key === m.key,
      ),
    ).toBe(false);
  });
  it('bounds one feedback interaction to a small nudge', () => {
    const m = pool[0],
      i = interpret('lonely', { allowMature: true });
    const p: Preferences = {
      moods: [],
      allowMature: true,
      excludeWatched: true,
      feedback: [
        { key: m.key, kind: 'like', genres: m.genres, language: m.language, keywords: [] },
      ],
    };
    expect(Math.abs(score(m, i, p).score - score(m, i).score)).toBeLessThanOrEqual(2);
  });
  it('keeps record artwork, year and rating tied to the same ID', () => {
    const raw = fixture.records[0];
    const m = normalize(raw, 'movie');
    expect(m.id).toBe(raw.id);
    expect(m.poster).toBe(raw.poster_path);
    expect(m.rating).toBe(raw.vote_average);
    expect(m.title).toBe(raw.title);
  });
  it('preserves diversity when relevance is tied', () => {
    const i = interpret('movies', { allowMature: true });
    const r = rank(pool, i, undefined, 10);
    expect(new Set(r.map((m) => m.language)).size).toBeGreaterThanOrEqual(3);
  });
});
