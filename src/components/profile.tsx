'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useStore } from './store';
import { MOODS } from './hero';
import { RabbitHistory } from './engagement';
export function Profile() {
  const { state, setPreferences, reset, clear } = useStore();
  const [confirm, setConfirm] = useState('');
  return (
    <main id="main" className="page-shell">
      <p className="eyebrow">NO ACCOUNT. ALL YOU.</p>
      <h1>Your corner of the cinema.</h1>
      <p className="page-intro">
        A guest-first space. Preferences, discoveries and watchlists stay in this browser.
      </p>
      <div className="settings-grid">
        <section className="settings-panel">
          <h2>Set the atmosphere.</h2>
          <label className="setting-row">
            <span>
              Include mature and unrated recommendations
              <small>
                For automatic mood and home recommendations. Direct catalogue searches and title
                pages remain available. General mode requires a recognised US, UK or India rating up
                to PG-13 / TV-14 / 12 / UA 13+. Adult-only catalogue entries are always excluded.
              </small>
            </span>
            <input
              type="checkbox"
              checked={state.preferences.allowMature}
              onChange={(e) => setPreferences({ allowMature: e.target.checked })}
            />
          </label>
          <label className="setting-row">
            <span>
              Skip titles I've watched<small>Applies to mood recommendations.</small>
            </span>
            <input
              type="checkbox"
              checked={state.preferences.excludeWatched}
              onChange={(e) => setPreferences({ excludeWatched: e.target.checked })}
            />
          </label>
          <p>Your recurring moods. A small nudge for future discoveries.</p>
          <div className="quiz-category">
            {MOODS.map((m) => (
              <button
                key={m.name}
                aria-pressed={state.preferences.moods.includes(m.prompt)}
                onClick={() =>
                  setPreferences({
                    moods: state.preferences.moods.includes(m.prompt)
                      ? state.preferences.moods.filter((p) => p !== m.prompt)
                      : [...state.preferences.moods, m.prompt],
                  })
                }
              >
                {m.name}
              </button>
            ))}
          </div>
          <p>
            {state.preferences.feedback.length} saved feedback signals · {state.watchlist.length}{' '}
            watchlist titles
          </p>
          <button className="text-button" onClick={() => setConfirm('preferences')}>
            Reset preferences & history ↗
          </button>
          <div style={{ marginTop: 20 }}>
            <button className="danger-button" onClick={() => setConfirm('all')}>
              Clear all local data
            </button>
          </div>
          {confirm && (
            <div className="confirmation" role="alert">
              <p>
                {confirm === 'all'
                  ? 'Clear your watchlist, quiz progress, preferences and history from this browser?'
                  : 'Reset mood preferences, feedback and discovery history? Your watchlist and quiz progress stay saved.'}
              </p>
              <button
                className="button violet"
                onClick={() => {
                  confirm === 'all' ? clear() : reset();
                  setConfirm('');
                }}
              >
                Confirm reset
              </button>
              <button className="text-button" onClick={() => setConfirm('')}>
                Keep my data
              </button>
            </div>
          )}
        </section>
        <section className="settings-panel">
          <h2>Where your mind wandered.</h2>
          <p>Your last 30 discoveries.</p>
          {state.history.length ? (
            <ul className="history-list">
              {state.history.map((h) => (
                <li key={h.prompt}>
                  <Link href={'/discover?mood=' + encodeURIComponent(h.prompt)}>{h.prompt} ↗</Link>
                  <small>
                    {new Date(h.date).toLocaleDateString('en-IN', {
                      timeZone: 'Asia/Kolkata',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </small>
                </li>
              ))}
            </ul>
          ) : (
            <p>No discoveries yet. Start with a feeling.</p>
          )}
          <Link href="/" className="button cream">
            Find something unexpected ↗
          </Link>
        </section>
      </div>
      <RabbitHistory full />
    </main>
  );
}
