'use client';
import { useEffect, useState, useRef } from 'react';
import { dateKey, weekKey } from '@/lib/dates';
import { useDay } from './use-day';
import { TodaysFeeling, RabbitHistory } from './engagement';
import Link from 'next/link';
import { ArrowUpRight, ArrowRight, Plus } from 'lucide-react';
import { Hero, Frequency } from './hero';
import { Roulette } from './roulette';
import { Quiz } from './quiz';
import { MediaRail, Loading, Notice, Poster, SaveButton } from './media';
import { api } from '@/lib/client';
import type { HomeData } from '@/lib/types';
import { useStore } from './store';
function Heading({
  n,
  title,
  subtitle,
  href,
  label = 'Explore the catalogue',
}: {
  n: string;
  title: string;
  subtitle: string;
  href?: string;
  label?: string;
}) {
  return (
    <div className="section-heading">
      <div>
        <p className="eyebrow">{n}</p>
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>
      {href && (
        <Link className="text-button" href={href}>
          {label}
          <ArrowUpRight size={17} />
        </Link>
      )}
    </div>
  );
}
export function Home() {
  const [data, setData] = useState<HomeData | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const { state, ready, cacheHome, markDay } = useStore();
  const day = useDay(),
    mode = String(state.preferences.allowMature),
    snapshot = state.homeSnapshots[day + ':' + mode];
  const stateRef = useRef(state);
  stateRef.current = state;
  useEffect(() => {
    if (!ready || !day) return;
    if (snapshot && !(snapshot.partial && attempt > 0)) {
      setData(snapshot);
      setBusy(false);
      return;
    }
    let active = true;
    setBusy(true);
    setError('');
    api<HomeData>('/api/home', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        preferences: stateRef.current.preferences,
        recent: Object.values(stateRef.current.homeSnapshots)
          .flatMap((h) => h.daily.map((m) => m.key))
          .slice(-250),
        weekly:
          stateRef.current.weeklySnapshots[weekKey() + ':' + mode]?.items.map((m) => m.key) || [],
      }),
    })
      .then((d) => {
        if (active) {
          setAttempt(0);
          cacheHome(d, mode);
          setData(d);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      })
      .finally(() => {
        if (active) setBusy(false);
      });
    return () => {
      active = false;
    };
  }, [ready, mode, day, snapshot, cacheHome, attempt]);
  const empty = (
    <p className="section-empty">
      No titles passed the current content filters in this collection. Try another discovery or
      review your Guest settings.
    </p>
  );
  return (
    <main id="main">
      <Hero
        films={
          data
            ? [
                ...data.daily,
                ...data.popular.filter((m) => !data.daily.some((d) => d.key === m.key)),
              ]
            : []
        }
      />
      <div className="ticker" aria-hidden="true">
        <div>
          GOOD FILMS. STRANGE FEELINGS. <span>✳</span> FOLLOW THE FEELING. <span>✳</span> GOOD
          FILMS. STRANGE FEELINGS. <span>✳</span> FOLLOW THE FEELING. <span>✳</span>
        </div>
      </div>
      <section className="section rabbit-section" id="rabbit-hole">
        <Heading
          n="01 / A DAILY DETOUR"
          title="Today's rabbit hole."
          subtitle="A fresh edition, made for your trail. Yours until midnight in India."
        />
        {busy ? (
          <Loading text="Opening today's doors…" />
        ) : error ? (
          <Notice message={error} retry={() => setAttempt((a) => a + 1)} />
        ) : data?.daily.length ? (
          <div
            onClick={(e) => {
              if ((e.target as HTMLElement).closest('a[href^="/title/"]'))
                markDay('rabbit-hole', data.dayKey);
            }}
          >
            <MediaRail items={data.daily} numbered />
          </div>
        ) : (
          empty
        )}
        <div className="collection-footnote">
          <span>OPEN A PICK TO ADD TODAY TO YOUR STREAK.</span>
          <span>{data?.dayKey || 'DAILY'} / IST</span>
        </div>
      </section>
      <section className="weekly-section" id="weekly">
        <div className="weekly-label">
          <span>02 / THE WEEKLY CUT</span>
          <span>AN EDITION FOR THE CURIOUS</span>
        </div>
        <div className="weekly-body">
          <div className="weekly-copy">
            <div className="issue-mark">
              CV<span>EDITIONS</span>
            </div>
            <h2>{data?.weeklyTheme || 'A new way to see.'}</h2>
            <p>
              {data?.weeklyDescription ||
                'One theme. A handful of perspectives. A collection to spend the week with.'}
            </p>
            <a className="button dark" href="#weekly-titles">
              Explore this week's cut <ArrowUpRight size={19} />
            </a>
            <span className="weekly-date">
              WEEK OF {data?.weekKey || 'THIS MONDAY'} · ASIA/KOLKATA
            </span>
          </div>
          <div className="weekly-visual">
            {data?.weekly[0] ? (
              <>
                <Link href={`/title/${data.weekly[0].type}/${data.weekly[0].id}`}>
                  <Poster media={data.weekly[0]} wide />
                </Link>
                <span className="weekly-feature-name">
                  {data.weekly[0].title} <ArrowUpRight size={18} />
                </span>
                <span className="editor-stamp">
                  A DIFFERENT
                  <br />
                  POINT OF VIEW
                  <br />↗
                </span>
              </>
            ) : (
              <div className="weekly-abstract" aria-hidden="true">
                <div />
                <div />
                <span>
                  LOOK
                  <br />
                  AGAIN.
                </span>
              </div>
            )}
          </div>
        </div>
        <div id="weekly-titles" className="weekly-titles">
          {data?.weekly.length ? (
            <MediaRail items={data.weekly} />
          ) : (
            <p>
              {busy
                ? 'Assembling this edition…'
                : 'The weekly collection appears here when the catalogue is available.'}
            </p>
          )}
        </div>
      </section>
      <section className="section">
        <Heading
          n="03 / THE SHARED OBSESSIONS"
          title="Popular for a reason."
          subtitle="The titles everyone keeps coming back to."
          href="/search"
        />
        {data?.popular.length ? <MediaRail items={data.popular} /> : busy ? <Loading /> : empty}
      </section>
      <section className="section trending-section">
        <Heading
          n="04 / RIGHT HERE, RIGHT NOW"
          title="In the conversation."
          subtitle="Today's trending titles. Catch the current."
          href="/search"
        />
        {data?.trending.length ? (
          <MediaRail items={data.trending} numbered />
        ) : busy ? (
          <Loading />
        ) : (
          empty
        )}
      </section>
      <Frequency />
      <section className="section outside-section">
        <Heading
          n="06 / TAKE THE SCENIC ROUTE"
          title="Outside your algorithm."
          subtitle="Less noise. More discovery. Take a chance on something unfamiliar."
          href="/search"
        />
        {data?.outside.length ? (
          <MediaRail
            items={data.outside}
            reason={(m) =>
              `${m.votes.toLocaleString()} TMDB votes · ${m.rating?.toFixed(1)}/10. A quieter corner of the catalogue.`
            }
          />
        ) : busy ? (
          <Loading />
        ) : (
          empty
        )}
        <p className="catalogue-note">
          Selected from titles with 50–1,500 TMDB votes and a rating of at least 6, ordered toward
          lower popularity. “Less seen” is relative to this catalogue.
        </p>
      </section>
      <Roulette />
      <Quiz />
      <TodaysFeeling />
      <RabbitHistory />
      {data?.partial && (
        <p className="partial-note" role="status">
          Some catalogue requests were unavailable. Your existing picks stay saved.
          <button className="text-button" onClick={() => setAttempt((a) => a + 1)}>
            Retry missing collections
          </button>
        </p>
      )}
    </main>
  );
}
