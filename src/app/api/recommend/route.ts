import { NextResponse } from 'next/server';
import { interpret } from '@/lib/recommendations/interpret';
import { recommend } from '@/lib/recommendations/retrieve';
import { searchCatalogue, findPeople, isPersonMatch } from '@/lib/catalogue';
import { onlyCatalogueConstraints } from '@/lib/catalogue-intent';
import { failure, preferences, filters } from '@/lib/api';
export const maxDuration = 60;
export async function POST(req: Request) {
  try {
    const text = await req.text();
    if (text.length > 25000)
      return NextResponse.json({ error: 'This request is too large.' }, { status: 413 });
    let body;
    try {
      body = JSON.parse(text);
    } catch {
      return NextResponse.json({ error: 'Send a valid discovery request.' }, { status: 400 });
    }
    if (
      typeof body.prompt !== 'string' ||
      body.prompt.trim().length < 3 ||
      body.prompt.length > 500
    )
      return NextResponse.json(
        { error: 'Describe your feeling in 3–500 characters.' },
        { status: 400 },
      );
    const p = preferences(body.preferences);
    const f = filters(new URLSearchParams(typeof body.filters === 'object' ? body.filters : {}));
    const i = interpret(body.prompt, {
      ...Object.fromEntries(Object.entries(f).filter(([, v]) => v !== undefined)),
      allowMature: p.allowMature,
      excludeWatched: p.excludeWatched,
    });
    if (i.conflicts.length)
      return NextResponse.json(
        { error: i.conflicts.join(' '), interpretation: i },
        { status: 422 },
      );
    // Resolve countries, titles and real people before considering an emotional ranking.
    const browse = onlyCatalogueConstraints(body.prompt, i.constraints);
    const people = browse || i.signals.length ? [] : await findPeople(body.prompt);
    const person = people.find((x) => isPersonMatch(x, body.prompt));
    if (person || !i.signals.length) {
      const catalogue = await searchCatalogue(body.prompt, f, 1, person?.id);
      return NextResponse.json({
        results: [],
        catalogue,
        interpretation: { ...i, notes: [] },
        candidateCount: catalogue.totalResults,
        enrichedCount: catalogue.results.filter((m) => m.enriched).length,
        partial: catalogue.partial,
      });
    }
    return NextResponse.json(await recommend(i, p));
  } catch (e) {
    return failure(e);
  }
}
