'use client';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowUpRight, UserRound, Clapperboard } from 'lucide-react';
import { imagePath } from '@/lib/client';
import { COUNTRIES } from '@/lib/catalogue-intent';
import { LANGUAGES, type CatalogueResult } from '@/lib/types';
import { MediaCard, Notice } from './media';

export function CatalogueResults({
  data,
  compact = false,
}: {
  data: CatalogueResult;
  compact?: boolean;
}) {
  const person = data.person;
  return (
    <section aria-label="Catalogue results">
      {person ? (
        <div className="person-spotlight">
          <div className="person-portrait">
            {imagePath(person.image) ? (
              <Image src={imagePath(person.image)!} alt={person.name} fill sizes="120px" />
            ) : (
              <UserRound size={40} />
            )}
          </div>
          <div>
            <p className="eyebrow">THE PERSON YOU'RE LOOKING FOR / {person.department}</p>
            <h2>
              {person.name}
              <span>↗</span>
            </h2>
            <p>
              {data.totalResults} catalogue credits ·{' '}
              {person.department === 'Directing' ? 'Director' : 'Filmography'}
            </p>
          </div>
          <Clapperboard className="person-doodle" size={72} />
        </div>
      ) : (
        <div className="catalogue-heading">
          <p className="eyebrow">
            {data.intent === 'catalogue' ? 'YOUR CORNER OF CINEMA' : 'STRAIGHT FROM THE CATALOGUE'}
          </p>
          <h2>{data.heading}</h2>
        </div>
      )}
      <div className="catalogue-tags">
        {data.constraints.countries?.map((c) => (
          <span key={c}>{COUNTRIES[c] || c} productions</span>
        ))}
        {data.constraints.language && (
          <span>{LANGUAGES[data.constraints.language] || data.constraints.language} originals</span>
        )}
        {data.constraints.languages?.length && <span>Telugu · Tamil · Malayalam · Kannada</span>}
        <span>{data.results.length} titles on this page</span>
      </div>
      {data.people.length > 0 && !person && (
        <div className="people-matches">
          <p className="eyebrow">LOOKING FOR A PERSON?</p>
          <div>
            {data.people.map((p) => (
              <Link key={p.id} href={`/search?person=${p.id}&q=${encodeURIComponent(p.name)}`}>
                <UserRound size={18} />
                <span>
                  <strong>{p.name}</strong>
                  <small>{p.knownFor.join(' · ') || p.department}</small>
                </span>
                <ArrowUpRight size={16} />
              </Link>
            ))}
          </div>
        </div>
      )}
      {data.results.length ? (
        <div className="results-grid">
          {data.results.map((m) => (
            <MediaCard media={m} key={m.key} />
          ))}
        </div>
      ) : (
        <Notice
          message={
            person
              ? `No credits for ${person.name} match these filters. Clear a filter to see more of their filmography.`
              : 'No matching titles found. Try the exact title, an actor’s full name, or a cinema region. We won’t replace your search with unrelated popular films.'
          }
        />
      )}
      <p className="catalogue-note">
        {data.note}
        {data.partial ? ' Some detailed records were unavailable; results may be incomplete.' : ''}
      </p>
      {compact && data.totalPages > 1 && (
        <Link
          className="button outline catalogue-more"
          href={`/search?q=${encodeURIComponent(person?.name || data.heading)}${person ? '&person=' + person.id : ''}`}
        >
          Explore all results <ArrowUpRight size={16} />
        </Link>
      )}
    </section>
  );
}
