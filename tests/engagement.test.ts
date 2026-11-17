import { describe, it, expect } from 'vitest';
import { restore, applyQuizAnswer, cacheEdition } from '@/components/store';
import {
  addHistory,
  completedDay,
  longestStreak,
  challengeForDay,
  CHALLENGES,
} from '@/lib/engagement';
import { dailyQuestions, QUIZ_CATEGORIES, QUESTIONS } from '@/data/quiz';
import { interpret } from '@/lib/recommendations/interpret';
import { DAILY_THEMES, WEEKLY_THEMES, pickEditorial } from '@/lib/home';
import type { Media, HomeData } from '@/lib/types';
const film = (id: number, overrides: Partial<Media> = {}): Media => ({
  id,
  key: `movie:${id}`,
  type: 'movie',
  title: `Record ${id}`,
  originalTitle: `Record ${id}`,
  overview: 'A hopeful story of identity and friendship.',
  poster: null,
  backdrop: null,
  date: '2001-01-01',
  year: 2001,
  genres: [18],
  genreNames: ['Drama'],
  language: 'en',
  countries: ['US'],
  rating: 7,
  votes: 100,
  popularity: 4,
  adult: false,
  runtime: 100,
  keywords: ['hope', 'friendship'],
  enriched: true,
  ...overrides,
});
const edition = (day = '2026-11-17', week = '2026-11-16'): HomeData => ({
  dayKey: day,
  weekKey: week,
  daily: [film(1), film(2)],
  weekly: [film(3)],
  weeklyTheme: 'Original theme',
  weeklyDescription: 'Original description',
  popular: [],
  trending: [],
  outside: [],
  partial: false,
});
describe('daily attempts', () => {
  it('preserves an in-progress attempt through storage restoration', () => {
    const day = '2026-11-17',
      ids = dailyQuestions(day, 'Anime').map((q) => q.id);
    const next = applyQuizAnswer(restore(null), day + ':Anime', [2], day, ids);
    const reloaded = restore(JSON.stringify(next));
    expect(reloaded.quiz[day + ':Anime'].answers).toEqual([2]);
    expect(reloaded.quiz[day + ':Anime'].questionIds).toEqual(ids);
    expect(reloaded.completedDays).toEqual([]);
  });
  it('rejects repeated answers and changing an earlier choice', () => {
    const day = '2026-11-17',
      key = day + ':Movies',
      ids = dailyQuestions(day, 'Movies').map((q) => q.id);
    const s = applyQuizAnswer(restore(null), key, [1], day, ids);
    expect(applyQuizAnswer(s, key, [1], day, ids)).toBe(s);
    expect(applyQuizAnswer(s, key, [3, 1], day, ids)).toBe(s);
  });
  it('saves correct scores and counts two completed categories as one streak day', () => {
    const day = '2026-11-17';
    let s = restore(null);
    for (const category of ['Movies', 'Anime']) {
      const questions = dailyQuestions(day, category),
        ids = questions.map((q) => q.id);
      for (let i = 1; i <= 5; i++)
        s = applyQuizAnswer(
          s,
          day + ':' + category,
          questions.slice(0, i).map((q) => q.answer),
          day,
          ids,
        );
      expect(s.quiz[day + ':' + category].score).toBe(5);
      expect(applyQuizAnswer(s, day + ':' + category, [0], day, ids)).toBe(s);
    }
    expect(s.completedDays).toEqual([day]);
    expect(s.activities[day]).toEqual(['quiz']);
    expect(s.events.filter((e) => e.kind === 'quiz')).toHaveLength(2);
  });
  it('restores legacy Cinema attempts without changing their original questions', () => {
    const s = restore(
      JSON.stringify({
        quiz: { '2026-11-17:Cinema': { answers: [1, 0, 3, 2, 0], complete: true } },
      }),
    );
    expect(s.quiz['2026-11-17:Cinema'].questionIds).toEqual(
      dailyQuestions('2026-11-17', 'Cinema').map((q) => q.id),
    );
  });
  it('all nine categories have distinct, valid, linked questions', () => {
    expect(QUIZ_CATEGORIES).toHaveLength(9);
    expect(new Set(QUESTIONS.map((q) => q.id)).size).toBe(QUESTIONS.length);
    for (const c of QUIZ_CATEGORIES) {
      const qs = QUESTIONS.filter((q) => q.category === c);
      expect(qs.length).toBeGreaterThanOrEqual(6);
      for (const q of qs) {
        expect(new Set(q.options).size).toBe(4);
        expect(q.explanation).toBeTruthy();
        expect(q.source).toMatch(
          /^https:\/\/www\.(themoviedb\.org\/(movie|tv)\/\d+|oscars\.org\/oscars\/ceremonies\/\d+)/,
        );
      }
    }
  });
  it('changes each category set over successive days without changing same-day attempts', () => {
    for (const c of QUIZ_CATEGORIES) {
      const sets = Array.from({ length: 14 }, (_, i) =>
        dailyQuestions(`2026-11-${String(i + 1).padStart(2, '0')}`, c)
          .map((q) => q.id)
          .join(),
      );
      expect(new Set(sets).size).toBeGreaterThan(1);
    }
  });
});
describe('saved daily and weekly editions', () => {
  it('freezes the entire daily edition despite later catalogue updates', () => {
    const s = cacheEdition(restore(null), edition(), 'false');
    const changed = { ...edition(), daily: [film(99)], weeklyTheme: 'Changed' };
    expect(cacheEdition(s, changed, 'false')).toBe(s);
    expect(
      restore(JSON.stringify(s)).homeSnapshots['2026-11-17:false'].daily.map((m) => m.id),
    ).toEqual([1, 2]);
  });
  it('preserves weekly picks on the next day and removes overlap', () => {
    const s = cacheEdition(restore(null), edition(), 'false');
    const tomorrow = {
      ...edition('2026-11-18'),
      weekly: [film(100)],
      weeklyTheme: 'Changed',
      daily: [film(3), film(4)],
    };
    const next = cacheEdition(s, tomorrow, 'false').homeSnapshots['2026-11-18:false'];
    expect(next.weekly.map((m) => m.id)).toEqual([3]);
    expect(next.weeklyTheme).toBe('Original theme');
    expect(next.daily.map((m) => m.id)).toEqual([4]);
  });
  it('rotates the weekly snapshot on Monday and isolates content modes', () => {
    const s = cacheEdition(restore(null), edition(), 'false');
    const next = cacheEdition(
      s,
      { ...edition('2026-11-23', '2026-11-23'), weekly: [film(10)] },
      'false',
    );
    expect(next.homeSnapshots['2026-11-23:false'].weekly[0].id).toBe(10);
    const mature = cacheEdition(next, { ...edition(), weekly: [film(20)] }, 'true');
    expect(mature.homeSnapshots['2026-11-17:true'].weekly[0].id).toBe(20);
  });
  it('allows a partial edition to recover missing collections without replacing existing daily picks', () => {
    const s = cacheEdition(restore(null), { ...edition(), weekly: [], partial: true }, 'false');
    const next = cacheEdition(s, { ...edition(), daily: [film(99)] }, 'false');
    expect(next.homeSnapshots['2026-11-17:false'].daily.map((m) => m.id).slice(0, 2)).toEqual([
      1, 2,
    ]);
    expect(next.homeSnapshots['2026-11-17:false'].weekly[0].id).toBe(3);
    expect(next.homeSnapshots['2026-11-17:false'].partial).toBe(false);
  });
  it('does not freeze a completely empty provider response', () => {
    const s = restore(null);
    expect(cacheEdition(s, { ...edition(), daily: [], weekly: [] }, 'false')).toBe(s);
  });
  it('avoids duplicate titles and sequels in editorial selection', () => {
    const a = film(1, { collectionId: 20 }),
      b = film(2, { collectionId: 20 }),
      c = film(3);
    expect(pickEditorial([a, b, c], DAILY_THEMES[0], 'day', [a])?.id).toBe(3);
  });
  it('keeps theme definitions tied to retrieval criteria and interpreted signals', () => {
    for (const t of [...DAILY_THEMES, ...WEEKLY_THEMES]) {
      expect(t.genres.length || t.lowVotes || t.older || t.international).toBeTruthy();
      expect(interpret(t.prompt).signals.length).toBeGreaterThan(0);
    }
  });
});
describe('streaks, feelings and local history', () => {
  it('deduplicates completed days and keeps the longest historical streak', () => {
    const days = ['2026-11-10', '2026-11-11', '2026-11-12', '2026-11-16'];
    expect(completedDay(days, '2026-11-16')).toEqual(days);
    expect(longestStreak([...days, '2026-11-11'])).toBe(3);
  });
  it('keeps the challenge stable and connects every prompt to the recommendation taxonomy', () => {
    expect(challengeForDay('2026-11-17')).toEqual(challengeForDay('2026-11-17'));
    for (const [, prompt] of CHALLENGES)
      expect(interpret(prompt).signals.length).toBeGreaterThan(0);
  });
  it('deduplicates revisits within an India day, but keeps the next-day visit', () => {
    let h = addHistory([], 'title', 'A title', '/title/movie/1', '2026-11-17T10:00:00Z');
    h = addHistory(h, 'title', 'A title', '/title/movie/1', '2026-11-17T12:00:00Z');
    expect(h).toHaveLength(1);
    h = addHistory(h, 'title', 'A title', '/title/movie/1', '2026-11-17T18:30:00Z');
    expect(h).toHaveLength(2);
  });
  it('recovers gracefully from malformed local JSON', () =>
    expect(restore('{broken')).toEqual(restore(null)));
});
