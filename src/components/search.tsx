'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowUpRight, Search as SearchIcon } from 'lucide-react';
import { api } from '@/lib/client';
import type { CatalogueResult } from '@/lib/types';
import { FilterBar, emptyFilters } from './filters';
import { Loading, Notice } from './media';
import { CatalogueResults } from './catalogue-results';

export function Search() {
  const params = useSearchParams();
  const initialQuery = params.get('q') || '',
    initialType = params.get('type') || '',
    initialPerson = params.get('person') || '';
  const [query, setQuery] = useState(initialQuery),
    [debounced, setDebounced] = useState(initialQuery);
  const [person, setPerson] = useState(initialPerson);
  const [filters, setFilters] = useState({ ...emptyFilters, type: initialType });
  const [data, setData] = useState<CatalogueResult | null>(null),
    [page, setPage] = useState(1);
  const [safe, setSafe] = useState(false),
    [busy, setBusy] = useState(true),
    [error, setError] = useState(''),
    [attempt, setAttempt] = useState(0);
  useEffect(() => {
    setQuery(initialQuery);
    setDebounced(initialQuery);
    setPerson(initialPerson);
    setFilters((f) => ({ ...f, type: initialType }));
    setPage(1);
  }, [initialQuery, initialType, initialPerson]);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebounced(query);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [query]);
  useEffect(() => {
    const controller = new AbortController();
    setBusy(true);
    setError('');
    setData(null);
    api<CatalogueResult>(
      '/api/search?' +
        new URLSearchParams({
          ...filters,
          q: debounced,
          person,
          page: String(page),
          safe: String(safe),
        }),
      { signal: controller.signal },
    )
      .then((r) => {
        if (!controller.signal.aborted) setData(r);
      })
      .catch((e) => {
        if (e.name !== 'AbortError') setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setBusy(false);
      });
    return () => controller.abort();
  }, [filters, debounced, person, page, safe, attempt]);
  function choose(value: string) {
    setPerson('');
    setQuery(value);
    setDebounced(value);
    setPage(1);
  }
  return (
    <main id="main" className="page-shell catalogue-page">
      <div className="page-masthead">
        <div>
          <p className="eyebrow">BIG SCREENS. SMALL OBSESSIONS.</p>
          <h1>
            The whole
            <br />
            <em>wide screen.</em>
          </h1>
        </div>
        <span className="search-stamp" aria-hidden="true">
          TAKE
          <br />A CLOSER
          <br />
          LOOK ↙
        </span>
      </div>
      <p className="page-intro">
        A film. A face. A whole cinema culture. Find exactly what brought you here.
      </p>
      <form
        className="search-form"
        onSubmit={(e) => {
          e.preventDefault();
          setDebounced(query);
          setPage(1);
          setAttempt((a) => a + 1);
        }}
      >
        <SearchIcon className="search-field-icon" size={22} />
        <label className="sr-only" htmlFor="title-search">
          Search titles, people or cinema regions
        </label>
        <input
          id="title-search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPerson('');
          }}
          placeholder="Try Peddi, Ram Charan, or Indian cinema…"
          maxLength={150}
        />
        <button className="button violet">
          Find it <ArrowUpRight size={22} />
        </button>
      </form>
      <div className="search-shortcuts">
        <span>GO DOWN A RABBIT HOLE</span>
        {['Indian', 'Ram Charan', 'Peddi', 'Telugu movies', 'Malayalam thrillers'].map((q) => (
          <button key={q} onClick={() => choose(q)}>
            {q} ↗
          </button>
        ))}
      </div>
      <FilterBar
        value={filters}
        onChange={(f) => {
          setFilters(f);
          setPage(1);
        }}
        id="search-"
      />
      <div className="results-meta">
        <label className="safe-search">
          <input
            type="checkbox"
            checked={safe}
            onChange={(e) => {
              setSafe(e.target.checked);
              setPage(1);
            }}
          />
          Family-friendly only
        </label>
        <span>
          {safe
            ? 'Verified general-audience ratings'
            : 'All catalogue ratings · announced titles included'}
        </span>
      </div>
      {busy && (
        <Loading
          text={
            person || debounced
              ? 'Finding real titles and verified credits…'
              : 'Opening the catalogue…'
          }
        />
      )}
      {error && <Notice message={error} retry={() => setAttempt((a) => a + 1)} />}
      {!busy && data && (
        <>
          <CatalogueResults data={data} />
          <div className="catalogue-pagination">
            <button
              className="button outline"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ← Previous
            </button>
            <span>
              PAGE {page} / {Math.max(1, data.totalPages)}
            </span>
            <button
              className="button outline"
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next →
            </button>
          </div>
        </>
      )}
    </main>
  );
}
