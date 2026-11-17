import { notFound } from 'next/navigation';
import Link from 'next/link';
const content: Record<string, { title: string; body: React.ReactNode }> = {
  about: {
    title: 'For the feeling.',
    body: (
      <>
        <p>
          CineVibz is an independent experiment in entertainment discovery. People do not always
          know what they want to watch. Sometimes they only know how they want to feel.
        </p>
        <h2>How a feeling becomes a film</h2>
        <p>
          We interpret mood, atmosphere, themes, setting and explicit constraints, retrieve real
          catalogue candidates, enrich their metadata, and rank the evidence. Genre is one signal
          among many. Your feedback makes small, bounded adjustments.
        </p>
        <p>
          Resonance scores are internal relevance scores, not probabilities. TMDB descriptions are
          incomplete, especially for visual style and pacing. An honest partial match is more useful
          than an invented explanation.
        </p>
        <p>
          Your daily edition stays saved in this browser until midnight in India. The Weekly Cut
          stays through Sunday and changes on Monday. Themes shape the catalogue search, with
          variety and recent discovery history guiding selection. New browsers can receive a
          different edition.
        </p>
        <p>
          Popular Choices uses TMDB popularity. Trending uses its daily trending endpoint. The
          sections exclude overlapping titles. Popularity itself changes over time and is not a
          lifetime audience measure.
        </p>
      </>
    ),
  },
  privacy: {
    title: 'Your watchlist is yours.',
    body: (
      <>
        <p>
          CineVibz stores watchlists, preferences, feedback, discovery history and daily quiz
          progress, challenges, streaks and daily editions in localStorage on this browser. Roulette
          avoids repeats using sessionStorage for this tab. No account is needed, and there is no
          cloud sync in this version.
        </p>
        <p>
          Mood prompts and lightweight preferences are sent to the CineVibz server to compute
          recommendations. Catalogue queries are sent from the server to TMDB. We do not send your
          complete watchlist to TMDB. Hosting providers may retain routine request logs.
        </p>
        <p>
          Poster requests use TMDB image infrastructure. The site contains no advertising or
          analytics tracking code. Fonts are served by this application after being downloaded at
          build time.
        </p>
        <p>
          Clearing site data or using “Clear all local data” in Guest settings removes your local
          history and watchlist. Private browsing and browser storage limits may prevent
          persistence.
        </p>
        <Link href="/profile">Manage local data ↗</Link>
      </>
    ),
  },
  terms: {
    title: 'A few ground rules.',
    body: (
      <>
        <p>
          CineVibz is an entertainment discovery tool. Recommendations reflect incomplete catalogue
          evidence and your preferences; they are not guarantees of enjoyment or suitability.
        </p>
        <p>
          Film, series and image rights remain with their respective owners. Catalogue metadata and
          images are provided through TMDB. This site does not host films, sell streaming access, or
          promise streaming availability.
        </p>
        <p>
          Age ratings vary by country. Automatic recommendations use the Guest content preference;
          catalogue search includes mature and unrated records unless Family-friendly only is
          selected. These controls cannot replace a parent or guardian's judgment. Adult-only TMDB
          entries are excluded throughout the application.
        </p>
        <p>
          This initial project is intended for personal, noncommercial use. Commercial publication
          requires reviewing applicable provider terms and licensing.
        </p>
      </>
    ),
  },
  credits: {
    title: 'Nothing exists in isolation.',
    body: (
      <>
        <h2>Catalogue & images</h2>
        <img src="/tmdb.svg" width="130" height="18" alt="TMDB" />
        <p>
          <a href="https://www.themoviedb.org" target="_blank" rel="noreferrer">
            The Movie Database (TMDB)
          </a>{' '}
          provides catalogue records, ratings, poster and backdrop image paths, cast and crew
          metadata. This product uses the TMDB API but is not endorsed or certified by TMDB.
        </p>
        <p>
          TMDB ratings use a ten-point scale. Missing images receive a designed fallback. There are
          no generated film posters or fabricated catalogue records.
        </p>
        <h2>Daily Screen Test</h2>
        <p>
          Quiz answers are checked against the Academy's official ceremony records and TMDB title
          details and credits. Each answered question includes its source link. A small maintained
          question bank means questions can repeat across days.
        </p>
        <h2>Built with</h2>
        <p>
          Next.js, React, TypeScript, Tailwind CSS, Framer Motion and Lucide. Typography: Syne,
          Space Grotesk and Manrope. The recommendation engine runs without an LLM API.
        </p>
        <p>
          AniList is not integrated. Any future integration must first clear its permission
          requirements.
        </p>
      </>
    ),
  },
  contact: {
    title: 'Keep the conversation going.',
    body: (
      <>
        <p>Found your next obsession? Have an idea for CineVibz? I’d love to hear it.</p>
        <section className="contact-card" aria-labelledby="contact-name">
          <div className="contact-card-top">
            <span>THE PERSON BEHIND CINEVIBZ</span>
            <span aria-hidden="true">✳</span>
          </div>
          <h2 id="contact-name">G S I Venkat</h2>
          <p>For film conversations, feedback and a little creative chaos.</p>
          <a className="contact-email" href="mailto:gsiv2006@gmail.com">
            <span>
              <small>DROP ME A LINE</small>gsiv2006@gmail.com
            </span>
            <span aria-hidden="true">↗</span>
          </a>
          <div className="contact-socials">
            <a
              href="https://www.linkedin.com/in/gsi-venkat-9a02083a3"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>
                <small>LINKEDIN</small>G S I Venkat
              </span>
              <span aria-hidden="true">↗</span>
            </a>
            <a
              href="https://www.instagram.com/ven_kat_10/#"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>
                <small>INSTAGRAM</small>@ven_kat_10
              </span>
              <span aria-hidden="true">↗</span>
            </a>
          </div>
        </section>
        <p>
          For inaccurate film metadata, use the linked TMDB record on the title page. For a poor
          recommendation, use “Not my vibe” so your future recommendations can adjust.
        </p>
      </>
    ),
  },
};
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const entry = content[slug];
  if (!entry) notFound();
  return (
    <main id="main" className="page-shell prose">
      <p className="eyebrow">CINEVIBZ / {slug}</p>
      <h1>{entry.title}</h1>
      {entry.body}
    </main>
  );
}
