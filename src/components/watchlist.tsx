'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useStore } from './store';
import { MediaCard, FeedbackActions, Loading } from './media';
export function Watchlist() {
  const { state, ready } = useStore();
  const [tab, setTab] = useState('all');
  const [query, setQuery] = useState('');
  const watched = new Set(
    state.preferences.feedback.filter((f) => f.kind === 'watched').map((f) => f.key),
  );
  const list = state.watchlist.filter(
    (m) =>
      (tab === 'all' || (tab === 'watched' ? watched.has(m.key) : !watched.has(m.key))) &&
      m.title.toLowerCase().includes(query.toLowerCase()),
  );
  return (
    <main id="main" className="page-shell">
      <p className="eyebrow">A LITTLE COLLECTION OF MAYBES</p>
      <h1>Your future favourites.</h1>
      <p className="page-intro">
        Saved for the right night. Stored on this browser, ready when you are.
      </p>
      <div className="watchlist-tabs">
        {[
          ['all', 'Everything'],
          ['unwatched', 'Still to watch'],
          ['watched', 'Already watched'],
        ].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)} aria-pressed={tab === id}>
            {label}
          </button>
        ))}
      </div>
      {state.watchlist.length > 0 && (
        <div className="search-form">
          <label className="sr-only" htmlFor="watchlist-search">
            Filter your watchlist
          </label>
          <input
            id="watchlist-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find something you saved…"
          />
        </div>
      )}
      {!ready ? (
        <Loading />
      ) : list.length ? (
        <div className="results-grid">
          {list.map((m) => (
            <div key={m.key}>
              <MediaCard media={m} />
              <div style={{ marginTop: 12 }}>
                <FeedbackActions media={m} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-watchlist">
          <span>♡</span>
          <h2>
            {state.watchlist.length ? 'Nothing in this view.' : 'Leave a little room for wonder.'}
          </h2>
          <p>
            {state.watchlist.length
              ? 'Change your filter to find your other saved titles.'
              : 'Tap the + on any title to save it here. Your next favourite is out there somewhere.'}
          </p>
          <Link className="button violet" href="/">
            Find a feeling ↗
          </Link>
        </div>
      )}
    </main>
  );
}
