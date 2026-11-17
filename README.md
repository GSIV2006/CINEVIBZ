<img width="1708" height="902" alt="Screenshot 2026-11-17 at 10 50 11 PM" src="https://github.com/user-attachments/assets/646f2335-6592-4867-b2c1-fb6289eb9804" />

<img width="1709" height="810" alt="Screenshot 2026-11-17 at 10 50 35 PM" src="https://github.com/user-attachments/assets/c90fdd73-7ba6-4d9b-996d-596f4099334a" />

<img width="1699" height="957" alt="Screenshot 2026-11-17 at 10 50 53 PM" src="https://github.com/user-attachments/assets/de828ebb-f1bf-4d1a-a22a-aa89449286ca" />


 <div align="center">

# ✳ CineVibz

### Find your next feeling.

**Not sure what to watch? Don't choose a genre. Choose a feeling.**

A mood-driven entertainment discovery experience that helps you find movies, series, anime and more through the emotions, atmospheres and experiences you're looking for.

<br/>

[Explore CineVibz](https://github.com/GSIV2006/CINEVIBZ) · [Report an Issue](https://github.com/GSIV2006/CINEVIBZ/issues) · [Request a Feature](https://github.com/GSIV2006/CINEVIBZ/issues)

<br/>

![Next.js](https://img.shields.io/badge/Next.js-App_Router-000000?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-Styling-06B6D4?style=flat-square&logo=tailwindcss)
![TMDB](https://img.shields.io/badge/Data-TMDB-01B4E4?style=flat-square&logo=themoviedatabase)
![Vercel](https://img.shields.io/badge/Deployment-Vercel-000000?style=flat-square&logo=vercel)

</div>

---

## ◉ The idea

Sometimes you don't know what movie you want to watch.

You just know you want something that feels like:

- Walking through Tokyo at 2 AM.
- The last evening of a beautiful summer.
- A fever dream you can't quite remember.
- Something beautiful, but emotionally devastating.
- Being a kid again, without a care in the world.
- Questioning everything after the credits roll.

Traditional entertainment platforms ask you what genre you like.

**CineVibz asks you what you're feeling.**

Describe an atmosphere, an emotion, a memory or even a completely random thought. CineVibz interprets the feeling, explores its entertainment catalogue and finds titles that might capture it.

Because sometimes the best thing to watch is something you didn't even know existed.

---

## ✦ What you can do

### Discover by mood

The heart of CineVibz.

Describe what you want to experience in your own words and get recommendations ranked around your requested mood, atmosphere, themes and preferences.

No need to know the genre. No need to know the title. Just describe the feeling.

### Today's Rabbit Hole

A daily collection of entertainment worth getting lost in.

Discover a changing selection with individual editorial notes and a little explanation of why each title made today's cut.

###  The Weekly Cut

A weekly editorial selection built around a distinct theme.

A new collection every week, designed to take you beyond your usual watchlist.

###  Popular Choices & Trending Now

Explore established popular titles and currently trending entertainment through separate catalogue feeds.

###  Find Your Frequency

Explore curated moods and discover entertainment that matches different emotional and atmospheric experiences.

From nostalgic evenings to existential hours, there's a frequency for every mood.

###  Outside Your Algorithm

A space for discoveries beyond the obvious.

Explore international cinema, less-seen titles, unusual animation and entertainment you might otherwise scroll past.

### Watch Roulette

Can't decide? Let chance take over.

Spin for a random title from a real catalogue pool, with filters for format, genre, language, country and release period.

###  Daily Screen Test

A five-question entertainment quiz with multiple categories, explanations, saved progress and daily challenges.

###  Today's Feeling

A daily discovery challenge built around an unusual emotional or atmospheric prompt.

Find a title that captures the feeling, save your favourite and complete the challenge.

###  Your Rabbit Holes

Your personal discovery history.

Revisit previous mood searches, explored titles, saved entertainment, roulette discoveries and completed activities.

###  Your Watchlist

Save titles, mark them as watched and build a personal collection without needing to create an account.

---

##  The recommendation engine

Recommendations are what make CineVibz CineVibz.

The objective isn't to find titles that merely share a genre. It's to find titles that have meaningful connections to the experience a person describes.

The recommendation pipeline follows several stages:

| Stage | What happens |
|---|---|
| 01 — Interpret | Translate the user's prompt into mood dimensions and constraints. |
| 02 — Retrieve | Search the real catalogue for potential matches. |
| 03 — Enrich | Retrieve relevant metadata for candidate titles. |
| 04 — Rank | Evaluate mood, atmosphere, themes and other available evidence. |
| 05 — Diversify | Reduce repetitive results while preserving relevance. |
| 06 — Explain | Show the evidence behind each recommendation. |

### What influences a recommendation?

- Emotional tone
- Mood and atmosphere
- Themes and narrative signals
- Genre relevance
- Setting and visual evidence where available
- User preferences and feedback
- Explicit language, format and release constraints

The engine uses a deterministic interpretation and evidence-based ranking system. It does not call a paid LLM API for every recommendation.

Recommendations are not probabilities of user satisfaction. Their quality depends on catalogue metadata, retrieval coverage and the specificity of the request.

**The goal: relevance over popularity.**

A lesser-known title that genuinely fits the feeling should have a chance to rank above a mainstream title that barely matches.

---

##  Built with

CineVibz is built using a lightweight, modern web stack.

| Technology | Purpose |
|---|---|
| [Next.js](https://nextjs.org/) | Application framework and server-side routes |
| [TypeScript](https://www.typescriptlang.org/) | Type safety |
| [Tailwind CSS](https://tailwindcss.com/) | Styling |
| [Framer Motion](https://motion.dev/) | Animations and interactions |
| [Lucide](https://lucide.dev/) | Icons |
| [TMDB](https://www.themoviedb.org/) | Entertainment catalogue and metadata |
| [Vercel](https://vercel.com/) | Deployment |

### A note on the data

TMDB is the initial catalogue provider.

AniList is not currently integrated. Its API permission requirements need to be cleared before using it for this particular discovery service.

There is no paid LLM dependency in the initial implementation.

---

##  Getting started

Want to run CineVibz locally?

### Prerequisites

- Node.js 24 or later
- npm
- A TMDB API Read Access Token

### 1. Clone the repository

```bash
git clone https://github.com/GSIV2006/CINEVIBZ.git
cd CINEVIBZ
```

### 2. Install dependencies

```bash
npm ci
```

### 3. Configure your environment

Create a `.env.local` file in the root directory:

```env
TMDB_READ_ACCESS_TOKEN=your_tmdb_access_token
```

You can obtain your token from [TMDB Developer Settings](https://www.themoviedb.org/settings/api).

### 4. Start the development server

```bash
npm run dev
```

### 5. Open CineVibz

Visit:

[http://localhost:3000](http://localhost:3000)

**Keep your API credentials private.** Never commit `.env.local`, expose your token through frontend code or upload it to GitHub.

If the TMDB credential is unavailable or the provider fails, catalogue-dependent features display appropriate errors instead of fabricated results.

---

##  Testing & validation

CineVibz includes automated tests for its recommendation logic, catalogue integration and application functionality.

Run the following commands:

```bash
npm test
```

```bash
npm run typecheck
```

```bash
npm run build
```

```bash
npm run verify
```

```bash
npm run format:check
```

The current implementation includes:

- 120 automated tests.
- 38 curated mood and constraint requests.
- Test fixtures based on actual TMDB records.
- Recommendation evaluation reports.
- Live catalogue regression checks.
- Engagement feature integration checks.

Test fixtures are used for testing and are not imported into production catalogue components.

Passing tests does not guarantee perfect recommendations. The evaluation corpus is finite, and continued human review is necessary to improve relevance.

More detailed validation information is available in [`docs/VALIDATION.md`](docs/VALIDATION.md).

---

##  Behind the scenes

A few implementation decisions worth knowing:

**Catalogue integrity**

Titles, posters and metadata are tied to their corresponding provider records. The application avoids fabricated catalogue entries and unrelated poster substitutions.

**Caching**

TMDB requests use server-side caching, request deduplication, bounded concurrency, timeouts and rate-limit handling.

**Daily and weekly editions**

Daily collections use the Asia/Kolkata date boundary. Weekly collections remain stable through Sunday.

Browser snapshots preserve the editions locally. These are not globally synchronized editorial collections.

**Guest-first experience**

Watchlists, preferences, history, quiz progress and other personal activity are stored locally in the browser.

There is no account requirement or cloud synchronization in this initial version.

**Content controls**

Adult-only entries are excluded. Automatic recommendations apply conservative certification checks, which can sometimes exclude otherwise relevant international titles.

---

##  Project documentation

Additional technical information is available in the repository:

- [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) — Deployment instructions.
- [`docs/VALIDATION.md`](docs/VALIDATION.md) — Testing scope and limitations.
- [`docs/recommendation-evaluation.json`](docs/recommendation-evaluation.json) — Recommendation evaluation results.

---

##  Deployment

CineVibz is designed for deployment on Vercel.

The repository includes a Vercel configuration and a GitHub Actions workflow for automated checks.

To deploy:

1. Push the repository to GitHub.
2. Import it into Vercel.
3. Add `TMDB_READ_ACCESS_TOKEN` to the Vercel environment variables.
4. Deploy the application.

Once GitHub and Vercel are connected, future pushes to the production branch can trigger automatic deployments.

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) for the complete instructions.

---

##  Current limitations

CineVibz is an evolving personal project. A few things are intentionally limited in its initial version:

- Catalogue coverage depends on TMDB and its available metadata.
- Mood interpretation is deterministic rather than unrestricted AI language understanding.
- Recommendation quality varies with the evidence available for each title.
- Watchlists and user preferences are stored locally, not synchronized across devices.
- Daily and weekly editions are browser-local rather than a shared global archive.
- AniList integration is pending permission clarification.

These are known boundaries, not features being presented as completed functionality.

---

##  Credits & attribution

Entertainment metadata and images are provided through the [TMDB API](https://www.themoviedb.org/).

<div align="center">

This product uses the TMDB API but is not endorsed or certified by TMDB.

</div>

Film artwork, posters and backdrops belong to their respective rights holders.

Quiz facts are linked to official Academy ceremony records or the corresponding TMDB title records.

Fonts used: Syne, Space Grotesk and Manrope.

Icons: Lucide.

---

##  A little about the project

CineVibz started with a simple thought:

What if finding something to watch felt more like discovering music, exploring a moodboard or falling into a random internet rabbit hole?

Instead of endlessly scrolling through genres and ratings, what if you could just describe a feeling?

That's the experience I'm trying to build.

CineVibz is an independent personal project, built to explore the intersection of entertainment discovery, recommendation systems and expressive web design.

If you find something interesting, have an idea or spot something that could be better, feel free to open an issue.

<br/>

<div align="center">

### Don't just find something to watch.

### Find your next feeling.

**CineVibz ✳**

</div>
