import { it, expect } from 'vitest';
import { interpret } from '@/lib/recommendations/interpret';
import { isPersonMatch } from '@/lib/catalogue';
import { freshQuestions, QUIZ_CATEGORIES, quizCategory } from '@/data/quiz';
import { restore, applyQuizAnswer } from '@/components/store';
it('treats crazy movies as a mood, never a same-named person', () => {
  expect(interpret('crazy movies').signals.some((s) => s.key === 'chaos')).toBe(true);
  expect(
    isPersonMatch(
      { id: 1, name: 'Crazy', department: 'Acting', image: null, aliases: [], knownFor: [] },
      'crazy movies',
    ),
  ).toBe(false);
});
it('recognizes everyday wild mood synonyms', () => {
  for (const p of ['insane movies', 'bonkers films', 'unhinged movies'])
    expect(interpret(p).signals.some((s) => s.key === 'chaos')).toBe(true);
});
it('uses unseen questions first in replay rounds for every category', () => {
  for (const category of QUIZ_CATEGORIES) {
    const one = freshQuestions(category, 'round1', []);
    const two = freshQuestions(
      category,
      'round2',
      one.map((q) => q.id),
    );
    expect(one).toHaveLength(5);
    expect(two).toHaveLength(5);
    expect(two.every((q) => !one.some((p) => p.id === q.id))).toBe(true);
  }
});
it('keeps round scores separate while awarding one streak day', () => {
  const day = '2026-11-17';
  let s = restore(null);
  for (const key of [day + ':Anime', day + ':Anime:round:2']) {
    const qs = freshQuestions('Anime', key, []);
    for (let n = 1; n <= 5; n++)
      s = applyQuizAnswer(
        s,
        key,
        qs.slice(0, n).map((q) => q.answer),
        day,
        qs.map((q) => q.id),
      );
    expect(s.quiz[key].score).toBe(5);
  }
  expect(s.completedDays).toEqual([day]);
  expect(quizCategory(day + ':Anime:round:2')).toBe('Anime');
});
