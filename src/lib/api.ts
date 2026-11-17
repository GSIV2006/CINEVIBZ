import { NextResponse } from 'next/server';
import { CatalogueError } from './providers/tmdb';
import type { Constraints, Preferences } from './types';
export function failure(error: unknown) {
  if (error instanceof CatalogueError)
    return NextResponse.json(
      { error: error.message, code: error.code },
      { status: error.status, headers: error.status === 429 ? { 'Retry-After': '20' } : {} },
    );
  console.error('Catalogue request failed:', error instanceof Error ? error.name : 'Unknown error');
  return NextResponse.json(
    { error: 'Something interrupted this discovery. Please try again.', code: 'INTERNAL_ERROR' },
    { status: 500 },
  );
}
export function filters(p: URLSearchParams): Partial<Constraints> {
  const type = p.get('type');
  const year = Number(p.get('year'));
  const genre = Number(p.get('genre'));
  const language = p.get('language') || undefined;
  return {
    type: type === 'movie' || type === 'tv' ? type : undefined,
    anime: type === 'anime' || undefined,
    animation: type === 'animation' || undefined,
    language: language && /^[a-z]{2}$/.test(language) ? language : undefined,
    countries: /^[A-Z]{2}$/.test(p.get('country') || '') ? [p.get('country')!] : undefined,
    release:
      p.get('release') === 'upcoming'
        ? 'upcoming'
        : p.get('release') === 'released'
          ? 'released'
          : undefined,
    genres: [
      ...new Set([
        ...(type === 'documentary' ? [99] : []),
        ...(Number.isInteger(genre) && genre > 0 ? [genre] : []),
      ]),
    ],
    yearFrom:
      Number(p.get('from')) >= 1900 && Number(p.get('from')) <= 2100
        ? Number(p.get('from'))
        : year >= 1900 && year <= 2100
          ? year
          : undefined,
    yearTo:
      Number(p.get('to')) >= 1900 && Number(p.get('to')) <= 2100
        ? Number(p.get('to'))
        : year >= 1900 && year <= 2100
          ? year
          : undefined,
    allowMature: p.get('mature') === 'true',
    excludeWatched: true,
  };
}
export function preferences(raw: unknown): Preferences {
  const p = raw as Partial<Preferences> | undefined;
  return {
    feedback: Array.isArray(p?.feedback)
      ? p.feedback
          .filter(
            (f) =>
              f &&
              typeof f.key === 'string' &&
              ['like', 'dislike', 'watched'].includes(f.kind) &&
              Array.isArray(f.genres),
          )
          .slice(-100)
          .map((f) => ({
            key: f.key.slice(0, 50),
            kind: f.kind,
            genres: f.genres.filter((g) => typeof g === 'number').slice(0, 8),
            language: typeof f.language === 'string' ? f.language.slice(0, 2) : '',
            keywords: Array.isArray(f.keywords)
              ? f.keywords.filter((k) => typeof k === 'string').slice(0, 20)
              : [],
          }))
      : [],
    moods: Array.isArray(p?.moods) ? p.moods.filter((m) => typeof m === 'string').slice(0, 8) : [],
    allowMature: p?.allowMature === true,
    excludeWatched: p?.excludeWatched !== false,
  };
}
