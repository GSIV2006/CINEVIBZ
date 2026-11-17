import { describe, expect, it } from 'vitest';
import { interpret } from '@/lib/recommendations/interpret';
import { rank, score } from '@/lib/recommendations/rank';
import { DAILY_THEMES, pickEditorial } from '@/lib/home';
import type { Media } from '@/lib/types';
import fixture from './fixtures/production-audit.json';

const pool = fixture.records as Media[];
const title = (key: string) => pool.find((m) => m.key === key)!;
describe('confirmed production recommendation failures', () => {
  it('rejects Spirited Away as comfort when only its family plot supplies evidence', () => {
    expect(pickEditorial([title('movie:129')], DAILY_THEMES[5], 'audit', [])).toBeUndefined();
  });
  it('recognises actual detective metadata before selecting a midnight pick', () => {
    const result = score(title('movie:426'), interpret(DAILY_THEMES[2].prompt));
    expect(result.evidence.some((e) => e.term === 'detective')).toBe(true);
  });
  it('does not label generic animation as mind-bending on absurdity alone', () => {
    expect(pickEditorial([title('tv:299555')], DAILY_THEMES[6], 'audit', [])).toBeUndefined();
  });
  it.each([
    ['Something peaceful for a rainy evening.', 'comfort'],
    ['Something that feels like the end of summer.', 'summer'],
    ['Something like childhood summer holidays.', 'summer'],
    ['A mind-bending psychological thriller.', 'mindbend'],
  ])('recognises %s as a mood including %s', (prompt, key) => {
    expect(interpret(prompt).signals.map((s) => s.key)).toContain(key);
  });
  it('requires summer evidence for a summer request, not nostalgia alone', () => {
    const i = interpret('Something like childhood summer holidays.', { allowMature: true });
    expect(rank([title('movie:59436')], i)).toEqual([]);
  });
  it('requires reality or narrative evidence for mind-bending, not investigation alone', () => {
    const i = interpret('A mind-bending psychological thriller.', { allowMature: true });
    expect(rank([title('movie:146233')], i)).toEqual([]);
  });
  it('names unsupported visual claims instead of calling the whole request strong', () => {
    const result = score(
      title('tv:67070'),
      interpret('Something beautiful but emotionally devastating.', { allowMature: true }),
    );
    expect(result.match).not.toBe('Strong resonance');
    expect(result.explanation).toContain('Not evidenced: visually expressive');
  });
  it('keeps a stricter runtime from the sentence when a broader UI filter is supplied', () => {
    expect(interpret('movies under 90 minutes', { runtimeMax: 150 }).constraints.runtimeMax).toBe(
      89,
    );
  });
  it('does not pad an explicit cinematography request with mystery-only matches', () => {
    const i = interpret('A mysterious film with beautiful cinematography.', { allowMature: true });
    expect(rank([title('movie:426')], i)).toEqual([]);
  });
  it('also requires mystery evidence when visual evidence is present', () => {
    const i = interpret('A mysterious film with beautiful cinematography.', { allowMature: true });
    expect(rank([title('movie:22504')], i)).toEqual([]);
  });
});
