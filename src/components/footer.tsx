import Link from 'next/link';
import { ArrowUpRight, Aperture } from 'lucide-react';
export function Footer() {
  return (
    <footer className="footer">
      <div className="footer-top">
        <div>
          <Link href="/" className="logo">
            <Aperture size={28} />
            <span>cinevibz®</span>
          </Link>
          <p>
            For the feeling.
            <br />
            For the love of getting lost.
          </p>
        </div>
        <div className="footer-links">
          {['About', 'Contact', 'Privacy', 'Terms', 'Credits'].map((p) => (
            <Link href={'/info/' + p.toLowerCase()} key={p}>
              {p}
              <ArrowUpRight size={13} />
            </Link>
          ))}
        </div>
        <a className="back-top" href="#top">
          BACK TO THE SURFACE ↑
        </a>
      </div>
      <div className="footer-bottom">
        <span>FIND YOUR NEXT FEELING.</span>
        <p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
        <a
          href="https://www.themoviedb.org"
          target="_blank"
          rel="noreferrer"
          aria-label="The Movie Database"
        >
          <img src="/tmdb.svg" width="86" height="14" alt="TMDB" />
        </a>
      </div>
    </footer>
  );
}
