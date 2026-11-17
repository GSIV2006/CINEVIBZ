'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { api, imagePath } from '@/lib/client';
import type { Media } from '@/lib/types';
import { LANGUAGES } from '@/lib/types';
import { useStore } from './store';
import { Loading, Notice, Poster, SaveButton, FeedbackActions, MediaRail } from './media';
export function Detail({ type, id }: { type: string; id: string }) {
  const [media, setMedia] = useState<Media | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const { state, ready, record } = useStore();
  useEffect(() => {
    if (!ready) return;
    let active = true;
    setError('');
    setMedia(null);
    api<Media>(`/api/title/${type}/${id}?mature=${state.preferences.allowMature}`)
      .then((m) => {
        if (active) {
          setMedia(m);
          record('title', m.title, `/title/${m.type}/${m.id}`);
        }
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, [type, id, ready, attempt, state.preferences.allowMature, record]);
  useEffect(() => {
    if (media && window.location.hash === '#related')
      document.getElementById('related')?.scrollIntoView({ behavior: 'smooth' });
  }, [media]);
  if (error)
    return (
      <main id="main" className="page-shell">
        <Notice message={error} retry={() => setAttempt((n) => n + 1)} />
        <Link className="text-button" href="/profile">
          Content preferences ↗
        </Link>
      </main>
    );
  if (!media)
    return (
      <main id="main">
        <Loading text="Opening the title…" />
      </main>
    );
  const m = media;
  return (
    <main id="main" className="detail-page">
      <div className="detail-backdrop">
        <Poster media={m} wide priority />
      </div>
      <div className="detail-main">
        <div className="detail-poster">
          <Poster media={m} />
          <SaveButton media={m} large />
        </div>
        <div className="detail-copy">
          <p className="eyebrow">
            {m.type === 'movie' ? 'A FILM' : 'A SERIES'} / {m.genreNames.join(' · ')}
          </p>
          <h1>{m.title}</h1>
          {m.originalTitle !== m.title && <p className="alternate">{m.originalTitle}</p>}
          <div className="detail-meta">
            <span>{m.date || 'Release date unavailable'}</span>
            <span>
              {m.runtime
                ? `${m.runtime} min${m.type === 'tv' ? ' / episode' : ''}`
                : 'Runtime unavailable'}
            </span>
            <span>
              {m.rating !== null
                ? `${m.rating.toFixed(1)}/10 TMDB · ${m.votes.toLocaleString()} votes`
                : 'No TMDB rating'}
            </span>
          </div>
          <p className="synopsis">
            {m.overview || 'TMDB does not currently have a synopsis for this title.'}
          </p>
          <FeedbackActions media={m} />
          <p className="content-rating">
            Content rating:{' '}
            {m.certification
              ? `${m.certification.rating} (${m.certification.country})`
              : 'Unverified'}
            . Ratings differ by region; check local guidance before watching with children.
          </p>
          <dl className="detail-facts">
            <div>
              <dt>Original language</dt>
              <dd>{LANGUAGES[m.language] || m.language || 'Unknown'}</dd>
            </div>
            <div>
              <dt>Country</dt>
              <dd>{m.countries.join(', ') || 'Unavailable'}</dd>
            </div>
            {m.seasons && (
              <div>
                <dt>Seasons / episodes</dt>
                <dd>
                  {m.seasons} / {m.episodes || 'Unknown'}
                </dd>
              </div>
            )}
            {m.crew
              ?.filter((p) => p.job === 'Director')
              .map((p) => (
                <div key={p.name}>
                  <dt>Director</dt>
                  <dd>{p.name}</dd>
                </div>
              ))}
            <div>
              <dt>Record</dt>
              <dd>
                <a
                  target="_blank"
                  rel="noreferrer"
                  href={`https://www.themoviedb.org/${m.type}/${m.id}`}
                >
                  View on TMDB ↗
                </a>
              </dd>
            </div>
          </dl>
        </div>
      </div>
      {!!m.cast?.length && (
        <section className="section">
          <p className="eyebrow">THE PEOPLE IN THE FRAME</p>
          <h2>Cast & characters.</h2>
          <div className="cast-list">
            {m.cast.map((p, i) => (
              <div key={p.name + i} className="cast-person">
                {imagePath(p.image) ? (
                  <Image src={imagePath(p.image)!} alt={p.name} width={185} height={278} />
                ) : (
                  <div className="cast-fallback">{p.name.slice(0, 1)}</div>
                )}
                <Link
                  href={`/search?q=${encodeURIComponent(p.name)}${p.id ? '&person=' + p.id : ''}`}
                >
                  {p.name} ↗
                </Link>
                <small>{p.character}</small>
              </div>
            ))}
          </div>
        </section>
      )}
      {!!m.crew?.length && (
        <section className="section">
          <h2>Behind the camera.</h2>
          <dl className="detail-facts">
            {m.crew.map((p, i) => (
              <div key={i}>
                <dt>{p.job}</dt>
                <dd>{p.name}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}
      {!!m.related?.length && (
        <section id="related" className="section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">ANOTHER DOOR OPENS</p>
              <h2>Related discoveries.</h2>
              <p>Recommendations from TMDB.</p>
            </div>
          </div>
          <MediaRail items={m.related} />
        </section>
      )}
      {!!m.similar?.length && (
        <section className="section">
          <div className="section-heading">
            <div>
              <h2>In a similar orbit.</h2>
              <p>Similar titles from TMDB.</p>
            </div>
          </div>
          <MediaRail items={m.similar} />
        </section>
      )}
    </main>
  );
}
