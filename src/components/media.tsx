'use client';
import Image from 'next/image';
import Link from 'next/link';
import { useState, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { LANGUAGES } from '@/lib/types';
import { dateKey } from '@/lib/dates';
import { Plus, Check, ArrowUpRight, Film, ThumbsUp, ThumbsDown, Eye } from 'lucide-react';
import type { Media, Recommendation } from '@/lib/types';
import { imagePath } from '@/lib/client';
import { useStore } from './store';
export function Poster({
  media,
  wide = false,
  priority = false,
}: {
  media: Media;
  wide?: boolean;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const url = imagePath(wide ? media.backdrop : media.poster, wide ? 'w1280' : 'w500');
  return (
    <div className={wide ? 'poster-image wide' : 'poster-image'}>
      {url && !failed ? (
        <Image
          src={url}
          alt={wide ? `${media.title} backdrop` : `${media.title} poster`}
          fill
          sizes={
            wide
              ? '(max-width: 768px) 100vw, 70vw'
              : '(max-width: 600px) 46vw, (max-width: 1000px) 30vw, 20vw'
          }
          priority={priority}
          onError={() => setFailed(true)}
        />
      ) : (
        <div className="poster-fallback">
          <Film />
          <span>{media.title}</span>
          <small>Artwork unavailable</small>
        </div>
      )}
    </div>
  );
}
export function SaveButton({ media, large = false }: { media: Media; large?: boolean }) {
  const { state, save } = useStore();
  const saved = state.watchlist.some((m) => m.key === media.key);
  return (
    <button
      className={large ? 'button cream' : 'save-button'}
      aria-label={`${saved ? 'Remove' : 'Save'} ${media.title}${saved ? ' from' : ' to'} watchlist`}
      aria-pressed={saved}
      onClick={() => save(media)}
    >
      {saved ? <Check size={18} /> : <Plus size={18} />}{' '}
      {large && (saved ? 'In your watchlist' : 'Save for later')}
    </button>
  );
}
export function MediaCard({
  media,
  index,
  reason,
}: {
  media: Media;
  index?: number;
  reason?: string;
}) {
  return (
    <motion.article
      className="media-card"
      whileHover={{ y: -7 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
    >
      <div className="poster-wrap">
        <Link href={`/title/${media.type}/${media.id}`} className="poster-link">
          <Poster media={media} />
          <span className="poster-open">
            <ArrowUpRight />
          </span>
        </Link>
        <SaveButton media={media} />
        {(media.date > dateKey() || !media.date) && (
          <span className="release-badge">{media.date ? 'COMING SOON' : 'DATE NOT LISTED'}</span>
        )}
        {index !== undefined && (
          <span className="card-number">{String(index + 1).padStart(2, '0')}</span>
        )}
      </div>
      <div className="media-meta">
        <span>
          {media.year || 'Year unavailable'} · {media.type === 'movie' ? 'FILM' : 'SERIES'}
        </span>
        <span>{media.rating !== null ? `${media.rating.toFixed(1)} TMDB` : 'Unrated'}</span>
      </div>
      <Link className="card-title" href={`/title/${media.type}/${media.id}`}>
        {media.title}
      </Link>
      <p className="card-genre">{media.genreNames.slice(0, 2).join(' / ')}</p>
      <p className="card-language">
        {LANGUAGES[media.language] || media.language.toUpperCase()}{' '}
        {media.countries.includes('IN') ? '· India' : ''}
        {media.date > dateKey() ? ' · Upcoming' : !media.date ? ' · Date unavailable' : ''}
      </p>
      {media.credit && <p className="card-credit">{media.credit}</p>}
      {media.editorial && (
        <div className="card-editorial">
          <span>{media.editorial.theme}</span>
          <p>{media.editorial.hook}</p>
          <p className="card-synopsis">
            {media.overview || 'A synopsis is not available for this record.'}
          </p>
          <details>
            <summary>
              {media.editorial.period === 'daily' ? 'Why This Today?' : 'Why this weekly cut?'}
            </summary>
            <p>{media.editorial.why}</p>
          </details>
        </div>
      )}
      {reason && <p className="card-reason">{reason}</p>}
    </motion.article>
  );
}
export function FeedbackActions({ media }: { media: Media }) {
  const { feedback, state } = useStore();
  const chosen = (kind: string) =>
    state.preferences.feedback.some((f) => f.key === media.key && f.kind === kind);
  const prompt =
    [...media.keywords.slice(0, 3)].join(', ') || media.genreNames.slice(0, 2).join(' ');
  return (
    <div className="feedback-actions">
      <button onClick={() => feedback(media, 'like')} aria-pressed={chosen('like')}>
        <ThumbsUp size={14} /> My vibe
      </button>
      <button
        onClick={() => feedback(media, 'dislike')}
        aria-pressed={chosen('dislike')}
        title="Less like this"
      >
        <ThumbsDown size={14} /> Not my vibe
      </button>
      <button onClick={() => feedback(media, 'watched')} aria-pressed={chosen('watched')}>
        <Eye size={14} /> Watched
      </button>
      <Link
        onClick={() => feedback(media, 'like')}
        href={`/title/${media.type}/${media.id}#related`}
      >
        More like this <ArrowUpRight size={13} />
      </Link>
    </div>
  );
}
export function RecommendationCard({ media, index }: { media: Recommendation; index: number }) {
  return (
    <article className="recommendation-card">
      <div className="rec-art">
        <Link href={`/title/${media.type}/${media.id}`}>
          <Poster media={media} />
        </Link>
        <SaveButton media={media} />
      </div>
      <div className="rec-copy">
        <div className="eyebrow">
          {String(index + 1).padStart(2, '0')} / <span>{media.match}</span>
        </div>
        <Link href={`/title/${media.type}/${media.id}`}>
          <h3>{media.title}</h3>
        </Link>
        <p className="muted">
          {media.year || 'Year unavailable'} · {media.type === 'movie' ? 'Film' : 'Series'} ·{' '}
          {media.genreNames.join(' / ')} · {media.rating?.toFixed(1) || '—'}/10 TMDB
        </p>
        <p className="rec-synopsis">{media.overview || 'No synopsis available from TMDB.'}</p>
        <div className="match-evidence">
          <span className="match-score">
            {media.score}
            <small>
              /100
              <br />
              resonance
            </small>
          </span>
          <p>{media.explanation}</p>
        </div>
        <FeedbackActions media={media} />
      </div>
    </article>
  );
}
export function MediaRail({
  items,
  numbered = false,
  reason,
}: {
  items: Media[];
  numbered?: boolean;
  reason?: (m: Media) => string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const scroll = (direction: number) =>
    ref.current?.scrollBy({
      left: direction * ref.current.clientWidth * 0.8,
      behavior: reduced ? 'instant' : 'smooth',
    });
  return (
    <div className="rail-shell">
      <div className="rail-controls">
        <span>FIND A NEW FIXATION</span>
        <div>
          <button onClick={() => scroll(-1)} aria-label="Scroll titles left">
            ←
          </button>
          <button onClick={() => scroll(1)} aria-label="Scroll titles right">
            →
          </button>
        </div>
      </div>
      <div className="media-rail" ref={ref}>
        {items.map((m, i) => (
          <MediaCard media={m} key={m.key} index={numbered ? i : undefined} reason={reason?.(m)} />
        ))}
      </div>
    </div>
  );
}
export function Loading({ text = 'Tuning into the catalogue…' }: { text?: string }) {
  return (
    <div className="loading-state" role="status">
      <span className="loader" />
      <p>{text}</p>
    </div>
  );
}
export function Notice({ message, retry }: { message: string; retry?: () => void }) {
  return (
    <div className="notice" role="status">
      <span className="notice-star">✳</span>
      <div>
        <h3>A brief intermission.</h3>
        <p>{message}</p>
        {retry && (
          <button className="text-button" onClick={retry}>
            Try again ↗
          </button>
        )}
      </div>
    </div>
  );
}
