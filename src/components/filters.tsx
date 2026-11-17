'use client';
import { GENRES, LANGUAGES } from '@/lib/types';
import { COUNTRIES } from '@/lib/catalogue-intent';
export type Filters = {
  type: string;
  genre: string;
  language: string;
  year: string;
  country: string;
  release: string;
  from: string;
  to: string;
};
export const emptyFilters: Filters = {
  type: '',
  genre: '',
  language: '',
  year: '',
  country: '',
  release: '',
  from: '',
  to: '',
};
export function FilterBar({
  value,
  onChange,
  id = 'filter',
  period = false,
}: {
  value: Filters;
  onChange: (f: Filters) => void;
  id?: string;
  period?: boolean;
}) {
  return (
    <div className="filter-bar">
      <label htmlFor={id + 'type'}>
        <span>Format</span>
        <select
          id={id + 'type'}
          value={value.type}
          onChange={(e) => onChange({ ...value, type: e.target.value })}
        >
          <option value="">Any format</option>
          <option value="movie">Movies</option>
          <option value="tv">Series</option>
          <option value="anime">Anime</option>
          <option value="animation">Animation</option>
          <option value="documentary">Documentaries</option>
        </select>
      </label>
      <label htmlFor={id + 'genre'}>
        <span>Genre</span>
        <select
          id={id + 'genre'}
          value={value.genre}
          onChange={(e) => onChange({ ...value, genre: e.target.value })}
        >
          <option value="">Any genre</option>
          {Object.entries(GENRES)
            .filter(([id]) => +id < 10760)
            .map(([id, name]) => (
              <option key={id} value={id}>
                {name}
              </option>
            ))}
        </select>
      </label>
      <label htmlFor={id + 'country'}>
        <span>Country of origin</span>
        <select
          id={id + 'country'}
          value={value.country}
          onChange={(e) => onChange({ ...value, country: e.target.value })}
        >
          <option value="">Anywhere</option>
          {Object.entries(COUNTRIES).map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </label>
      <label htmlFor={id + 'language'}>
        <span>Language</span>
        <select
          id={id + 'language'}
          value={value.language}
          onChange={(e) => onChange({ ...value, language: e.target.value })}
        >
          <option value="">Any language</option>
          {Object.entries(LANGUAGES).map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </label>
      {!period && (
        <label htmlFor={id + 'year'}>
          <span>Release year</span>
          <input
            id={id + 'year'}
            type="number"
            min="1900"
            max="2100"
            placeholder="Any year"
            value={value.year}
            onChange={(e) => onChange({ ...value, year: e.target.value })}
          />
        </label>
      )}
      {period &&
        (['from', 'to'] as const).map((field) => (
          <label key={field} htmlFor={id + field}>
            <span>Release {field}</span>
            <input
              id={id + field}
              type="number"
              min="1900"
              max="2100"
              placeholder={field === 'from' ? 'Any start' : 'Any end'}
              value={value[field]}
              onChange={(e) => onChange({ ...value, [field]: e.target.value })}
            />
          </label>
        ))}
      <label htmlFor={id + 'release'}>
        <span>Release</span>
        <select
          id={id + 'release'}
          value={value.release}
          onChange={(e) => onChange({ ...value, release: e.target.value })}
        >
          <option value="">All releases</option>
          <option value="released">Released</option>
          <option value="upcoming">Upcoming</option>
        </select>
      </label>
    </div>
  );
}
