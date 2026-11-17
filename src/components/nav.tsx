'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { ArrowUpRight, Search, Menu, X, Aperture, Bookmark } from 'lucide-react';
import { useStore } from './store';
export function Nav() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const { state } = useStore();
  const links = [
    ['Discover', '/'],
    ['Movies', '/search?type=movie'],
    ['Indian cinema', '/search?q=Indian'],
    ['Series', '/search?type=tv'],
    ['Anime', '/search?type=anime'],
  ];
  return (
    <header className="navigation">
      <Link href="/" className="logo" aria-label="CineVibz home">
        <Aperture size={30} strokeWidth={2.5} />
        <span>
          cinevibz<span className="logo-dot">®</span>
        </span>
      </Link>
      <nav className={open ? 'nav-links is-open' : 'nav-links'} aria-label="Main navigation">
        {links.map(([label, href]) => (
          <Link
            onClick={() => setOpen(false)}
            className={path === '/' && href === '/' ? 'active' : ''}
            href={href}
            key={label}
          >
            {label}
          </Link>
        ))}
        <Link href="/watchlist" onClick={() => setOpen(false)} className="watch-nav">
          Watchlist <span>{state.watchlist.length.toString().padStart(2, '0')}</span>
        </Link>
        <Link href="/#screen-test" onClick={() => setOpen(false)} className="quiz-nav">
          Daily Screen Test <ArrowUpRight size={13} />
        </Link>
      </nav>
      <div className="nav-actions">
        <Link href="/search" className="icon-button" aria-label="Search the catalogue">
          <Search size={20} />
        </Link>
        <Link href="/profile" className="guest-button">
          <span className="status-dot" /> Guest <ArrowUpRight size={14} />
        </Link>
        <button
          className="icon-button menu-button"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>
    </header>
  );
}
