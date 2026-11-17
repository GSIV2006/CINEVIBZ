'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';
import {
  ArrowUpRight,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Shuffle,
  Sparkles,
  Search as SearchIcon,
  Pause,
  Play,
  Film,
} from 'lucide-react';
import Link from 'next/link';
import { Poster } from './media';
import type { Media } from '@/lib/types';
const examples = [
  'Something that feels like a fever dream…',
  'A film for a rainy Sunday evening…',
  'Something that makes me question reality…',
  'An anime that feels like starting life again…',
];
export const MOODS = [
  {
    name: 'The nostalgia trip',
    prompt: 'Nostalgic childhood summer holidays',
    color: '#ff8b45',
    symbol: '✳',
    note: 'A place you almost remember.',
  },
  {
    name: 'Beautifully broken',
    prompt: 'Something beautiful but emotionally devastating',
    color: '#ff5c9a',
    symbol: '♡',
    note: 'For when you need to feel it all.',
  },
  {
    name: 'Neon nights',
    prompt: 'Wandering through Tokyo at 2 AM, lonely and introspective',
    color: '#30d5e8',
    symbol: '☾',
    note: 'The city is awake. So are you.',
  },
  {
    name: 'Existential hours',
    prompt: 'Existential, thought-provoking stories about identity',
    color: '#b795ff',
    symbol: '◎',
    note: 'Big questions. Very late nights.',
  },
  {
    name: 'Soft escapism',
    prompt: 'Whimsical gentle escapism and a little wonder',
    color: '#cbdb89',
    symbol: '✿',
    note: 'Somewhere the world feels lighter.',
  },
  {
    name: 'Mind-bending reality',
    prompt: 'Surreal mysterious stories that make me question reality',
    color: '#f5ebd8',
    symbol: '⌁',
    note: 'Pull one thread. Unravel everything.',
  },
  {
    name: 'Pure chaos',
    prompt: 'A chaotic adrenaline-filled wild ride',
    color: '#ff8b45',
    symbol: '↯',
    note: 'Absolutely no thoughts. Just go.',
  },
  {
    name: 'Comfort zone',
    prompt: 'Cozy wholesome friendship for a rainy Sunday',
    color: '#ffb8d2',
    symbol: '☁',
    note: 'Your cinematic exhale.',
  },
];
export function Hero({ films = [] }: { films: Media[] }) {
  const router = useRouter();
  const [prompt, setPrompt] = useState(''),
    [mode, setMode] = useState<'mood' | 'search'>('mood');
  const [card, setCard] = useState(0),
    [paused, setPaused] = useState(false);
  const reduced = useReducedMotion();
  const x = useMotionValue(0),
    y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 80, damping: 22 }),
    sy = useSpring(y, { stiffness: 80, damping: 22 });
  const deck = films.filter((m) => m.poster).slice(0, 9);
  const current = deck.length ? deck[card % deck.length] : undefined;
  const step = (dir: number) =>
    setCard((c) => (deck.length ? (c + dir + deck.length) % deck.length : 0));
  function go(value = prompt, selected = mode) {
    if (value.trim().length >= 2)
      router.push(
        (selected === 'search' ? '/search?q=' : '/discover?mood=') +
          encodeURIComponent(value.trim()),
      );
  }
  return (
    <section className={`mixtape-hero ${paused ? 'motion-paused' : ''}`}>
      <div className="mixtape-kicker">
        <span>
          <i />
          THE INTERNET'S LITTLE CINEMA CLUB
        </span>
        <button onClick={() => setPaused((p) => !p)} aria-pressed={paused}>
          {paused ? <Play size={12} /> : <Pause size={12} />}{' '}
          {paused ? 'PLAY THE ATMOSPHERE' : 'PAUSE THE ATMOSPHERE'}
        </button>
      </div>
      <div className="mixtape-grid">
        <div className="mixtape-copy">
          <div className="club-ticket">
            ADMIT ONE <span>✳</span> EXIT REALITY
          </div>
          <h1>
            GOOD FILMS.
            <br />
            <span className="strange-word">
              STRANGE
              <svg viewBox="0 0 600 35" preserveAspectRatio="none" aria-hidden="true">
                <path d="M5 18 Q160 -4 300 20 T590 16 M12 30 Q230 10 580 27" />
              </svg>
            </span>
            <br />
            FEELINGS<span className="headline-star">✳</span>
          </h1>
          <p className="mixtape-description">
            For the plot. For the goosebumps.
            <br />
            For the <em>“what did I just watch?”</em>
          </p>
          <div className="mixtape-search">
            <div className="search-modes" aria-label="Discovery mode">
              <button aria-pressed={mode === 'mood'} onClick={() => setMode('mood')}>
                <Sparkles size={14} />A feeling
              </button>
              <button aria-pressed={mode === 'search'} onClick={() => setMode('search')}>
                <SearchIcon size={14} />A title or person
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                go();
              }}
            >
              <label className="sr-only" htmlFor="mood">
                {mode === 'mood'
                  ? 'Describe your mood or cinema preference'
                  : 'Search a title or person'}
              </label>
              <input
                id="mood"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                maxLength={mode === 'mood' ? 500 : 150}
                minLength={mode === 'mood' ? 3 : 2}
                required
                placeholder={
                  mode === 'mood'
                    ? 'Indian thrillers. A fever dream. Your call.'
                    : 'Ram Charan, Peddi, Spirited Away…'
                }
              />
              <button
                className="mixtape-go"
                aria-label={mode === 'mood' ? 'Find my vibe' : 'Search the catalogue'}
              >
                <ArrowUpRight size={27} />
              </button>
            </form>
            <div className="mixtape-suggestions">
              <span>TRY THIS</span>
              <button onClick={() => go('Indian', 'search')}>Indian cinema ↗</button>
              <button onClick={() => go('Ram Charan', 'search')}>Ram Charan ↗</button>
              <button onClick={() => go(MOODS[5].prompt, 'mood')}>Break my brain ↗</button>
            </div>
          </div>
        </div>
        <div
          className="mixtape-art"
          onPointerMove={(e) => {
            if (reduced || paused) return;
            const r = e.currentTarget.getBoundingClientRect();
            x.set((e.clientX - r.left - r.width / 2) * 0.035);
            y.set((e.clientY - r.top - r.height / 2) * 0.025);
          }}
          onPointerLeave={() => {
            x.set(0);
            y.set(0);
          }}
        >
          <div className="orbit-type" aria-hidden="true">
            CINEMA IS A STATE OF MIND · CINEMA IS A STATE OF MIND
          </div>
          <div className="deck-grid" aria-hidden="true" />
          <span className="pink-burst" aria-hidden="true">
            100%
            <small>
              MAIN CHARACTER
              <br />
              ENERGY
            </small>
          </span>
          <motion.div className="film-deck" style={reduced || paused ? {} : { x: sx, y: sy }}>
            {deck.length ? (
              [-1, 1, 0].map((offset) => {
                const m = deck[(card + offset + deck.length) % deck.length];
                return (
                  <motion.div
                    key={m.key + '-' + offset}
                    className={
                      'deck-card deck-card-' +
                      (offset === 0 ? 'front' : offset < 0 ? 'left' : 'right')
                    }
                    initial={reduced ? false : { opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35 }}
                  >
                    {offset === 0 ? (
                      <Link href={`/title/${m.type}/${m.id}`} aria-label={`Explore ${m.title}`}>
                        <Poster media={m} priority />
                        <span className="deck-open">
                          TAKE ME THERE <ArrowUpRight size={16} />
                        </span>
                      </Link>
                    ) : (
                      <button
                        onClick={() => step(offset)}
                        tabIndex={0}
                        aria-label={`Bring ${m.title} to the front`}
                      >
                        <Poster media={m} />
                      </button>
                    )}
                  </motion.div>
                );
              })
            ) : (
              <div className="deck-placeholder">
                <Film size={52} />
                <strong>
                  ROLL
                  <br />
                  WITH IT.
                </strong>
                <span>THE POSTERS ARE ON THEIR WAY</span>
              </div>
            )}
          </motion.div>
          <div className="deck-caption">
            <span className="eyebrow">A LITTLE SOMETHING FROM THE CATALOGUE</span>
            <p>{current?.title || 'Your next obsession is out there.'}</p>
            <div>
              <button onClick={() => step(-1)} disabled={!deck.length} aria-label="Previous poster">
                <ArrowLeft size={18} />
              </button>
              <span>
                {String(deck.length ? (card % deck.length) + 1 : 0).padStart(2, '0')} /{' '}
                {String(deck.length).padStart(2, '0')}
              </span>
              <button onClick={() => step(1)} disabled={!deck.length} aria-label="Next poster">
                <ArrowRight size={18} />
              </button>
              <button
                className="shuffle-deck"
                onClick={() => step(1 + Math.floor(Math.random() * Math.max(1, deck.length - 1)))}
                disabled={!deck.length}
              >
                <Shuffle size={14} />
                Shuffle the deck
              </button>
            </div>
          </div>
          <div className="handwritten-note" aria-hidden="true">
            a film crush
            <br />
            is a real thing ↖
          </div>
        </div>
      </div>
      <div className="mixtape-baseline">
        <span>NO ENDLESS SCROLL. JUST GOOD DETOURS.</span>
        <a href="#rabbit-hole">
          LET'S GET LOST <ArrowDown size={15} />
        </a>
      </div>
    </section>
  );
}
export function Frequency() {
  const [active, setActive] = useState(2);
  const router = useRouter();
  return (
    <section className="frequency-section" id="frequency">
      <div className="section-heading">
        <div>
          <p className="eyebrow">05 / TUNE IN. DROP OUT.</p>
          <h2>
            Find your
            <br />
            <em>frequency.</em>
          </h2>
        </div>
        <p>
          You don't need a genre.
          <br />
          You need a place to start.
        </p>
      </div>
      <div className="frequency-body">
        <div
          className="frequency-art"
          style={{ '--mood-color': MOODS[active].color } as React.CSSProperties}
          aria-hidden="true"
        >
          <div className="frequency-rings">
            <i />
            <i />
            <i />
            <i />
            <span>{MOODS[active].symbol}</span>
          </div>
          <p>{MOODS[active].note}</p>
          <span className="frequency-label">CURRENT FREQUENCY / 0{active + 1}</span>
        </div>
        <div className="mood-list">
          {MOODS.map((m, i) => (
            <button
              key={m.name}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => router.push('/discover?mood=' + encodeURIComponent(m.prompt))}
              className={active === i ? 'selected' : ''}
            >
              <span className="mood-index">0{i + 1}</span>
              <span className="mood-symbol" style={{ color: m.color }}>
                {m.symbol}
              </span>
              <span>{m.name}</span>
              <ArrowUpRight size={22} />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
