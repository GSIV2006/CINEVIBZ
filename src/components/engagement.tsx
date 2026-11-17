'use client';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowUpRight, Check, Bookmark, Sparkles, History } from 'lucide-react';
import { challengeForDay, longestStreak } from '@/lib/engagement';
import { streak } from '@/data/quiz';
import { useStore } from './store';
import { useDay } from './use-day';
export function TodaysFeeling() {
  const day = useDay();
  const { state, challenge, ready } = useStore();
  const daily = challengeForDay(day),
    run = state.challenges[day];
  return (
    <section className="feeling-challenge" id="todays-feeling">
      <div className="feeling-symbol" aria-hidden="true">
        ✳
      </div>
      <div className="feeling-copy">
        <p className="eyebrow">09 / TODAY'S FEELING · {day || 'LOADING'} / IST</p>
        <h2>{daily.title}</h2>
        <p>“{daily.prompt}”</p>
        <div className="feeling-actions">
          <Link
            className="button dark"
            href={'/discover?mood=' + encodeURIComponent(daily.prompt) + '&challenge=' + day}
            onClick={() => challenge(day, { explored: true })}
          >
            Explore this feeling <ArrowUpRight size={16} />
          </Link>
          <button
            className="button outline"
            disabled={!ready || !day || !run?.explored || run?.complete}
            onClick={() => challenge(day, { complete: true })}
          >
            {run?.complete ? (
              <>
                <Check size={16} />
                Challenge complete
              </>
            ) : (
              'Mark complete'
            )}
          </button>
        </div>
        <p className="feeling-help">
          Explore the prompt, save a discovery, then make it your pick for today. Completion counts
          once toward your discovery streak.
        </p>
        {run?.explored && (
          <label className="challenge-favourite">
            <Bookmark size={16} />
            <span>My discovery</span>
            <select
              value={run.favourite || ''}
              onChange={(e) => challenge(day, { favourite: e.target.value })}
            >
              <option value="">Choose from your saved titles…</option>
              {state.watchlist.map((m) => (
                <option value={m.key} key={m.key}>
                  {m.title}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>
      <div className="challenge-streak">
        <strong>{day ? streak(state.completedDays, day) : 0}</strong>
        <span>DAY STREAK</span>
        <small>Longest: {longestStreak(state.completedDays)} days</small>
      </div>
    </section>
  );
}
export function RabbitHistory({ full = false }: { full?: boolean }) {
  const { state, clearHistory } = useStore();
  const [confirm, setConfirm] = useState(false),
    [kind, setKind] = useState('all');
  if (!state.events.length && !full) return null;
  const items = state.events
    .filter((e) => kind === 'all' || e.kind === kind)
    .slice(0, full ? 150 : 8);
  return (
    <section className="rabbit-history section" id="your-rabbit-holes">
      <div className="section-heading">
        <div>
          <p className="eyebrow">10 / A TRAIL WORTH KEEPING</p>
          <h2>Your rabbit holes.</h2>
          <p>Feelings followed. Films found. Little victories. All in this browser.</p>
        </div>
        {!full && (
          <Link className="text-button" href="/profile#your-rabbit-holes">
            Your full trail <ArrowUpRight size={16} />
          </Link>
        )}
      </div>
      <div className="history-tabs" aria-label="History type">
        {[
          ['all', 'Everything'],
          ['mood', 'Moods'],
          ['title', 'Explored'],
          ['saved', 'Saved'],
          ['roulette', 'Roulette'],
          ['quiz', 'Quizzes'],
          ['challenge', 'Challenges'],
        ].map(([value, label]) => (
          <button key={value} aria-pressed={kind === value} onClick={() => setKind(value)}>
            {label}
          </button>
        ))}
      </div>
      {items.length ? (
        <div className="discovery-history">
          {items.map((e) => (
            <Link href={e.href} key={e.id}>
              <span className="history-kind">
                {e.kind === 'quiz'
                  ? '✓'
                  : e.kind === 'roulette'
                    ? '↻'
                    : e.kind === 'saved'
                      ? '♡'
                      : '↗'}
                <small>{e.kind}</small>
              </span>
              <strong>{e.label}</strong>
              <time dateTime={e.at}>
                {new Date(e.at).toLocaleDateString('en-IN', {
                  timeZone: 'Asia/Kolkata',
                  day: 'numeric',
                  month: 'short',
                })}
              </time>
              <ArrowUpRight size={16} />
            </Link>
          ))}
        </div>
      ) : (
        <p className="history-empty">
          Nothing in this corner yet. Your next discovery starts a new trail.
        </p>
      )}
      <button className="text-button erase-history" onClick={() => setConfirm((c) => !c)}>
        Erase discovery history
      </button>
      {confirm && (
        <div className="confirmation">
          <p>
            Erase this activity list and mood-search history? Your watchlist, game progress and
            streaks stay saved. Guest settings also has a full local-data reset.
          </p>
          <button
            className="button violet"
            onClick={() => {
              clearHistory();
              setConfirm(false);
            }}
          >
            Erase history
          </button>
          <button className="text-button" onClick={() => setConfirm(false)}>
            Keep my trail
          </button>
        </div>
      )}
    </section>
  );
}
