'use client';
import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { Media, Preferences, Feedback, HomeData } from '@/lib/types';
import { dateKey, seeded } from '@/lib/dates';
import { LEGACY_QUESTIONS, QUESTIONS } from '@/data/quiz';
import {
  addHistory,
  completedDay,
  challengeForDay,
  type ActivityKind,
  type HistoryKind,
  type HistoryEntry,
} from '@/lib/engagement';
export type QuizRun = {
  answers: number[];
  complete: boolean;
  questionIds?: string[];
  score?: number;
};
type ChallengeRun = { explored: boolean; complete: boolean; favourite?: string };
type WeeklySnapshot = { items: Media[]; theme: string; description: string };
export type State = {
  watchlist: Media[];
  preferences: Preferences;
  history: { prompt: string; date: string }[];
  quiz: Record<string, QuizRun>;
  completedDays: string[];
  events: HistoryEntry[];
  activities: Record<string, ActivityKind[]>;
  challenges: Record<string, ChallengeRun>;
  homeSnapshots: Record<string, HomeData>;
  weeklySnapshots: Record<string, WeeklySnapshot>;
};
const empty: State = {
  watchlist: [],
  preferences: { feedback: [], moods: [], allowMature: false, excludeWatched: true },
  history: [],
  quiz: {},
  completedDays: [],
  events: [],
  activities: {},
  challenges: {},
  homeSnapshots: {},
  weeklySnapshots: {},
};
const key = 'cinevibz:v1';
const trim = <T,>(object: Record<string, T>, count: number) =>
  Object.fromEntries(
    Object.entries(object)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-count),
  );
type Store = {
  state: State;
  ready: boolean;
  storageError: boolean;
  save: (m: Media) => void;
  feedback: (m: Media, k: Feedback['kind']) => void;
  discover: (p: string) => void;
  setPreferences: (p: Partial<Preferences>) => void;
  beginQuiz: (key: string, questionIds: string[]) => void;
  answer: (key: string, answers: number[], day: string, questionIds?: string[]) => void;
  record: (kind: HistoryKind, label: string, href: string) => void;
  markDay: (kind: ActivityKind, day?: string) => void;
  challenge: (day: string, change: Partial<ChallengeRun>) => void;
  cacheHome: (data: HomeData, mode: string) => void;
  clearHistory: () => void;
  reset: () => void;
  clear: () => void;
};
const Context = createContext<Store | null>(null);
export function restore(raw: string | null): State {
  if (!raw) return empty;
  try {
    const s = JSON.parse(raw);
    const quiz: Record<string, QuizRun> = {};
    for (const [key, value] of Object.entries(s.quiz || {})) {
      const run = value as QuizRun;
      if (!Array.isArray(run.answers)) continue;
      const category = key.slice(11),
        day = key.slice(0, 10);
      const ids =
        run.questionIds ||
        seeded(
          LEGACY_QUESTIONS.filter((q) => q.category === category),
          day + category,
          (q) => q.id,
        )
          .slice(0, 5)
          .map((q) => q.id);
      const answers = run.answers.filter((a) => Number.isInteger(a) && a >= 0 && a < 4).slice(0, 5);
      quiz[key] = {
        ...run,
        answers,
        questionIds: ids,
        complete: answers.length === 5,
        score: answers.filter((a, i) => a === QUESTIONS.find((q) => q.id === ids[i])?.answer)
          .length,
      };
    }
    return {
      ...empty,
      ...s,
      watchlist: Array.isArray(s.watchlist)
        ? s.watchlist
            .filter(
              (m: Media) =>
                m &&
                typeof m.key === 'string' &&
                typeof m.title === 'string' &&
                Array.isArray(m.genres),
            )
            .slice(0, 500)
        : [],
      preferences: {
        ...empty.preferences,
        ...s.preferences,
        feedback: Array.isArray(s.preferences?.feedback) ? s.preferences.feedback : [],
        moods: Array.isArray(s.preferences?.moods) ? s.preferences.moods : [],
      },
      history: Array.isArray(s.history) ? s.history.slice(0, 30) : [],
      quiz,
      completedDays: Array.isArray(s.completedDays) ? s.completedDays : [],
      events: Array.isArray(s.events) ? s.events.slice(0, 150) : [],
      activities: s.activities || {},
      challenges: s.challenges || {},
      homeSnapshots: s.homeSnapshots || {},
      weeklySnapshots: s.weeklySnapshots || {},
    };
  } catch {
    return empty;
  }
}
export function applyQuizAnswer(
  s: State,
  runKey: string,
  answers: number[],
  day: string,
  questionIds?: string[],
): State {
  const prior = s.quiz[runKey];
  if (
    prior?.complete ||
    answers.length !== (prior?.answers.length || 0) + 1 ||
    answers.length > 5 ||
    answers.some((a) => !Number.isInteger(a) || a < 0 || a > 3)
  )
    return s;
  if (prior?.answers.some((a, i) => answers[i] !== a)) return s;
  const ids = prior?.questionIds || questionIds || [];
  if (ids.length !== 5) return s;
  const complete = answers.length === 5;
  const score = answers.filter(
    (a, i) => QUESTIONS.find((q) => q.id === ids[i])?.answer === a,
  ).length;
  return {
    ...s,
    quiz: trim({ ...s.quiz, [runKey]: { answers, questionIds: ids, complete, score } }, 1000),
    completedDays: complete ? completedDay(s.completedDays, day) : s.completedDays,
    activities: complete
      ? trim(
          { ...s.activities, [day]: [...new Set([...(s.activities[day] || []), 'quiz' as const])] },
          730,
        )
      : s.activities,
    events: complete
      ? addHistory(
          s.events,
          'quiz',
          `${runKey.slice(11)} · ${score}/5`,
          '/?quiz=' + encodeURIComponent(runKey) + '#screen-test',
        )
      : s.events,
  };
}
function compactMedia(m: Media): Media {
  return {
    ...m,
    cast: undefined,
    crew: undefined,
    related: undefined,
    similar: undefined,
    keywords: m.keywords.slice(0, 20),
  };
}
export function cacheEdition(s: State, data: HomeData, mode: string): State {
  data = {
    ...data,
    daily: data.daily.map(compactMedia),
    weekly: data.weekly.map(compactMedia),
    popular: data.popular.map(compactMedia),
    trending: data.trending.map(compactMedia),
    outside: data.outside.map(compactMedia),
  };
  const dkey = data.dayKey + ':' + mode,
    wkey = data.weekKey + ':' + mode;
  if (s.homeSnapshots[dkey] && !s.homeSnapshots[dkey].partial) return s;
  if (!data.daily.length && !data.weekly.length) return s;
  const weekly = (s.weeklySnapshots[wkey]?.items.length ? s.weeklySnapshots[wkey] : undefined) || {
    items: data.weekly,
    theme: data.weeklyTheme,
    description: data.weeklyDescription,
  };
  const priorDaily = s.homeSnapshots[dkey]?.daily || [];
  const daily = priorDaily.length
    ? [...priorDaily, ...data.daily.filter((m) => !priorDaily.some((p) => p.key === m.key))].slice(
        0,
        Math.max(5, priorDaily.length),
      )
    : data.daily;
  const snapshot = {
    ...data,
    weekly: weekly.items,
    weeklyTheme: weekly.theme,
    weeklyDescription: weekly.description,
    daily: daily.filter((m) => !weekly.items.some((w) => w.key === m.key)),
  };
  return {
    ...s,
    homeSnapshots: trim({ ...s.homeSnapshots, [dkey]: snapshot }, 28),
    weeklySnapshots: trim({ ...s.weeklySnapshots, [wkey]: weekly }, 12),
  };
}
export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<State>(empty),
    [ready, setReady] = useState(false),
    [storageError, setStorageError] = useState(false);
  useEffect(() => {
    try {
      setState(restore(localStorage.getItem(key)));
    } catch {
      setStorageError(true);
    }
    setReady(true);
    const listener = (e: StorageEvent) => {
      if (e.key === key) setState(restore(e.newValue));
    };
    window.addEventListener('storage', listener);
    return () => window.removeEventListener('storage', listener);
  }, []);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem(key, JSON.stringify(state));
      } catch {
        setStorageError(true);
      }
  }, [state, ready]);
  const record = useCallback(
    (kind: HistoryKind, label: string, href: string) =>
      setState((s) => ({ ...s, events: addHistory(s.events, kind, label, href) })),
    [],
  );
  const save = useCallback(
    (m: Media) =>
      setState((s) => {
        const exists = s.watchlist.some((w) => w.key === m.key);
        return {
          ...s,
          watchlist: exists
            ? s.watchlist.filter((w) => w.key !== m.key)
            : [{ ...m, related: undefined, similar: undefined }, ...s.watchlist].slice(0, 500),
          events: exists
            ? s.events
            : addHistory(s.events, 'saved', m.title, `/title/${m.type}/${m.id}`),
        };
      }),
    [],
  );
  const feedback = useCallback(
    (m: Media, kind: Feedback['kind']) =>
      setState((s) => ({
        ...s,
        preferences: {
          ...s.preferences,
          feedback: [
            ...s.preferences.feedback.filter(
              (f) =>
                f.key !== m.key ||
                (kind === 'watched' ? f.kind !== 'watched' : f.kind === 'watched'),
            ),
            { key: m.key, kind, genres: m.genres, language: m.language, keywords: m.keywords },
          ].slice(-100),
        },
      })),
    [],
  );
  const discover = useCallback(
    (prompt: string) =>
      setState((s) => ({
        ...s,
        history: [
          { prompt, date: new Date().toISOString() },
          ...s.history.filter((h) => h.prompt !== prompt),
        ].slice(0, 30),
        events: addHistory(
          s.events,
          'mood',
          prompt,
          '/discover?mood=' + encodeURIComponent(prompt),
        ),
      })),
    [],
  );
  const setPreferences = useCallback(
    (p: Partial<Preferences>) =>
      setState((s) => ({ ...s, preferences: { ...s.preferences, ...p } })),
    [],
  );
  const markDay = useCallback(
    (kind: ActivityKind, day = dateKey()) =>
      setState((s) => ({
        ...s,
        completedDays: completedDay(s.completedDays, day),
        activities: trim(
          { ...s.activities, [day]: [...new Set([...(s.activities[day] || []), kind])] },
          730,
        ),
      })),
    [],
  );
  const beginQuiz = useCallback(
    (runKey: string, questionIds: string[]) =>
      setState((s) =>
        s.quiz[runKey]
          ? s
          : {
              ...s,
              quiz: trim(
                { ...s.quiz, [runKey]: { answers: [], complete: false, questionIds, score: 0 } },
                1000,
              ),
            },
      ),
    [],
  );
  const answer = useCallback(
    (runKey: string, answers: number[], day: string, questionIds?: string[]) =>
      setState((s) => applyQuizAnswer(s, runKey, answers, day, questionIds)),
    [],
  );
  const challenge = useCallback(
    (day: string, change: Partial<ChallengeRun>) =>
      setState((s) => {
        const run = { ...(s.challenges[day] || { explored: false, complete: false }), ...change };
        return {
          ...s,
          challenges: trim({ ...s.challenges, [day]: run }, 365),
          completedDays: run.complete ? completedDay(s.completedDays, day) : s.completedDays,
          activities: run.complete
            ? trim(
                {
                  ...s.activities,
                  [day]: [...new Set([...(s.activities[day] || []), 'challenge' as const])],
                },
                730,
              )
            : s.activities,
          events: run.complete
            ? addHistory(
                s.events,
                'challenge',
                `Today's Feeling · ${day}`,
                '/discover?mood=' + encodeURIComponent(challengeForDay(day).prompt),
              )
            : s.events,
        };
      }),
    [],
  );
  const cacheHome = useCallback(
    (data: HomeData, mode: string) => setState((s) => cacheEdition(s, data, mode)),
    [],
  );
  return (
    <Context.Provider
      value={{
        state,
        ready,
        storageError,
        save,
        feedback,
        discover,
        setPreferences,
        answer,
        beginQuiz,
        record,
        markDay,
        challenge,
        cacheHome,
        clearHistory: () => setState((s) => ({ ...s, history: [], events: [] })),
        reset: () =>
          setState((s) => ({ ...s, preferences: empty.preferences, history: [], events: [] })),
        clear: () => setState(empty),
      }}
    >
      {children}
      {storageError && (
        <div role="status" className="storage-warning">
          This browser cannot save locally. Progress and daily editions will last for this visit
          only.
        </div>
      )}
    </Context.Provider>
  );
}
export function useStore() {
  const c = useContext(Context);
  if (!c) throw Error('StoreProvider missing');
  return c;
}
