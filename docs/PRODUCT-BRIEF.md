# CINEVIBZ — MASTER PRODUCT DEVELOPMENT PROMPT

## Project identity

Build **CineVibz** — an experimental, mood-driven entertainment discovery platform.

**Tagline:** Find your next feeling.

CineVibz helps people discover movies, anime, animated films, TV shows, documentaries, and international cinema based on how they want to feel rather than simply selecting a genre.

The central philosophy:

**People don't always know what they want to watch. They know what they want to experience.**

Examples:

- "Something that feels like a fever dream."
- "A movie that feels like walking through Tokyo at 2 AM."
- "Something beautiful but emotionally devastating."
- "An anime that makes me want to change my life."
- "Something that reminds me of childhood summer holidays."
- "A slow, atmospheric film with beautiful cinematography."
- "Something mysterious, unsettling and psychologically complex."

This is not a Netflix clone, IMDb clone, or Letterboxd clone.

It should feel like an entirely different way of discovering entertainment.

---

# 1. DEVELOPMENT APPROACH

Do not just generate a static landing page or a visual prototype.

Build a functioning, responsive, properly connected application.

Before making changes:

1. Inspect the existing project and its file structure.
2. Understand the current implementation.
3. Preserve useful working code.
4. Identify missing functionality and technical problems.
5. Establish a clean implementation plan.

Then implement the application in the existing workspace.

Do not stop after producing a plan, mockup, or explanation.

Do not replace functioning features with placeholders.

Every visible interactive element must work.

If an external integration is unavailable, implement an honest fallback rather than pretending it works.

## Technology stack

Use a lightweight, low-cost architecture:

- Next.js with App Router
- TypeScript
- Tailwind CSS
- Framer Motion
- Lucide React
- TMDB API as the initial primary entertainment catalogue
- Next.js server-side API routes
- Vercel Hobby deployment
- localStorage for guest preferences, watchlists, quiz progress and interaction history

Avoid introducing unnecessary infrastructure.

Do not initially use:

- Supabase
- Paid AI APIs
- Gemini API
- A separate authentication provider
- Unnecessary paid services

The initial version must work without an LLM API.

Use deterministic, metadata-driven recommendation logic first. Design the recommendation engine so an optional AI interpretation layer can be added later without rewriting the entire application.

## AniList integration condition

AniList's public GraphQL API does not require authentication for public catalogue queries. However, its current terms restrict competing, non-complementary services.

Therefore:

- Do not integrate AniList into the production recommendation engine until its permission requirements have been checked and the proposed use has been cleared.
- Build a modular provider adapter so AniList can be added later if permitted.
- Use TMDB for anime catalogue discovery in the initial release.
- Never make the application dependent on an unapproved API integration.

---

# 2. THE MOST IMPORTANT PART: RECOMMENDATION ENGINE

This is the heart of CineVibz.

Spend more engineering and testing effort on this feature than on any other feature.

A visually beautiful application with mediocre recommendations is a failed CineVibz.

The goal is not to return vaguely similar movies. The goal is to identify titles that genuinely match the user's requested emotional experience.

## 2.1 Natural-language mood interpretation

Build a mood interpretation system that converts a user's prompt into structured recommendation signals.

For example:

Input:
"Give me something that feels like wandering through Tokyo at 2 AM."

Interpretation:

- Atmosphere: urban, nocturnal, introspective
- Visual mood: neon, atmospheric, cinematic
- Emotional tone: lonely, contemplative
- Setting: city, preferably nighttime
- Pacing: potentially slow or meditative
- Genre: unrestricted
- Format: unrestricted

Another example:

Input:
"Something beautiful but emotionally devastating."

Interpretation:

- Emotional tone: melancholic, heartbreaking
- Themes: loss, love, memory, grief
- Atmosphere: intimate, reflective
- Visual quality: aesthetically expressive
- Genre: unrestricted

The interpretation must distinguish between:

- Mood
- Atmosphere
- Emotional tone
- Themes
- Visual aesthetics
- Setting
- Narrative themes
- Pacing
- Genre
- Format
- Language and region
- Time period

Do not assume every mood prompt implies a genre.

A user asking for something dreamy should not automatically receive fantasy films.

A user asking for something devastating should not automatically receive romantic dramas.

## 2.2 Build a structured mood taxonomy

Create a reusable internal mood taxonomy.

Possible dimensions include:

**Emotional spectrum**

- Euphoric
- Nostalgic
- Melancholic
- Comforting
- Heartbreaking
- Hopeful
- Unsettling
- Mysterious
- Reflective
- Wholesome
- Existential
- Chaotic
- Romantic
- Surreal

**Atmosphere**

- Dreamlike
- Ethereal
- Gritty
- Dreamy
- Neon-lit
- Atmospheric
- Minimalist
- Grand
- Intimate
- Isolated
- Whimsical
- Dystopian
- Otherworldly

**Experience**

- Life-changing
- Escapist
- Thought-provoking
- Emotionally intense
- Meditative
- Adventurous
- Comfort viewing
- Mind-bending
- Immersive

These are starting categories, not a restrictive list.

Support combinations and nuanced descriptions.

## 2.3 Candidate retrieval

Do not recommend titles from a tiny hardcoded collection.

Retrieve a sufficiently broad candidate pool from the actual catalogue using appropriate provider endpoints.

Use:

- TMDB search
- Discover endpoints
- Genre and keyword filters
- Popularity and trending endpoints
- Release-date filters
- Language and region filters
- Movie and TV endpoints
- Pagination

Retrieve candidates before ranking them.

Never confuse candidate retrieval with final recommendation ranking.

## 2.4 Multi-stage recommendation pipeline

Implement a genuine recommendation pipeline:

**Stage A — Understand the request**

Convert the natural-language prompt into structured mood dimensions and explicit constraints.

**Stage B — Retrieve candidates**

Find a broad set of actual catalogue records that could match.

**Stage C — Enrich metadata**

Retrieve relevant metadata for the candidate records where necessary.

**Stage D — Score candidates**

Build a weighted relevance-scoring system.

The scoring system should consider:

- Emotional tone similarity
- Mood similarity
- Atmosphere similarity
- Theme similarity
- Visual/aesthetic similarity when reliable metadata exists
- Genre relevance
- Setting relevance
- Pacing relevance when reliable evidence exists
- User preferences
- User feedback
- Format and language constraints
- Catalogue confidence

Treat genre as one signal, not the dominant signal.

Do not invent metadata to make a title appear relevant.

**Stage E — Rerank**

Sort by actual relevance to the user's prompt, not simply popularity or rating.

**Stage F — Diversify**

Avoid returning ten nearly identical films.

Include meaningful variation while preserving the original mood.

**Stage G — Explain**

For each result, explain specifically why it matches the user's request.

Avoid generic descriptions such as "This is a great movie for you."

## 2.5 Recommendation scoring

Create a transparent, configurable scoring architecture.

An initial scoring model could use:

- Mood and emotional match: 30%
- Atmosphere match: 20%
- Theme match: 15%
- Visual and setting match: 10%
- Genre relevance: 10%
- User preference alignment: 10%
- Quality and metadata confidence: 5%

These are initial weights, not permanent truths.

Test and tune them using curated examples.

Explicit user constraints must be treated as hard filters where appropriate.

For example:

- If the user asks for anime only, do not return live-action films.
- If the user asks for movies, do not return TV series.
- If the user excludes a language, respect that.
- If the user asks for a particular time period, apply it.

Do not let popularity override a strong mood match.

A lesser-known film that genuinely fits should rank above a famous film that barely matches.

## 2.6 Explainable recommendations

Every recommendation should include:

- Actual title
- Correct poster
- Release year
- Media type
- Genre information
- Rating and rating source
- A short synopsis
- A personalized explanation of why it matches the prompt
- A match indicator based on the internal relevance score

Do not present an internal relevance score as an objectively measured probability.

The explanation must be grounded in available metadata and known themes.

If evidence is insufficient, say so rather than inventing a reason.

## 2.7 Recommendation feedback loop

Allow users to interact with recommendations:

- This is exactly my vibe.
- Not my vibe.
- Already watched.
- More like this.
- Less like this.
- Save to watchlist.

Store lightweight preferences locally.

Use this information to improve subsequent rankings.

Do not overfit to one interaction.

Provide a way to reset preferences.

## 2.8 Recommendation quality testing

Create a dedicated recommendation test suite.

Include at least 30 diverse mood prompts.

Test:

- Nostalgic prompts
- Surreal prompts
- Specific atmospheric prompts
- Emotionally complex prompts
- Anime-specific prompts
- International cinema prompts
- Genre-independent prompts
- Highly specific constraints
- Contradictory or ambiguous prompts

For each test prompt, define a small set of expected relevant characteristics and manually curated example titles where appropriate.

Measure:

- Relevance of top results
- Diversity
- Constraint compliance
- Metadata completeness
- Duplicate frequency
- Incorrect-format results
- Explanation accuracy

Do not claim the algorithm is perfect because it returns results.

Make recommendation quality an ongoing engineering priority.

---

# 3. REAL DATA AND CATALOGUE INTEGRITY

Use TMDB as the initial source of truth.

API documentation:
https://developer.themoviedb.org/docs

API requests must go through server-side routes.

Store the TMDB API credential in an environment variable.

Never expose API secrets in browser code or commit them to GitHub.

Use provider IDs as unique identifiers.

Every image must correspond to the exact provider record.

Non-negotiable rules:

- No invented movie titles.
- No fake demo catalogues in production-facing sections.
- No fabricated ratings.
- No fabricated release years.
- No fabricated runtimes.
- No fabricated synopsis.
- No fabricated streaming availability.
- No random poster images.
- No keyword-based image substitution.
- No poster reuse between unrelated titles.
- No AI-generated movie posters.

Construct TMDB image URLs using the image paths returned by the corresponding TMDB record.

If an image is missing, display a designed fallback.

Show the appropriate source attribution in the application.

Do not scrape IMDb, streaming services or other restricted platforms.

Support pagination so users can search a broad catalogue rather than being limited to the first few results.

Be honest that no single database guarantees every film ever created.

---

# 4. HOMEPAGE STRUCTURE

The homepage must follow this exact order.

### 1. Navigation

- CineVibz logo
- Discover
- Movies
- Series
- Anime
- Watchlist
- Daily Screen Test
- Profile or guest menu

### 2. Hero — Mood Discovery

This is the main identity of CineVibz.

Large expressive headline:

"What's the feeling?"

Supporting text:

"Tell us what you're in the mood for. We'll find something worth getting lost in."

Include a large natural-language input.

Placeholder examples should rotate:

- Something that feels like a fever dream...
- A film for a rainy Sunday evening...
- Something that makes me question reality...
- An anime that feels like starting life again...

Include a prominent discovery action.

The input must trigger the actual recommendation pipeline.

### 3. Today's Rabbit Hole

A daily curated recommendation collection.

- Refresh once per day.
- Show a small selection of interesting titles.
- Mix genres, countries and formats.
- Avoid repeating yesterday's collection unnecessarily.
- Use a stable date-based selection.
- Explain why each title is worth exploring.

### 4. Weekly Cut

A weekly editorial collection.

- Refresh once per week.
- Give it a distinctive theme.
- Include films, series and animation where appropriate.
- Avoid simply duplicating Today's Rabbit Hole.
- Keep the selection stable throughout the week.

### 5. Popular Choices

Show broadly popular titles using actual catalogue data.

This should represent established popularity rather than short-term trending activity.

### 6. Trending Now

Show titles that are currently gaining attention.

Use an appropriate trending provider endpoint.

Do not simply duplicate Popular Choices.

### 7. Find Your Frequency

An interactive mood-exploration section.

Allow users to explore moods visually.

Examples:

- The Nostalgia Trip
- Beautifully Broken
- Neon Nights
- Existential Hours
- Soft Escapism
- Mind-Bending Reality
- Pure Chaos
- Comfort Zone

Selecting a mood should trigger actual recommendations.

### 8. Outside Your Algorithm

Discover titles beyond mainstream popularity.

Include:

- International cinema
- Hidden gems
- Cult classics
- Unusual animation
- Independent films
- Documentaries
- Underrated series

Do not randomly label titles as hidden gems.

Use sensible popularity and catalogue criteria.

### 9. Watch Roulette

A smaller playful feature.

Let the user spin for a random title from a real catalogue candidate pool.

Allow filters for:

- Format
- Genre
- Language
- Release period

Never use a hardcoded fake pool.

### 10. Daily Screen Test

A small daily quiz.

- Five questions per quiz.
- Let users select a quiz category before beginning.
- Use a verified local question bank.
- Do not generate fake facts.
- Same daily questions for each category.
- Save progress locally.
- Preserve progress after refresh.
- Track score and streak.
- Include an explanation after each answer.

### 11. Footer

Include:

- About CineVibz
- Data attribution
- Contact
- Privacy
- Terms
- API credits

---

# 5. DAILY AND WEEKLY CONTENT

Daily and weekly recommendations must be stable.

Do not generate a completely different collection every time someone refreshes the page.

Use:

- Asia/Kolkata as the initial date boundary.
- A daily date key.
- A weekly date key.
- Deterministic selection and ranking.
- Server-side caching with suitable revalidation.

Keep in mind that serverless in-memory storage is not reliable persistent storage across instances.

Do not claim that a daily collection is globally persisted unless the architecture actually guarantees it.

For the first version, a deterministic date-based collection from real provider candidates is acceptable.

---

# 6. SEARCH AND DISCOVERY

Build a functional global search.

Users should be able to search for:

- Exact movie titles
- Anime titles
- Series
- Animated films
- Documentaries
- International films

Include:

- Debounced search
- Loading state
- Empty state
- Error state
- Pagination or load-more
- Type filters
- Genre filters
- Year filters
- Language filters

Search results must come from actual provider records.

Clicking a result should open a dedicated detail page.

---

# 7. TITLE DETAIL PAGES

Each title should have a dedicated detail page.

Include:

- Correct poster and backdrop
- Title and alternate title when available
- Release date
- Runtime when available
- Media type
- Genres
- Synopsis
- Rating with source attribution
- Cast and crew when available
- Related titles
- Similar titles
- Watchlist action

For anime, show anime-specific metadata when it is available from the approved catalogue source.

Never mix rating scales from different providers without clearly identifying the source.

Do not invent streaming availability.

---

# 8. WATCHLIST AND PERSONALIZATION

Start with a guest-first experience.

Users should be able to:

- Save titles.
- Remove titles.
- Mark titles as watched.
- Maintain mood preferences.
- View previous discoveries.
- Reset preferences.

Persist this information using localStorage initially.

Do not force account creation to use the core discovery experience.

Design the architecture so authentication and cloud synchronization can be added later.

---

# 9. VISUAL DESIGN SYSTEM

The design must feel experimental, cinematic, psychedelic and unconventional.

Brand personality:

- Expressive
- Playful
- Cinematic
- Slightly chaotic
- Nostalgic
- Modern
- Artistic
- Intuitive

## Colour palette

- Void: #17121F
- Deep Aubergine: #251832
- Electric Violet: #873BFF
- Acid Cyan: #30D5E8
- Solar Orange: #FF8B45
- Electric Pink: #FF5C9A
- Film Cream: #F5EBD8

Typography:

- Space Grotesk
- Syne
- Inter or Manrope

Visual direction:

- Editorial typography
- Cinematic imagery
- Asymmetric layouts
- Organic gradients
- Subtle film grain
- Halftone textures
- Expressive poster compositions
- Unusual section transitions
- Subtle motion
- Experimental hover interactions

Avoid:

- Generic SaaS design
- Excessive glassmorphism
- Repeated rounded-card grids
- Overly corporate layouts
- Excessive gradients everywhere
- Unnecessary animation
- Cluttered navigation
- Template-looking sections

Design principle:

**Weird in its personality. Effortless in its usability.**

Make the homepage feel like entering an experimental cinema universe.

---

# 10. PERFORMANCE AND COST CONTROL

The application must remain inexpensive to operate.

Implement:

- Server-side API requests
- Appropriate caching
- Request deduplication
- Debounced search
- Pagination
- Error handling
- Rate-limit handling
- Lazy-loaded posters
- Optimized images
- Efficient client-side state
- No unnecessary API requests

Do not call an AI API for every page load.

The initial recommendation engine must work without Gemini or another paid LLM.

Never assume a free API tier means unlimited usage.

---

# 11. SAFETY AND CONTENT FILTERING

Provide sensible content controls.

- Exclude adult-only content from general recommendations.
- Respect age-appropriate content filters.
- Do not make mature content the default.
- Provide clear content warnings where appropriate.
- Do not expose adult-content catalogue entries through mood discovery by default.

---

# 12. RESPONSIVENESS AND ACCESSIBILITY

Build for:

- Desktop
- Laptop
- Tablet
- Mobile

Ensure:

- Responsive navigation
- Readable typography
- Proper keyboard navigation
- Accessible form controls
- Visible focus states
- Good contrast
- Reduced-motion support
- Appropriate loading skeletons
- Useful empty and error states

The mobile experience must feel intentionally designed, not merely compressed.

---

# 13. ENGINEERING QUALITY

Use a clean, modular project structure.

Separate:

- Provider integrations
- Recommendation logic
- Mood interpretation
- Candidate retrieval
- Ranking and reranking
- Caching
- Search
- User preferences
- UI components
- Shared types
- Utility functions

Use TypeScript types for provider records and normalized media records.

Avoid giant components.

Avoid duplicating business logic.

Handle missing fields and provider failures gracefully.

Never expose secrets.

Create a `.env.example` containing the required environment variable names, not real credentials.

Add a useful README explaining:

- Installation
- Environment variables
- Local development
- API setup
- Recommendation architecture
- Deployment
- Attribution requirements

---

# 14. FINAL VALIDATION CHECKLIST

Before considering the implementation complete, verify:

1. The homepage follows the exact requested section order.
2. The mood input triggers real recommendations.
3. Mood interpretation works for natural-language prompts.
4. Recommendations are ranked by relevance, not just popularity.
5. The system respects explicit user constraints.
6. Posters correspond to the exact catalogue records.
7. Search works against real provider data.
8. Detail pages display actual metadata.
9. Daily recommendations remain stable for the day.
10. Weekly recommendations remain stable for the week.
11. Popular and trending sections are distinct.
12. Watch Roulette uses real catalogue records.
13. The daily quiz works and persists progress.
14. Watchlist functionality works.
15. The application works without a paid AI API.
16. No secrets are exposed in frontend code.
17. Mobile layouts work properly.
18. Loading, empty and error states are handled.
19. No fake production data remains.
20. The recommendation test suite runs successfully.

Fix errors discovered during validation.

Do not claim a feature is complete unless it has actually been implemented and tested.

---

# FINAL PRODUCT STANDARD

CineVibz should not feel like a database with posters.

It should feel like a discovery experience.

A person should be able to arrive without knowing what they want to watch, describe a feeling in their own words, and discover something they might never have found otherwise.

The recommendation engine is the product's most important differentiator.

Prioritize recommendation relevance, catalogue integrity, meaningful explanations and user satisfaction over adding more features.

Build something distinctive, polished, functional and genuinely useful.

**CineVibz — Find your next feeling.**
