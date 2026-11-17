import type {
  Media,
  Interpretation,
  Preferences,
  Recommendation,
  Evidence,
  Constraints,
} from '@/lib/types';
import { TAXONOMY, textContains } from './taxonomy';
import { dateKey } from '../dates';
export const WEIGHTS = {
  emotion: 30,
  atmosphere: 20,
  theme: 15,
  visual: 5,
  setting: 5,
  pacing: 5,
  experience: 5,
  genre: 5,
  preference: 7,
  quality: 3,
};
export function safeForGeneral(m: Media) {
  if (m.adult || !m.certification) return false;
  const allowed: Record<string, string[]> = {
    US: ['G', 'PG', 'PG-13', 'TV-Y', 'TV-Y7', 'TV-G', 'TV-PG', 'TV-14'],
    GB: ['U', 'PG', '12', '12A'],
    IN: ['U', 'UA', 'U/A', 'UA 7+', 'UA 13+', 'U/A 7+', 'U/A 13+'],
  };
  return allowed[m.certification.country]?.includes(m.certification.rating) ?? false;
}
export function complies(m: Media, c: Constraints, p?: Preferences) {
  if (
    m.adult ||
    (c.type && m.type !== c.type) ||
    (c.anime && (!m.genres.includes(16) || m.language !== 'ja')) ||
    (c.animation && !m.genres.includes(16))
  )
    return false;
  if ((c.language && m.language !== c.language) || c.excludedLanguages.includes(m.language))
    return false;
  if (c.countries?.length && !c.countries.some((country) => m.countries.includes(country)))
    return false;
  if (c.excludedCountries?.some((country) => m.countries.includes(country))) return false;
  if (c.languages?.length && !c.languages.includes(m.language)) return false;
  if (c.release === 'upcoming' && m.date && m.date <= dateKey()) return false;
  if (c.release === 'released' && (!m.date || m.date > dateKey())) return false;
  const equivalent = (g: number) =>
    m.type === 'tv'
      ? { 28: 10759, 12: 10759, 878: 10765, 14: 10765, 10752: 10768, 36: 10768 }[g] || g
      : g;
  if (
    c.genres.some((g) => !m.genres.includes(equivalent(g))) ||
    c.excludedGenres.some((g) => m.genres.includes(equivalent(g)))
  )
    return false;
  if (
    (c.yearFrom && (!m.year || m.year < c.yearFrom)) ||
    (c.yearTo && (!m.year || m.year > c.yearTo))
  )
    return false;
  if (c.runtimeMax && (!m.runtime || m.runtime > c.runtimeMax)) return false;
  if (!c.allowMature && !safeForGeneral(m)) return false;
  if (c.excludeWatched && p?.feedback.some((f) => f.key === m.key && f.kind === 'watched'))
    return false;
  if (p?.feedback.some((f) => f.key === m.key && f.kind === 'dislike')) return false;
  return true;
}
// Broad narrative words are weak evidence; explicit tone keywords carry more weight.
const TERM_STRENGTH: Record<string, number> = {
  family: 0.12,
  friendship: 0.3,
  community: 0.25,
  reunion: 0.2,
  'small town': 0.2,
  loss: 0.28,
  death: 0.2,
  tragedy: 0.5,
  grief: 0.65,
  dream: 0.35,
  dreams: 0.35,
  night: 0.35,
  city: 0.25,
  urban: 0.2,
  journey: 0.2,
  reality: 0.25,
  magic: 0.5,
  fantasy: 0.3,
  hope: 0.6,
  romance: 0.6,
  love: 0.2,
  'coming of age': 0.5,
  loneliness: 0.8,
  lonely: 0.7,
  solitude: 0.6,
  space: 0.6,
  identity: 0.8,
  memory: 0.7,
  memories: 0.65,
};
export function evidenceFor(m: Media, i: Interpretation): Evidence[] {
  return i.signals.flatMap((signal) => {
    const matches = signal.evidence
      .flatMap<Evidence>((term) => {
        const strength = TERM_STRENGTH[term] ?? 0.9;
        if (m.keywords.some((k) => textContains(k, term)))
          return [
            {
              signal: signal.label,
              dimension: signal.dimension,
              term,
              source: 'keyword' as const,
              strength,
            },
          ];
        if (textContains(m.overview, term))
          return [
            {
              signal: signal.label,
              dimension: signal.dimension,
              term,
              source: 'synopsis' as const,
              strength: strength * 0.75,
            },
          ];
        return [];
      })
      .sort((a, b) => b.strength - a.strength);
    if (!matches.length) return [];
    const best = matches[0];
    return [{ ...best, strength: Math.min(1, best.strength + (matches[1]?.strength ?? 0) * 0.2) }];
  });
}
export function score(m: Media, i: Interpretation, p?: Preferences): Recommendation {
  const evidence = evidenceFor(m, i);
  const dimensions = [...new Set(i.signals.map((s) => s.dimension))];
  const available = dimensions.reduce((n, d) => n + WEIGHTS[d], 0);
  const earned = dimensions.reduce((n, d) => {
    const expected = i.signals.filter((s) => s.dimension === d).length;
    return (
      n +
      (WEIGHTS[d] *
        evidence.filter((e) => e.dimension === d).reduce((sum, e) => sum + e.strength, 0)) /
        expected
    );
  }, 0);
  let coverage = available ? earned / available : 0;
  const wantsComfort = i.signals.some((s) => s.key === 'comfort');
  if (wantsComfort) {
    const tense = m.genres.some((g) => [27, 53, 10752, 80].includes(g));
    const distress = [
      'murder',
      'terror',
      'torture',
      'serial killer',
      'brutal',
      'grief',
      'tragedy',
    ].some((t) => m.keywords.some((k) => textContains(k, t)));
    if (tense) coverage *= 0.45;
    if (distress) coverage *= 0.6;
  }
  const specificSetting = i.signals.find((s) => s.key === 'tokyo');
  if (specificSetting && !evidence.some((e) => e.signal === specificSetting.label)) coverage *= 0.3;
  if (i.signals.length > 1 && new Set(evidence.map((e) => e.term)).size === 1)
    coverage = Math.min(coverage, 0.5);

  const negative = i.excludedSignals.filter((s) =>
    s.evidence.some(
      (t) => textContains(m.overview, t) || m.keywords.some((k) => textContains(k, t)),
    ),
  ).length;
  let preference = 0;
  for (const mood of p?.moods || []) {
    const aligned = TAXONOMY.filter((s) => s.pattern.test(mood)).some((s) =>
      s.evidence.some(
        (e) => textContains(m.overview, e) || m.keywords.some((k) => textContains(k, e)),
      ),
    );
    if (aligned) preference += 0.5;
  }
  for (const f of (p?.feedback || []).slice(-40)) {
    if (f.kind === 'watched') continue;
    const overlap =
      m.genres.filter((g) => f.genres.includes(g)).length / Math.max(1, m.genres.length);
    preference += (f.kind === 'like' ? 1 : -1) * overlap * 0.6;
  }
  preference = Math.max(-WEIGHTS.preference, Math.min(WEIGHTS.preference, preference));
  const quality =
    m.rating === null ? 0 : (m.rating / 10) * Math.min(1, m.votes / 500) * WEIGHTS.quality;
  const n = Math.round(
    Math.max(
      0,
      Math.min(
        100,
        coverage * 85 +
          (i.constraints.genres.length ? 5 : 0) +
          preference +
          quality -
          negative * 28,
      ),
    ),
  );
  const description = evidence
    .slice(0, 3)
    .map((e) => `${e.signal.toLowerCase()} → “${e.term}” in the ${e.source}`)
    .join('; ');
  const explanation = description
    ? `Evidence for your mood: ${description}.${coverage < 0.5 ? ' Only part of your request is supported.' : ''}`
    : 'Catalogue constraints match, but there is not enough mood evidence to call this a strong recommendation.';
  return {
    ...m,
    score: n,
    match:
      coverage >= 0.7
        ? 'Strong resonance'
        : coverage >= 0.35
          ? 'Promising connection'
          : 'A loose connection',
    explanation,
    evidence,
    coverage,
  };
}
export function rank(
  candidates: Media[],
  i: Interpretation,
  p?: Preferences,
  limit = 12,
): Recommendation[] {
  if (i.conflicts.length) return [];
  const seen = new Set<string>();
  const pool = candidates
    .filter((m) => {
      if (seen.has(m.key) || !complies(m, i.constraints, p)) return false;
      seen.add(m.key);
      return true;
    })
    .map((m) => score(m, i, p))
    .filter((m) => !i.signals.length || m.coverage >= 0.25)
    .sort((a, b) => b.score - a.score || b.votes - a.votes || a.key.localeCompare(b.key));
  const selected: Recommendation[] = [];
  while (pool.length && selected.length < limit) {
    let best = 0;
    let bestValue = -Infinity;
    pool.forEach((m, index) => {
      const penalty = selected.reduce(
        (sum, s) =>
          sum +
          (s.language === m.language ? 1.1 : 0) +
          (s.type === m.type ? 0.4 : 0) +
          (s.genres[0] === m.genres[0] ? 1.8 : 0),
        0,
      );
      const value = m.score - penalty;
      if (value > bestValue) {
        best = index;
        bestValue = value;
      }
    });
    selected.push(pool.splice(best, 1)[0]);
  }
  return selected;
}
