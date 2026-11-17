'use client';
import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';
import { api } from '@/lib/client';
import type { Interpretation, Recommendation, CatalogueResult } from '@/lib/types';
import { COUNTRIES } from '@/lib/catalogue-intent';
import { CatalogueResults } from './catalogue-results';
import { useStore } from './store';
import { FilterBar, emptyFilters } from './filters';
import { Loading, Notice, RecommendationCard } from './media';
type Result = {
  results: Recommendation[];
  catalogue?: CatalogueResult;
  interpretation: Interpretation;
  candidateCount: number;
  enrichedCount: number;
  partial: boolean;
};
export function Discover() {
  const params = useSearchParams();
  const initial = params.get('mood') || '';
  const [prompt, setPrompt] = useState(initial);
  const [filters, setFilters] = useState(emptyFilters);
  const [data, setData] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { state, ready, discover } = useStore();
  const router = useRouter();
  const stateRef = useRef(state);
  stateRef.current = state;
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    setPrompt(initial);
  }, [initial]);
  useEffect(() => {
    if (!ready || initial.trim().length < 3) return;
    const controller = new AbortController();
    setBusy(true);
    setError('');
    setData(null);
    api<Result>('/api/recommend', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: initial, preferences: stateRef.current.preferences, filters }),
      signal: controller.signal,
    })
      .then((r) => {
        if (controller.signal.aborted) return;
        setData(r);
        discover(initial);
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    return () => controller.abort();
  }, [initial, ready, attempt, filters, discover]);
  function submit() {
    if (prompt.trim().length < 3) return;
    if (initial === prompt.trim()) setAttempt((n) => n + 1);
    else router.push('/discover?mood=' + encodeURIComponent(prompt.trim()));
  }
  return (
    <main id="main" className="page-shell">
      <p className="eyebrow">THE FEELING COMES FIRST</p>
      <h1>
        Make it <em>a whole mood.</em>
      </h1>
      <p className="page-intro">
        Start with a feeling, a film, an actor, or a cinema culture. We’ll follow your lead.
      </p>
      <form
        className="discover-edit"
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
      >
        <label className="sr-only" htmlFor="discover-prompt">
          Your mood
        </label>
        <textarea
          id="discover-prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          required
          minLength={3}
          maxLength={500}
          rows={2}
          placeholder="A lonely, neon-lit night in Tokyo…"
        />
        <button className="button violet" disabled={busy}>
          Find my vibe <ArrowUpRight size={18} />
        </button>
      </form>
      {params.get('challenge') && (
        <p className="challenge-return">
          Today's Feeling · Save your favourite below, then{' '}
          <Link href="/#todays-feeling">finish the daily challenge ↗</Link>.
        </p>
      )}
      <FilterBar value={filters} onChange={setFilters} id="discover-" />
      {busy && <Loading text="Reading your mood. Finding titles. Checking the evidence…" />}
      {error && <Notice message={error} retry={submit} />}{' '}
      {data && (
        <>
          {data.catalogue ? (
            <CatalogueResults data={data.catalogue} />
          ) : (
            <>
              <section className="interpretation">
                <p className="eyebrow">HERE'S WHAT WE HEARD</p>
                <div className="signal-chips">
                  {data.interpretation.signals.map((s) => (
                    <span key={s.key}>
                      <small>{s.dimension}</small>
                      {s.label}
                    </span>
                  ))}
                  {data.interpretation.constraints.countries?.map((c) => (
                    <span key={c}>{COUNTRIES[c] || c} productions only</span>
                  ))}
                  {data.interpretation.constraints.type && (
                    <span>
                      {data.interpretation.constraints.type === 'movie'
                        ? 'Movies only'
                        : 'Series only'}
                    </span>
                  )}
                  {data.interpretation.constraints.anime && <span>Japanese animation only</span>}
                  {data.interpretation.constraints.language && (
                    <span>Language: {data.interpretation.constraints.language.toUpperCase()}</span>
                  )}
                  {data.interpretation.constraints.yearFrom && (
                    <span>From {data.interpretation.constraints.yearFrom}</span>
                  )}
                  {data.interpretation.constraints.yearTo && (
                    <span>Through {data.interpretation.constraints.yearTo}</span>
                  )}
                </div>
                {data.interpretation.notes.map((n) => (
                  <p className="interpretation-note" key={n}>
                    {n}
                  </p>
                ))}
                <p className="interpretation-note">
                  {data.candidateCount} catalogue candidates · {data.enrichedCount} detailed records
                  checked. Resonance scores reflect this engine's evidence, not a probability that
                  you'll enjoy a title.
                </p>
                {data.partial && (
                  <p className="interpretation-note">
                    Some provider requests failed. This discovery uses a partial candidate pool.
                  </p>
                )}
              </section>
              {data.results.length ? (
                <div>
                  {data.results.map((m, i) => (
                    <RecommendationCard media={m} index={i} key={m.key} />
                  ))}
                </div>
              ) : (
                <Notice message="We couldn't find enough supporting evidence for these filters. Try a broader feeling, remove a constraint, or check the content controls in Guest settings." />
              )}
            </>
          )}
        </>
      )}
    </main>
  );
}
