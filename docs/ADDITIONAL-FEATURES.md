# CINEVIBZ — ADDITIONAL FEATURE REQUIREMENTS

## Daily Discovery, Games & Engagement System

These features are an important part of CineVibz. Do not treat them as decorative homepage sections. They must be fully functional, connected to real catalogue data where applicable, and designed to encourage users to return.

# 1. DAILY RECOMMENDATIONS — TODAY'S RABBIT HOLE

Create a personalized daily discovery experience.

Every day, users should discover a fresh collection of entertainment.

Requirements:

- Refresh once daily using the Asia/Kolkata date boundary.
- Keep the collection consistent throughout the day.
- Use real TMDB catalogue records.
- Include movies, anime, animation, documentaries and series where available.
- Prioritize relevance, variety and discovery.
- Avoid repeating recently shown titles unnecessarily.
- Do not simply show the same popular titles every day.

Each daily recommendation should include:

- Poster
- Title
- Year
- Media type
- Rating and its source
- Short synopsis
- Why today's selection is interesting
- A unique editorial description

Add a feature called **"Why This Today?"** explaining why the title was selected.

Create different daily discovery themes, such as:

- One for the soul
- Something unexpected
- The midnight pick
- A forgotten gem
- A beautiful disaster
- The comfort watch
- The mind-bender

The theme must influence the actual selection, not just its heading.

# 2. WEEKLY PICKS — THE WEEKLY CUT

Create a weekly editorial collection.

Requirements:

- Refresh every Monday according to Asia/Kolkata time.
- Remain consistent throughout the week.
- Have a distinct weekly theme.
- Include a curated mix of formats, countries and genres.
- Avoid unnecessary overlap with daily recommendations.
- Explain why each title belongs in the weekly collection.

Example weekly themes:

- Films that stay with you
- Beyond the mainstream
- The art of feeling
- Stories from somewhere else
- Animation that hits differently
- The beautiful and bizarre

# 3. WATCH ROULETTE — THE RANDOM DISCOVERY GAME

Create a visually exciting entertainment roulette.

This should be one of the fun signature features of CineVibz.

The user clicks SPIN and gets a random recommendation from a genuine catalogue pool.

The experience:

- Animated spinning wheel or cinematic roulette interface.
- A satisfying spin animation.
- A reveal moment with the selected title.
- Correct poster and actual catalogue information.
- A button to explore the selected title.
- A spin-again option.

Allow users to customize the roulette:

- Movies
- Anime
- Series
- Animation
- Documentaries
- Any format
- Genre
- Language
- Release period

Important:

- Use real TMDB records.
- Never use a hardcoded fake collection.
- Exclude titles already selected in the current roulette session where possible.
- Avoid showing the same result repeatedly.
- If filters produce too few results, explain that and suggest broadening them.

# 4. DAILY SCREEN TEST — THE DAILY QUIZ

Build a daily entertainment quiz.

This should be a proper playable experience, not a static quiz card.

## Quiz categories

Before starting, users choose a category:

- Movies
- Anime
- International Cinema
- TV & Series
- Animation
- General Cinema
- Directors & Filmmakers
- Soundtracks & Music
- Film History

## Quiz structure

- Five questions per daily quiz.
- Multiple-choice answers.
- One correct answer.
- A short explanation after every answer.
- Final score and result screen.
- Daily streak.
- Best score.
- Category-wise progress.

## Question quality

Create a verified question bank.

Questions must be factually correct.

Do not fabricate film facts, character names, release years or directors.

Use locally stored verified questions for the initial release rather than making expensive AI calls.

## Daily consistency

- Each category gets its own daily question set.
- Questions remain the same throughout that day.
- Refresh at midnight Asia/Kolkata.
- Users cannot reset the daily attempt simply by refreshing.
- Preserve progress after page refresh.
- Save completed scores and streaks in localStorage.

Make the quiz visually playful, fast and cinematic.

# 5. DAILY MOOD CHALLENGE

Introduce an additional small daily activity called **"Today's Feeling."**

Every day, present one unusual emotional or atmospheric prompt.

Examples:

- "Find something that feels like an unfinished goodbye."
- "Find a story that feels like a dream you almost remember."
- "Find something that captures the feeling of being 17."
- "Find a film that feels like the world is ending, but beautifully."
- "Find something that feels like an unexpected adventure."

Users can:

- Explore recommendations for the prompt.
- Save their favourite discovery.
- Mark the challenge complete.

Use the recommendation engine to interpret and fulfil the daily challenge.

Keep the daily challenge stable for the day.

# 6. DAILY DISCOVERY STREAKS

Create a lightweight return-engagement system.

Users can build a streak by:

- Completing the Daily Screen Test.
- Exploring Today's Rabbit Hole.
- Completing Today's Feeling challenge.

Requirements:

- Store progress locally.
- Show current streak and longest streak.
- Avoid counting multiple activities as multiple days.
- One completed day should count as one streak day.
- Clearly explain how streaks work.
- Do not punish users with aggressive notifications or manipulative mechanics.

# 7. PERSONALIZED DISCOVERY HISTORY

Add a section called **"Your Rabbit Holes."**

Track locally:

- Previous mood searches.
- Titles explored.
- Titles saved.
- Quiz history.
- Completed daily challenges.
- Roulette discoveries.

Allow users to revisit their previous discoveries.

Provide a clear option to erase local history.

# 8. HOMEPAGE PLACEMENT

Preserve the previously specified homepage order.

Add the engagement features without overwhelming the main recommendation experience.

The order must remain:

1. Navigation
2. Hero — Mood Discovery
3. Today's Rabbit Hole
4. The Weekly Cut
5. Popular Choices
6. Trending Now
7. Find Your Frequency
8. Outside Your Algorithm
9. Watch Roulette
10. Daily Screen Test
11. Today's Feeling
12. Your Rabbit Holes (when relevant)
13. Footer

Watch Roulette, Daily Screen Test and Today's Feeling should be visually smaller than the primary discovery sections, but still distinctive and inviting.

# 9. IMPLEMENTATION AND VALIDATION

All these features must be functional.

Do not create buttons that do nothing.

Do not use fake quiz questions presented as verified facts.

Do not use fake entertainment catalogue entries.

Persist appropriate progress using localStorage.

Use date keys based on Asia/Kolkata.

Handle refreshes, duplicate attempts, missing data and empty states.

Make sure daily and weekly content stays consistent across refreshes.

The goal is to make CineVibz a place people return to because there is always something new to discover and something fun to do.

**Discovery is the core. Playfulness is the personality.**
