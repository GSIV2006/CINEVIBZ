# CineVibz

**Find your next feeling.** A functioning, guest-first entertainment discovery application built with Next.js App Router, TypeScript, Tailwind CSS, Framer Motion, and TMDB.

## Run it in VS Code

Open this folder in Visual Studio Code. In its terminal:

```bash
npm ci
cp .env.example .env.local # Only for a fresh clone; DO NOT overwrite your configured file.
# Put the TMDB API Read Access Token in .env.local.
npm run dev
```

Visit http://localhost:3000. Use Node.js 24 (also specified in `.nvmrc` and `package.json` for CI and Vercel). The installed dependency versions are pinned in `package.json` and `package-lock.json`.

Your configured `.env.local` stays on your computer and is ignored by Git. Fresh clones need their own token. **Never commit it, paste it into an issue, or use a `NEXT_PUBLIC_` prefix for the TMDB credential.**

## Environment

| Variable                 | Purpose                                          |
| ------------------------ | ------------------------------------------------ |
| `TMDB_READ_ACCESS_TOKEN` | Required server-only TMDB API Read Access Token. |

Obtain a token from https://www.themoviedb.org/settings/api. Use the **API Read Access Token**. See https://developer.themoviedb.org/docs/getting-started.

If the credential is missing, invalid, rate limited, or the provider is unavailable, the application shows a useful error instead of fabricated results. Guest lists and the sourced daily quiz continue to work.

## What works

- Natural-language mood interpretation, real catalogue retrieval, metadata enrichment, transparent scoring, diversity reranking, and evidence-based explanations.
- Hard filters for format, Japanese anime, animation, genre exclusions, original language, excluded language, release years/decades, and maximum runtime where explicitly expressed.
- Search with 400 ms debounce, exact-title priority, actor/director resolution, verified filmographies and provider pagination. Indian cinema uses production-country constraints; South Indian cinema adds regional original-language constraints. Peddi is accessible through exact search and Ram Charan’s credits.
- Dedicated title pages with exact record artwork, release date, runtime, genres, original title, cast, crew, rating source, and available related/similar records.
- Daily and weekly editions using Asia/Kolkata boundaries, actual theme-based retrieval, personalized daily selection, recent-repeat avoidance, per-title editorial notes and “Why This Today?”. Browser snapshots keep daily selections stable until midnight and weekly selections stable through Sunday. Separate popular, trending and less-seen feeds remain in the requested order.
- Guest watchlists, watched state, bounded feedback influence, preferred moods, history, local reset controls, and cross-tab storage synchronization.
- Real-catalogue roulette with animated reveal, six format choices, country/genre/language/release-period filters, session repeat exclusion, alternate-format fallback and useful empty-pool messages.
- Nine quiz categories, five questions per daily or replay attempt, linked explanations, saved answers, category progress, best scores and archived attempt review. The bank contains 427 question variants, using Academy ceremony facts and 61 verified TMDB records. Replaying a completed category automatically starts a fresh saved round, prioritising unseen questions; the result screen also offers Play a fresh round. Refresh resumes unfinished rounds. Questions can repeat across days.
- Today’s Feeling: a stable daily prompt, recommendations, saved favourite and completion. Quiz completion, exploring a daily pick and completing the challenge all share one daily streak, with current/longest totals.
- Your Rabbit Holes: local mood searches, explored/saved titles, roulette discoveries, quizzes and challenges, with revisit links, category filters and explicit erase/reset controls.
- A new cinema-club interface: cream paper hero, movable poster deck, shuffle/pause controls, lime/pink/violet accents, poster-rail navigation and mobile layouts.
- Responsive mobile navigation, keyboard controls, focus states, reduced motion, optimized/lazy-loaded title artwork, accessible status and error states.

## Recommendation architecture

1. `src/lib/recommendations/interpret.ts` translates known phrases into dimensions and constraints. Negated terms are separated; contradictions are returned to the user.
2. `taxonomy.ts` defines reusable signals, retrieval keywords and evidence vocabulary. This is a deterministic parser, not unrestricted natural-language understanding.
3. `retrieve.ts` resolves TMDB keyword IDs, searches separate discovery branches for each important signal, queries both formats as needed, retrieves multiple pages, and reserves candidates from each branch before enrichment. Typical requests inspect hundreds of candidates, with a maximum of 72 detailed records per request.
4. `rank.ts` rejects hard-filter violations, adult entries, and excluded feedback; scores explicit keyword/synopsis evidence; applies small bounded preference adjustments; and diversifies the result order.
5. Broad words such as “family”, “loss”, “city”, and “dream” receive less weight than explicit mood evidence. Contrary metadata lowers comfort scores. Specific Tokyo requests strongly penalize records without Tokyo evidence. Low-evidence results are omitted.
6. Each result exposes the supporting phrase and its source. Internal resonance scores are not probabilities or independently validated satisfaction estimates. Missing visual/pacing evidence is not invented.

A `CatalogueProvider` boundary exists in `src/lib/providers/index.ts` for future approved providers. AniList is deliberately not integrated; its permission requirements must be cleared before use. Supabase, authentication infrastructure and paid AI APIs are not needed in this initial version.

## Tests and quality reporting

```bash
npm test             # 120 tests, including 38 curated mood/constraint requests
npm run typecheck
npm run build
npm run verify
npm run format:check
```

Test fixtures are **28 actual TMDB records** and are used only by tests. No production component imports a fixture or a fake catalogue. To explicitly refresh those fixtures:

```bash
node --env-file=.env.local scripts/capture-fixtures.mjs
```

`tests/prompts.ts` contains diverse prompts, expected characteristics and illustrative reference titles. Running the tests writes `docs/recommendation-evaluation.json`, including constraint compliance, duplicates, metadata completeness, diversity and illustrative top-five title hits. `docs/live-integration-checks.json` records the live integration checks performed during implementation. `scripts/live-catalogue-regressions.mjs` checks the 15 reported search/recommendation regressions; `scripts/live-engagement-checks.mjs` checks daily curation, roulette and challenge integration. Their reports are saved in `docs/catalogue-regressions-live.json` and `docs/engagement-live-checks.json`. `docs/VALIDATION.md` explains the scope and limitations of the evidence.

Passing unit tests is not evidence of perfect recommendations. This release has a small regression corpus, sparse provider metadata and finite retrieval limits. Improve coverage by adding representative prompts and human-reviewed relevance judgments; preserve hard-filter and evidence invariants.

## Content controls

Adult-only TMDB entries are always excluded. Automatic recommendations in general mode additionally require a recognised US, UK or India certificate at or below the supported general/teen thresholds. Unrated and mature-rated titles are excluded from automatic recommendations by default. Catalogue search includes them so a known title is not silently hidden; its explicit “Family-friendly only” control applies the conservative filter. This is deliberately conservative and may omit relevant international films or anime. Guests can include mature/unverified ratings in their preferences. Ratings differ by region; the application is not a parental-control guarantee.

## Caching, cost and stability

All credential-bearing TMDB requests run on the server. Provider requests use Next.js fetch revalidation (normally one hour, detailed records one day), in-flight request deduplication, bounded concurrency, timeouts, and explicit 429 handling. Search is debounced and pagination is bounded to the provider's 500-page limit.

Collections use deterministic selection for the date/week and candidate set, followed by persisted browser snapshots. Existing daily picks remain fixed through the India day; weekly picks remain fixed through Sunday even when a new day fetches updated provider data. The two Guest content modes have separate editions. Recent snapshots influence repeat avoidance. Partial failures can retry missing content while preserving existing picks. Up to 28 daily and 12 weekly snapshots are retained with compact card metadata. These are local editions, not a global cloud editorial archive. Clearing local data or opening a new browser creates a new local edition. The server in-flight map is only for transient request deduplication.

No LLM API is called. Provider usage limits still apply. For a public launch, configure Vercel request protection/usage alerts appropriate to actual traffic.

## Deploy on Vercel

This folder is ready for a standard Next.js deployment. It has **not** been published by this implementation session.

1. Push this project to [GSIV2006/CINEVIBZ](https://github.com/GSIV2006/CINEVIBZ). See [the push and deployment guide](docs/DEPLOYMENT.md). `.env.local`, `.next` and `node_modules` are excluded by `.gitignore`.
2. Import that repository into Vercel, with Next.js as the framework and this folder as the project root.
3. Add `TMDB_READ_ACCESS_TOKEN` to the Vercel project environment for Production (and Preview if you want working previews) before deploying. The Contact page already contains the owner’s name, email, LinkedIn and Instagram links.
4. Deploy with the included `vercel.json` defaults: Next.js, Node.js 24, `npm ci`, and `npm run build`. Keep the root directory at the folder containing `package.json` and leave the output directory on the framework default. Test the live mood, search and detail endpoints.
5. Update the TMDB application URL to the deployed domain and review TMDB's current noncommercial/commercial terms before changing usage.

There are no external database migrations or authentication setup steps. Guest data belongs to the browser origin; moving from localhost to a hosted domain does not migrate localStorage automatically.

## GitHub checks

`.github/workflows/ci.yml` installs the lockfile dependencies and checks formatting, TypeScript, all offline tests and the production build on pushes to `main` and pull requests. The workflow needs no TMDB secret. The live catalogue scripts are separate because they depend on provider availability and a configured running app.

## Attribution

This product uses the TMDB API but is not endorsed or certified by TMDB. The official unmodified TMDB logo and notice are in the footer and Credits page. Poster and backdrop image paths come from the exact corresponding provider record. Catalogue artwork belongs to its respective rights holders.

Quiz facts link to the Academy's official ceremony records or the exact TMDB title record. The verification capture is in `docs/quiz-verification.json`. Fonts are Syne, Space Grotesk and Manrope. Icons are Lucide. The cinema eye and motion graphics are original HTML/CSS artwork, not fabricated film posters.
