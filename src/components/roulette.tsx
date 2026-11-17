'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Shuffle, ArrowUpRight } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { api } from '@/lib/client';
import type { Media } from '@/lib/types';
import { useStore } from './store';
import { FilterBar, emptyFilters } from './filters';
import { MediaCard } from './media';
export function Roulette() {
  const [filters, setFilters] = useState(emptyFilters),
    [result, setResult] = useState<(Media & { rouletteNote?: string }) | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState('');
  const [seen, setSeen] = useState<string[]>([]);
  const spinning = useRef(false);
  const reduced = useReducedMotion();
  const { state, record } = useStore();
  useEffect(() => {
    try {
      const saved = JSON.parse(sessionStorage.getItem('cinevibz:roulette') || '[]');
      if (Array.isArray(saved)) setSeen(saved.filter((x) => typeof x === 'string').slice(-200));
    } catch {}
  }, []);
  async function spin() {
    if (spinning.current) return;
    spinning.current = true;
    setBusy(true);
    setError('');
    try {
      const [m] = await Promise.all([
        api<Media & { rouletteNote?: string }>(
          '/api/roulette?' +
            new URLSearchParams({
              ...filters,
              mature: String(state.preferences.allowMature),
              exclude: seen.join(','),
            }),
        ),
        new Promise((resolve) => setTimeout(resolve, reduced ? 0 : 1200)),
      ]);
      setResult(m);
      const next = [...new Set([...seen, m.key])].slice(-200);
      setSeen(next);
      try {
        sessionStorage.setItem('cinevibz:roulette', JSON.stringify(next));
      } catch {}
      record('roulette', m.title, `/title/${m.type}/${m.id}`);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      spinning.current = false;
    }
  }
  return (
    <section className="roulette-section" id="roulette">
      <div className="roulette-copy">
        <p className="eyebrow">07 / HAND OVER THE REMOTE</p>
        <h2>
          A little less choice.
          <br />
          <em>A little more chance.</em>
        </h2>
        <p>Watch Roulette. Real films. A proper reveal. No repeat picks in this session.</p>
        <FilterBar value={filters} onChange={setFilters} id="roulette-" period />
        <button className="button cream spin-button" onClick={spin} disabled={busy}>
          <Shuffle size={18} />
          {busy ? 'Spinning…' : result ? 'SPIN AGAIN' : 'SPIN'}
          <ArrowUpRight size={18} />
        </button>
        <span className="roulette-count">{seen.length} discoveries this session</span>
        {error && (
          <p className="inline-error" role="status">
            {error}
          </p>
        )}
      </div>
      <div className="roulette-result" aria-live="polite">
        {result && !busy ? (
          <motion.div
            key={result.key}
            initial={reduced ? false : { scale: 0.85, opacity: 0, rotate: -5 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 19 }}
          >
            <p className="eyebrow roulette-reveal">FATE HAS EXCELLENT TASTE ↘</p>
            <MediaCard media={result} />
            <Link className="button dark" href={`/title/${result.type}/${result.id}`}>
              Explore this pick <ArrowUpRight size={16} />
            </Link>
            {result.rouletteNote && <p className="roulette-pool-note">{result.rouletteNote}</p>}
          </motion.div>
        ) : (
          <div className={busy && !reduced ? 'roulette-disc spinning' : 'roulette-disc'}>
            <div className="disc-type">C I N E V I B Z · W A T C H · R O U L E T T E</div>
            <span>{busy ? '✳' : '?'}</span>
            <small>{busy ? 'THE PLOT IS SPINNING' : 'SIDE A / THE UNKNOWN'}</small>
          </div>
        )}
      </div>
    </section>
  );
}
