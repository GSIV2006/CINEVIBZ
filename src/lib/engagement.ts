import { dateKey, hash, previousDay } from './dates';
export type ActivityKind = 'quiz' | 'rabbit-hole' | 'challenge';
export type HistoryKind = 'mood' | 'title' | 'saved' | 'roulette' | 'quiz' | 'challenge';
export type HistoryEntry = {
  id: string;
  kind: HistoryKind;
  label: string;
  href: string;
  at: string;
};
export function longestStreak(days: string[]) {
  let best = 0,
    run = 0,
    last = '';
  for (const day of [...new Set(days)].sort()) {
    run = previousDay(day) === last ? run + 1 : 1;
    best = Math.max(best, run);
    last = day;
  }
  return best;
}
export function completedDay(days: string[], day: string) {
  return [...new Set([...days, day])].sort().slice(-730);
}
export function addHistory(
  items: HistoryEntry[],
  kind: HistoryKind,
  label: string,
  href: string,
  at = new Date().toISOString(),
) {
  const id = kind + ':' + href + ':' + dateKey(new Date(at));
  return [{ id, kind, label, href, at }, ...items.filter((e) => e.id !== id)].slice(0, 150);
}
export const CHALLENGES = [
  [
    'An unfinished goodbye.',
    'Find a melancholic, bittersweet story that feels like an unfinished goodbye.',
  ],
  ['A dream, almost remembered.', 'Surreal, dreamlike stories about memory and identity.'],
  [
    'Seventeen, forever.',
    'Nostalgic coming-of-age stories about growing up and childhood friends.',
  ],
  [
    'The end, but make it beautiful.',
    'Emotionally devastating, existential science fiction about the end of the world.',
  ],
  ['Take the wrong turn.', 'An unexpected adventure, whimsical escapism and wonder.'],
  ['A city that understands you.', 'Wandering through Tokyo at 2 AM, lonely and introspective.'],
  [
    'A home you have never visited.',
    'Cozy, comforting stories about friendship and a sense of belonging.',
  ],
  ['One brave little beginning.', 'Hopeful stories about starting over and finding a new purpose.'],
  ['Reality has left the chat.', 'Surreal mysterious movies that make me question reality.'],
  ['The light after the rain.', 'Gentle, hopeful movies about friendship and healing.'],
  ['A song from another life.', 'Nostalgic, romantic stories about memory and music.'],
  ['Your midnight double life.', 'Dark, mysterious, neon-lit thrillers about identity.'],
  ['Small town, enormous feelings.', 'Comforting, wholesome stories set in a small town.'],
  ['Go beautifully off-script.', 'A chaotic, adrenaline-filled wild ride.'],
] as const;
export function challengeForDay(day: string) {
  const [title, prompt] = CHALLENGES[hash(day + 'feeling') % CHALLENGES.length];
  return { id: day, title, prompt };
}
