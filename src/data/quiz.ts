import { seeded, previousDay } from '@/lib/dates';
import bank from './quiz-bank.json';
export const QUIZ_CATEGORIES = [
  'Movies',
  'Anime',
  'International Cinema',
  'TV & Series',
  'Animation',
  'General Cinema',
  'Directors & Filmmakers',
  'Soundtracks & Music',
  'Film History',
];
export type Question = {
  id: string;
  category: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  source: string;
};
const academy = (year: number) => `https://www.oscars.org/oscars/ceremonies/${year}`;
export const LEGACY_QUESTIONS: Question[] = [
  {
    id: 'c1',
    category: 'Cinema',
    question: 'Which film won Best Picture at the 2020 Oscars?',
    options: ['1917', 'Parasite', 'Joker', 'Little Women'],
    answer: 1,
    explanation: 'Parasite received the Best Picture award at the 92nd Academy Awards.',
    source: academy(2020),
  },
  {
    id: 'c2',
    category: 'Cinema',
    question: 'Who won the 2020 directing Oscar for Parasite?',
    options: ['Park Chan-wook', 'Lee Chang-dong', 'Bong Joon Ho', 'Hirokazu Kore-eda'],
    answer: 2,
    explanation: 'The Academy awarded Bong Joon Ho for directing Parasite.',
    source: academy(2020),
  },
  {
    id: 'c3',
    category: 'Cinema',
    question: 'Which film earned Sofia Coppola the 2004 original screenplay Oscar?',
    options: ['The Virgin Suicides', 'Lost in Translation', 'Somewhere', 'Marie Antoinette'],
    answer: 1,
    explanation: 'Sofia Coppola won the original screenplay award for Lost in Translation.',
    source: academy(2004),
  },
  {
    id: 'c4',
    category: 'Cinema',
    question: 'Which Middle-earth film won Best Picture at the 2004 Oscars?',
    options: [
      'The Fellowship of the Ring',
      'The Two Towers',
      'The Return of the King',
      'An Unexpected Journey',
    ],
    answer: 2,
    explanation: 'The Return of the King received Best Picture at the 76th Academy Awards.',
    source: academy(2004),
  },
  {
    id: 'c5',
    category: 'Cinema',
    question: 'Which film won the original screenplay Oscar at the 2003 ceremony?',
    options: ['Adaptation', 'Talk to Her', 'The Pianist', 'Chicago'],
    answer: 1,
    explanation: 'Pedro Almodóvar received the original screenplay award for Talk to Her.',
    source: academy(2003),
  },
  {
    id: 'c6',
    category: 'Cinema',
    question: 'Which film won Best Picture at the 2016 Oscars?',
    options: ['The Revenant', 'The Big Short', 'Spotlight', 'Mad Max: Fury Road'],
    answer: 2,
    explanation: 'Spotlight won Best Picture at the 88th Academy Awards.',
    source: academy(2016),
  },
  {
    id: 'a1',
    category: 'Animation',
    question: 'Which film earned Hayao Miyazaki the 2003 animated feature Oscar?',
    options: ['Princess Mononoke', 'Spirited Away', 'Howl’s Moving Castle', 'My Neighbor Totoro'],
    answer: 1,
    explanation: 'Spirited Away won the animated feature award at the 2003 ceremony.',
    source: academy(2003),
  },
  {
    id: 'a2',
    category: 'Animation',
    question: 'Which animated film won its category at the 2016 Oscars?',
    options: ['Inside Out', 'Anomalisa', 'Shaun the Sheep Movie', 'When Marnie Was There'],
    answer: 0,
    explanation:
      'Inside Out received the animated feature award, with Pete Docter and Jonas Rivera credited.',
    source: academy(2016),
  },
  {
    id: 'a3',
    category: 'Animation',
    question: 'Which Spider-Man film won animated feature at the 2019 Oscars?',
    options: ['Across the Spider-Verse', 'Into the Spider-Verse', 'Homecoming', 'Far From Home'],
    answer: 1,
    explanation: 'Spider-Man: Into the Spider-Verse won the 2019 animated feature Oscar.',
    source: academy(2019),
  },
  {
    id: 'a4',
    category: 'Animation',
    question: 'Which Toy Story film won animated feature at the 2020 Oscars?',
    options: ['Toy Story', 'Toy Story 2', 'Toy Story 3', 'Toy Story 4'],
    answer: 3,
    explanation: 'Toy Story 4 won the animated feature award at the 92nd Academy Awards.',
    source: academy(2020),
  },
  {
    id: 'a5',
    category: 'Animation',
    question: 'Which of these was an animated feature nominee at the 2003 Oscars?',
    options: ['Treasure Planet', 'The Incredibles', 'Cars', 'Ratatouille'],
    answer: 0,
    explanation:
      'Treasure Planet was nominated in the animated feature category alongside winner Spirited Away.',
    source: academy(2003),
  },
  {
    id: 'a6',
    category: 'Animation',
    question: 'Which Studio Ghibli title was an animated feature nominee at the 2016 Oscars?',
    options: ['Ponyo', 'The Wind Rises', 'When Marnie Was There', 'The Boy and the Heron'],
    answer: 2,
    explanation:
      'When Marnie Was There appears among the Academy’s 2016 animated feature nominees.',
    source: academy(2016),
  },
];
export const QUESTIONS: Question[] = [
  ...LEGACY_QUESTIONS.map((q) => ({
    ...q,
    category: q.category === 'Cinema' ? 'General Cinema' : q.category,
  })),
  ...bank,
];
export function dailyQuestions(day: string, category: string) {
  if (category === 'Cinema')
    return seeded(
      LEGACY_QUESTIONS.filter((q) => q.category === category),
      day + category,
      (q) => q.id,
    ).slice(0, 5);
  return seeded(
    QUESTIONS.filter((q) => q.category === category),
    day + category,
    (q) => q.id,
  ).slice(0, 5);
}
export function streak(days: string[], today: string) {
  const set = new Set(days);
  let d = set.has(today) ? today : previousDay(today),
    n = 0;
  while (set.has(d)) {
    n++;
    d = previousDay(d);
  }
  return n;
}

export function quizCategory(key: string) {
  return key
    .slice(11)
    .split(':round:')[0]
    .replace(/^Cinema$/, 'General Cinema');
}
export function freshQuestions(
  category: string,
  seed: string,
  seen: string[],
  previous: string[] = [],
) {
  const count = new Map<string, number>();
  for (const id of seen) count.set(id, (count.get(id) || 0) + 1);
  return seeded(
    QUESTIONS.filter((q) => q.category === category),
    seed,
    (q) => q.id,
  )
    .sort(
      (a, b) =>
        (count.get(a.id) || 0) - (count.get(b.id) || 0) ||
        Number(previous.includes(a.id)) - Number(previous.includes(b.id)),
    )
    .slice(0, 5);
}
