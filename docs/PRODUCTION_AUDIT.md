# CineVibz production quality audit

Audit started 17 November 2026 and continued across midnight in Asia/Kolkata on 18 November. Baseline: commit `077b374` at https://cinevibz.vercel.app. This is an evidence-based audit of sampled flows, not a claim that every title, browser or natural-language request has been validated.

## Priorities and confirmed findings

No P0 outage, credential exposure or irreversible data-loss issue was confirmed in the inspected flows. P1 means a core discovery or persistence flow produces materially incorrect behaviour. It does not mean the entire service is down.

| Priority           | Reproduction / evidence                                                                                                                                                       | Fix                                                                                                                                                                                                                                                       |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P1                 | The live daily comfort pick was Spirited Away, supported only by “family” in its synopsis. Some other daily explanations admitted genre-only selection.                       | Editorial eligibility now requires enriched metadata, defined theme criteria, a minimum evidence threshold and support for every interpreted theme signal. Genre-only filler is excluded. Retrieval also searches the theme's defining keywords.          |
| P1                 | Naruto resolved to a fighter's credits; Spider-Man to a person with no results; Vikram and Maharaja to people instead of exact titles.                                        | Bare exact title matches take precedence over person-name collisions. Explicit actor/director queries and person selections still use verified credits. Exact movie/series ties use vote evidence instead of movie-array order.                           |
| P1                 | “Peaceful for a rainy evening” and “end of summer” had no mood signals and fell through to title search.                                                                      | Added peaceful/rainy and summer interpretation. Summer requests require actual seasonal evidence, not nostalgia alone.                                                                                                                                    |
| P1                 | A mind-bending thriller was ranked using investigation alone; visual requests were padded with mystery-only matches. Some incomplete requests were labelled Strong resonance. | Added distinct mind-bending evidence, required defining experience/setting/style evidence, raised the admission threshold, and named unsupported dimensions. Only up to five qualifying discoveries are returned. No quota is filled with weaker results. |
| P1                 | `under 90 minutes` plus a 150-minute override broadened the constraint to 150.                                                                                                | The stricter runtime limit wins. Existing country/language/genre checks remain in place.                                                                                                                                                                  |
| P1                 | A null quiz entry could reset otherwise valid saved state; invalid completed-day values could break streak calculations; malformed cached collections could crash rendering.  | Validate restored dates, collections and preference/history fields, isolate malformed entries, and preserve valid saved titles and progress.                                                                                                              |
| Required migration | Existing daily/weekly snapshots would retain previously selected weak picks after deployment.                                                                                 | Editorial cache version 3 invalidates only those snapshots. Watchlists, quizzes, history, preferences and streaks remain saved.                                                                                                                           |

The selection thresholds are engineering heuristics, not calibrated probabilities or measured user-satisfaction scores. Comfort also rejects contradictory crime/horror/war/thriller and distress metadata. The conservative rule can reject films some viewers personally find comforting.

## Validation performed

- Baseline suite: 120 tests passed before application edits.
- An isolated copy of baseline application code was exercised with the added regression cases: 18 cases failed, reproducing the discovered failures without changing the running app. The final suite contains additional coverage beyond that reproduction run.
- Final checks: see the test/build command results recorded below and the deployment verification report. Tests, type generation, TypeScript, production build and formatting were actually executed.
- `scripts/production-audit.mjs` captures one home response, the ten requested mood prompts, 22 title/person/regional searches and all six roulette format settings. Full responses stay in ignored `work/production-audit/`; the compact evidence is in `production-audit-results.json`.
- The existing catalogue checks cover Ram Charan credits, Peddi details, exact-title ordering, Indian origin, South Indian languages, Malayalam thrillers, announced titles, conflicts, family filtering, pagination and empty searches.
- Engagement checks cover editorial evidence, weekly criteria, recent-pick exclusion, dislikes, repeated anime spins, documentary genre, date ranges, empty draws and daily challenge responses.
- The old engagement test required five filled daily slots and nonempty output for a restrictive challenge. Those quota assertions were deliberately replaced with stricter evidence/identity assertions. A general-mode challenge can now return no results; that is recorded, not hidden.
- Homepage document overflow measured at 320, 390, 430, 768 and 1440 pixels: none. Desktop and 320-pixel layouts visually inspected. Mobile menu keyboard activation worked. At 320 pixels quiz answers measured approximately 48px high, with no horizontal overflow. No unnamed homepage buttons were found in the DOM check. This is a focused accessibility review, not WCAG certification.
- All nine quiz categories, five-question attempts, answer validation, archived scores, unseen-first replays, stable daily seeds and duplicate streak-day prevention run in the automated suite. Academy facts were spot-checked against the [2020](https://www.oscars.org/oscars/ceremonies/2020) and [2004](https://www.oscars.org/oscars/ceremonies/2004) ceremony records. All 427 question variants were **not** independently fact-checked again in this round.

## Coverage and remaining limitations

| Area                     | Result / limit                                                                                                                                                                                                                                                                                                       |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mood quality             | Confirmed failures repaired; each sampled first-five list and its actual metadata evidence is retained. Some metaphorical requests still have only partial support. TMDB keywords are not a substitute for human editorial judgement.                                                                                |
| Search and Indian cinema | Tested all named audit queries, including the distinct Hindi/Malayalam Drishyam records, actors/directors, and Spirited Away's romanized Japanese title. No Hindi-only interpretation of Indian cinema; no invented anime media type. Other transliterations still depend on provider aliases.                       |
| Daily/weekly editions    | India day/week keys and browser snapshot persistence tested. The audit crossed an actual India midnight. Current seeded editions stay fixed once stored in that browser. Clearing storage or using another browser may produce a different edition as metadata changes; there is no shared server snapshot database. |
| Roulette                 | Six formats sampled; existing checks verify repeated exclusions, anime/year constraints, documentary, reversed dates and empty draws. This is not exhaustive testing of every combined filter or a concurrency load test.                                                                                            |
| Quiz/streaks/challenges  | Logic and corrupt-state recovery tested. A finite question bank eventually repeats. No cloud/cross-device progress sync.                                                                                                                                                                                             |
| Accessibility            | Requested widths and representative controls inspected. Full screen-reader navigation, every touch target, contrast audit and native-device browser matrix remain unverified. Reduced-motion CSS and Framer Motion settings were inspected, not tested on every operating system.                                    |
| Catalogue integrity      | Existing provider normalization tests retain media-type-plus-ID identity, original artwork and missing-data fallbacks. Live title/credit checks passed. Provider factual mistakes or duplicate catalogue entries remain possible.                                                                                    |
| Performance              | Bounded concurrency and existing timeouts retained. Extra keyword-based editorial retrieval adds work on a cold cache. No production load test or cost benchmark was conducted.                                                                                                                                      |

The next quality step should be a human-labelled set of unusual prompts with positive and negative examples, measuring relevance separately from constraint compliance. Do not present structural test counts or keyword coverage as evidence that recommendations are “perfect.” No paid API, new service, UI redesign or database migration was introduced.

## Reproduce

```bash
npm test
npm run typecheck
npm run build
npm run format:check
CINEVIBZ_TEST_URL=https://cinevibz.vercel.app npm run test:live
CINEVIBZ_TEST_URL=https://cinevibz.vercel.app CINEVIBZ_AUDIT_OUTPUT=work/production-audit/production.json node scripts/production-audit.mjs
```

Local verification, baseline production evidence and exact changed files are recorded in `production-audit-results.json`. Post-deployment smoke verification is reported separately after publication. A successful build alone does not establish that the live deployment works.
