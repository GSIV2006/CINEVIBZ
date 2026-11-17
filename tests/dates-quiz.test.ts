import { it, expect } from 'vitest';
import { dateKey, weekKey, seeded, previousDay } from '@/lib/dates';
import { dailyQuestions, streak, QUESTIONS, QUIZ_CATEGORIES } from '@/data/quiz';
it('uses the Kolkata midnight boundary', () => {
  expect(dateKey(new Date('2026-11-16T18:29:59Z'))).toBe('2026-11-16');
  expect(dateKey(new Date('2026-11-16T18:30:00Z'))).toBe('2026-11-17');
});
it('keeps the weekly key stable Monday through Sunday in India', () => {
  expect(weekKey(new Date('2026-11-15T18:30:00Z'))).toBe('2026-11-16');
  expect(weekKey(new Date('2026-11-22T18:29:59Z'))).toBe('2026-11-16');
  expect(weekKey(new Date('2026-11-22T18:30:00Z'))).toBe('2026-11-23');
});
it('selects stably regardless of provider ordering', () => {
  const values = ['a', 'b', 'c', 'd'];
  expect(seeded(values, '2026-11-17', (x) => x)).toEqual(
    seeded([...values].reverse(), '2026-11-17', (x) => x),
  );
});
it('selects exactly five distinct sourced questions per category', () => {
  for (const c of QUIZ_CATEGORIES) {
    const q = dailyQuestions('2026-11-17', c);
    expect(q).toHaveLength(5);
    expect(new Set(q.map((x) => x.id)).size).toBe(5);
    expect(q).toEqual(dailyQuestions('2026-11-17', c));
    expect(q.every((x) => /^https:\/\/www\.(oscars\.org|themoviedb\.org)\//.test(x.source))).toBe(
      true,
    );
  }
});
it('all questions have valid answer choices', () => {
  expect(
    QUESTIONS.every(
      (q) => q.options.length === 4 && q.answer >= 0 && q.answer < 4 && q.explanation.length > 15,
    ),
  ).toBe(true);
});
it('counts days once across categories and handles a missed day', () => {
  expect(streak(['2026-11-15', '2026-11-16', '2026-11-16', '2026-11-17'], '2026-11-17')).toBe(3);
  expect(streak(['2026-11-15'], '2026-11-17')).toBe(0);
  expect(streak(['2026-11-16'], '2026-11-17')).toBe(1);
  expect(previousDay('2026-01-01')).toBe('2025-12-31');
});
